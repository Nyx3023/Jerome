const db = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Check if password_resets table exists, create if not
const ensurePasswordResetTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_token (token),
      INDEX idx_expires (expires_at)
    )
  `;
  
  db.query(sql, (err) => {
    if (err) {
      console.error("Error creating password_resets table:", err);
    } else {
      console.log("Password resets table ready");
    }
  });
};

// Initialize table (run once)
ensurePasswordResetTable();

// Configure email transporter using the SAME config as account verification
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  console.log("Password reset requested for email:", email);

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    // Check if user exists
    const userSql = "SELECT id, email, name FROM users WHERE email = ?";
    db.query(userSql, [email], async (err, users) => {
      if (err) {
        console.error("Database error when checking user:", err);
        return res.status(500).json({ error: "Database error" });
      }

      console.log("User lookup result:", users.length > 0 ? "Found" : "Not found");

      if (users.length === 0) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      const user = users[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      console.log("Generated reset token for user:", user.email);

      // Save reset token to database
      const insertSql = "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)";
      db.query(insertSql, [email, resetToken, expiresAt], async (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Error saving reset token:", insertErr);
          console.error("SQL Error Details:", insertErr.sqlMessage);
          return res.status(500).json({ error: "Error processing request" });
        }

        console.log("Reset token saved successfully:", insertResult.insertId);

        try {
          // Always log the token to console for backup
          console.log(`Password reset token for ${email}: ${resetToken}`);
          console.log(`Reset URL: http://localhost:5173/reset-password?token=${resetToken}`);

          // Try to send email using SMTP credentials (same as account verification)
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
              const transporter = createEmailTransporter();
              const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
              
              const mailOptions = {
                from: process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@healthcare.com',
                to: email,
                subject: 'Password Reset Request',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested a password reset for your account. Click the link below to reset your password:</p>
                    <p>
                      <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                      </a>
                    </p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <p>Best regards,<br>Healthcare Management System</p>
                  </div>
                `
              };

              await transporter.sendMail(mailOptions);
              console.log("✅ Email sent successfully to:", email);
              res.json({ message: "Password reset link has been sent to your email address." });
            } catch (emailErr) {
              console.error("❌ Email sending failed:", emailErr.message);
              console.log("📧 Use the console URL above to reset your password");
              res.json({ message: "Password reset link has been generated. Please check the console for the reset URL." });
            }
          } else {
            console.log("📧 Email not configured. Use the console URL above to reset your password");
            res.json({ message: "Password reset link has been generated. Please check the console for the reset URL." });
          }
        } catch (emailErr) {
          console.error("Unexpected error in email handling:", emailErr);
          // Still return success to user but log the error
          res.json({ message: "If an account with that email exists, a password reset link has been sent." });
        }
      });
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyResetToken = (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: "Reset token is required" });
  }

  const sql = `
    SELECT email, expires_at, used 
    FROM password_resets 
    WHERE token = ? AND expires_at > NOW() AND used = FALSE 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  db.query(sql, [token], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    res.json({ valid: true, email: results[0].email });
  });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Verify token
    const tokenSql = `
      SELECT email, expires_at, used 
      FROM password_resets 
      WHERE token = ? AND expires_at > NOW() AND used = FALSE 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    db.query(tokenSql, [token], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      const resetRecord = results[0];
      const email = resetRecord.email;

      try {
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update password
        const updatePasswordSql = "UPDATE users SET password = ? WHERE email = ?";
        db.query(updatePasswordSql, [hashedPassword, email], (updateErr) => {
          if (updateErr) {
            console.error("Error updating password:", updateErr);
            return res.status(500).json({ error: "Error updating password" });
          }

          // Mark token as used
          const markUsedSql = "UPDATE password_resets SET used = TRUE WHERE token = ?";
          db.query(markUsedSql, [token], (markErr) => {
            if (markErr) {
              console.error("Error marking token as used:", markErr);
            }
          });

          res.json({ message: "Password successfully reset" });
        });
      } catch (hashErr) {
        console.error("Error hashing password:", hashErr);
        res.status(500).json({ error: "Error processing password" });
      }
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Clean up expired tokens (run this periodically)
const cleanupExpiredTokens = () => {
  const sql = "DELETE FROM password_resets WHERE expires_at < NOW() OR used = TRUE";
  db.query(sql, (err) => {
    if (err) {
      console.error("Error cleaning up expired tokens:", err);
    }
  });
};

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 3600000);

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  cleanupExpiredTokens
};
