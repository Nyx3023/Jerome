import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import signupValidation from '../validation/signupValidation.js';
import axios from '../utils/axiosConfig';

function Signup() {
    const [values, setValues] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });

    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleInput = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const sanitized = {
            email: (values.email || '').trim().toLowerCase(),
            password: values.password,
            confirmPassword: values.confirmPassword,
            role: 'user'
        };
        const validationErrors = signupValidation(sanitized);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            try {
                setLoading(true);
                setApiError('');
                await axios.post('/api/auth/signup', sanitized);
                alert('Account created. Please check your email for a verification link.');
                navigate('/login');
            } catch (error) {
                console.error("Signup error:", error);
                setApiError(error.response?.data?.error || "An error occurred during signup");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-600">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                <p className="text-xs text-gray-500 text-center mb-4">After signup, we send a verification email. You must verify before logging in.</p>

                {apiError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {apiError}
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

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={values.confirmPassword}
                                onChange={handleInput}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <input
                                type="hidden"
                                id="role"
                                name="role"
                                value="user"
                            />
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                                Patient
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white py-2 px-4 rounded-md transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Signing up...' : 'Sign up'}
                        </button>

                        <Link
                            to="/login"
                            className="block text-center w-full mt-2 py-2 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                        >
                            Already have an account?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Signup;
