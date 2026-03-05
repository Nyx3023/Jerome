const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require('nodemailer');

const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';

// Signup function
exports.signup = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const validRoles = ["user", "doctor", "admin", "staff"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role specified" });
        }

        // Enforce Gmail-only for new signups
        const isGmail = /@gmail\.com$/i.test(email);
        if (!isGmail) {
            return res.status(400).json({ error: "Only Gmail addresses are allowed for signup" });
        }

        const checkUserQuery = "SELECT * FROM users WHERE email = ?";
        db.query(checkUserQuery, [email], async (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });

            if (result.length > 0) {
                return res.status(400).json({ error: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = crypto.randomBytes(32).toString('hex');

            // Start a transaction
            db.beginTransaction(async (err) => {
                if (err) return res.status(500).json({ error: "Database error" });

                try {
                    // Insert into users table
                    const userSql = "INSERT INTO users (email, password, role, email_verified, email_verification_token) VALUES (?, ?, ?, ?, ?)";
                    db.query(userSql, [email, hashedPassword, role, 0, verificationToken], (err, userResult) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Database error" });
                            });
                        }

                        const userId = userResult.insertId;

                        if (role === 'user') {
                            // Do NOT auto-create patients on signup (per new policy)
                            // Just commit user creation
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: "Database error" });
                                    });
                                }

                                sendVerificationEmail(email, verificationToken)
                                    .then(() => {
                                        res.json({
                                            message: `Account created. Please check your email to verify your account.`,
                                            role
                                        });
                                    })
                                    .catch(() => {
                                        res.json({
                                            message: `Account created. Please verify your email using the link.`,
                                            role
                                        });
                                    });
                            });
                        } else {
                            // For non-user roles, commit transaction and return response
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({ error: "Database error" });
                                    });
                                }

                                // Send verification email and return message only
                                sendVerificationEmail(email, verificationToken)
                                    .then(() => {
                                        res.json({
                                            message: `Account created. Please check your email to verify your account.`,
                                            role
                                        });
                                    })
                                    .catch(() => {
                                        res.json({
                                            message: `Account created. Please verify your email using the link.`,
                                            role
                                        });
                                    });
                            });
                        }
                    });
                } catch (error) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Database error" });
                    });
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const checkUserQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkUserQuery, [email], async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // If the account has a verification token set and is not verified, block login
        // This allows grandfathering of existing accounts that have no token (null)
        if ((user.email_verification_token && user.email_verification_token !== null) && Number(user.email_verified) !== 1) {
            return res.status(403).json({ error: "Please verify your email before logging in" });
        }

        // Create a JWT token with user ID and role
        const token = jwt.sign(
            { id: user.id, role: user.role },
            SECRET_KEY,
            { expiresIn: "24h" }
        );

        // Get user profile if it exists
        const profileQuery = "SELECT * FROM patients WHERE user_id = ?";
        db.query(profileQuery, [user.id], (err, profileResult) => {
            if (err) return res.status(500).json({ error: "Database error" });

            const profile = profileResult[0] || null;

            const displayName = profile
                ? [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')
                : user.email.split('@')[0];

            // Fetch license_number and name for doctors and staff from their respective tables
            const getLicenseNumber = (callback) => {
                // First priority: use license_number from users table
                if (user.license_number) {
                    return callback(user.license_number, null);
                }

                // Fallback: check doctor or staff table for legacy data
                if (user.role === 'doctor') {
                    db.query("SELECT license_number, name FROM doctors WHERE user_id = ?", [user.id], (err, doctorResult) => {
                        if (err || !doctorResult || doctorResult.length === 0) {
                            return callback(null, null);
                        }
                        callback(doctorResult[0].license_number, doctorResult[0].name);
                    });
                } else if (user.role === 'staff') {
                    db.query("SELECT license_number, name FROM staff WHERE user_id = ?", [user.id], (err, staffResult) => {
                        if (err || !staffResult || staffResult.length === 0) {
                            return callback(null, null);
                        }
                        callback(staffResult[0].license_number, staffResult[0].name);
                    });
                } else {
                    callback(null, null);
                }
            };

            getLicenseNumber((license_number, staffName) => {
                const finalDisplayName = staffName || displayName;
                
                res.json({ 
                    message: "Login successful", 
                    token,
                    role: user.role,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: finalDisplayName,
                        role: user.role,
                        profile: profile,
                        license_number: license_number,
                        must_change_password: Number(user.must_change_password || 0) === 1
                    }
                });
            });
        });
    });
};

