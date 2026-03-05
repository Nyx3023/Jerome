import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.current_password || !form.new_password) { setError('All fields are required'); return; }
    if (form.new_password !== form.confirm) { setError('Passwords do not match'); return; }
    try {
      setLoading(true);
      await axios.post('/api/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password
      });
      // Reload user from localStorage and redirect based on role
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : {};
      if (user.role === 'doctor') navigate('/doctor/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'staff') navigate('/admin/dashboard');
      else navigate('/home');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Change Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Please set a new password to continue.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={submit}>
          {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label className="sr-only" htmlFor="current_password">Current Password</label>
              <input id="current_password" name="current_password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Current password" value={form.current_password} onChange={onChange} />
            </div>
            <div>
              <label className="sr-only" htmlFor="new_password">New Password</label>
              <input id="new_password" name="new_password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="New password" value={form.new_password} onChange={onChange} />
            </div>
            <div>
              <label className="sr-only" htmlFor="confirm">Confirm Password</label>
              <input id="confirm" name="confirm" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Confirm password" value={form.confirm} onChange={onChange} />
            </div>
          </div>
          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
