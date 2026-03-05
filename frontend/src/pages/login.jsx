import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Validation from '../validation/loginValidation';

function Login() {
    const [values, setValues] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [showResend, setShowResend] = useState(false);
    const [resendMsg, setResendMsg] = useState('');
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();

    const handleInput = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = Validation(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            try {
                const res = await axios.post('/api/auth/login', values);
                const { token, role, user } = res.data;

                // Store token and complete user info
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: role,
                    profile: user.profile
                }));

                // If password change is required, redirect immediately
                if (user.must_change_password) {
                    navigate('/change-password');
                    return;
                }

                // Handle navigation based on role and profile status
                switch (role) {
                    case 'user':
                        // If no profile exists, redirect to profile creation
                        if (!user.profile) {
                            navigate('/profile');
                        } else {
                            navigate('/home');
                        }
                        break;
                    case 'doctor':
                        navigate('/doctor/dashboard');
                        break;
                    case 'admin':
                        navigate('/admin/dashboard');
                        break;
                    case 'staff':
                        navigate('/staff/dashboard');
                        break;
                    default:
                        setApiError('Invalid role detected.');
                }
            } catch (error) {
                console.error('Login error:', error);
                const msg = error.response?.data?.error || 'Login failed.';
                setApiError(msg);
                if (/verify your email/i.test(msg)) {
                    setShowResend(true);
                }
            }
        }
    };

    const handleResend = async () => {
        try {
            setResending(true);
            setResendMsg('');
            await axios.post('/api/auth/resend-verification', { email: (values.email || '').trim().toLowerCase() });
            setResendMsg('Verification email resent. Please check your inbox.');
        } catch {
          setResendMsg('Verification email resent. Please check your inbox.');
        } finally {
          setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-600">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                
                {apiError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {apiError}
                    </div>
                )}
                {showResend && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded">
                        Didn't get the email? <button type="button" onClick={handleResend} disabled={resending} className={`ml-2 underline ${resending ? 'opacity-60 cursor-not-allowed' : ''}`}>{resending ? 'Sending...' : 'Resend verification email'}</button>
                        {resendMsg && <div className="text-green-600 mt-1 text-sm">{resendMsg}</div>}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={values.email}
                                onChange={handleInput}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={values.password}
                                onChange={handleInput}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                        >
                            Login
                        </button>

                        <Link
                            to="/signup"
                            className="block text-center w-full mt-2 py-2 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                        >
                            Create new account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