// Change password for authenticated user
exports.changePassword = async (req, res) => {
    const userId = req.user?.id;
    const { current_password, new_password } = req.body || {};

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'current_password and new_password are required' });
    }
    if (String(new_password).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    db.query('SELECT password FROM users WHERE id = ? LIMIT 1', [userId], async (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const matches = await bcrypt.compare(current_password, rows[0].password);
        if (!matches) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        try {
            const hashed = await bcrypt.hash(new_password, 10);
            const updateSql = 'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?';
            db.query(updateSql, [hashed, userId], (updErr) => {
                if (updErr) {
                    console.error('Database error:', updErr);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Password changed successfully' });
            });
        } catch (e) {
            console.error('Hashing error:', e);
            res.status(500).json({ error: 'Server error' });
        }
    });
};

// Verify email endpoint
exports.verifyEmail = (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
    }

    const findSql = "SELECT id FROM users WHERE email_verification_token = ?";
    db.query(findSql, [token], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) {
            return res.status(400).json({ error: "Invalid or expired verification token" });
        }

        const userId = results[0].id;
        const updateSql = "UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?";
        db.query(updateSql, [userId], (err) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({ message: "Email verified successfully. You can now log in." });
        });
    });
};

// Update license number for authenticated user
exports.updateLicenseNumber = (req, res) => {
    const userId = req.user?.id;
    const { license_number } = req.body || {};

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = 'UPDATE users SET license_number = ? WHERE id = ?';
    db.query(sql, [license_number || null, userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ 
            message: 'License number updated successfully',
            license_number: license_number 
        });
    });
};

// Get current user's data
exports.getCurrentUser = (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = 'SELECT id, email, role, license_number FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]);
    });
};

// Resend verification email
exports.resendVerification = (req, res) => {
    const emailRaw = (req.body?.email || '').toString().trim().toLowerCase();

    if (!emailRaw) {
        return res.status(400).json({ error: "Email is required" });
    }

    const findUserSql = "SELECT id, email_verified FROM users WHERE email = ?";
    db.query(findUserSql, [emailRaw], (err, users) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // Always return generic success to avoid email enumeration
        if (!users || users.length === 0) {
            return res.json({ message: "If the account exists, a verification email has been sent." });
        }

        const user = users[0];
        if (Number(user.email_verified) === 1) {
            return res.json({ message: "This account is already verified." });
        }

        const newToken = crypto.randomBytes(32).toString('hex');
        const updateSql = "UPDATE users SET email_verification_token = ? WHERE id = ?";
        db.query(updateSql, [newToken, user.id], (updErr) => {
            if (updErr) return res.status(500).json({ error: "Database error" });

            sendVerificationEmail(emailRaw, newToken)
                .then(() => {
                    res.json({ message: "Verification email resent. Please check your inbox." });
                })
                .catch(() => {
                    res.json({ message: "Verification email resent. Please check your inbox." });
                });
        });
    });
};

function sendVerificationEmail(toEmail, token) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    });

    const mailOptions = {
        from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
        to: toEmail,
        subject: 'Verify your email address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Verify Your Email Address</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        Thank you for creating an account! To complete your registration and start using our services, please verify your email address by clicking the button below.
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${verifyLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        If the button doesn't work, you can copy and paste this link into your browser:<br>
                        <span style="word-break: break-all; color: #4F46E5;">${verifyLink}</span>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #888; font-size: 12px; text-align: center;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}
