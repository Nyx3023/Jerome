import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verifying your email...');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token') || localStorage.getItem('verification_token') || '';

        if (!token) {
            setStatus('Missing verification token.');
            return;
        }

        const verify = async () => {
            try {
                await axios.post('/api/auth/verify-email', { token });
                setStatus('Email verified! Redirecting to login...');
                // Cleanup
                localStorage.removeItem('pending_verification');
                localStorage.removeItem('verification_token');
                setTimeout(() => navigate('/login'), 1200);
            } catch (err) {
                setStatus(err.response?.data?.error || 'Verification failed.');
            }
        };

        verify();
    }, [location.search, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-600">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
                <p>{status}</p>
            </div>
        </div>
    );
}

export default VerifyEmail;



