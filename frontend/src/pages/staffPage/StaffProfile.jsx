import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaIdCard, FaUser, FaEnvelope, FaSave } from 'react-icons/fa';

const StaffProfile = () => {
  const [user, setUser] = useState(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Fetch fresh data from server to get latest license number
        try {
          const response = await axios.get('/api/auth/me');
          if (response.data) {
            const freshUser = { ...userData, license_number: response.data.license_number };
            setUser(freshUser);
            setLicenseNumber(response.data.license_number || '');
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to localStorage data
          setLicenseNumber(userData.license_number || '');
        }
      }
    };
    
    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.put('/api/auth/update-license-number', {
        license_number: licenseNumber
      });

      // Update localStorage with new license number
      const updatedUser = { ...user, license_number: licenseNumber };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setMessage(response.data.message || 'License number updated successfully');
      
      // Refresh page after 1 second to update sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating license number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Staff Profile</h1>
        <p className="text-gray-600 mt-1">Manage your profile information</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* User Info Section */}
        <div className="mb-6 pb-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <FaUser className="text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{user?.name || 'Staff'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FaEnvelope className="text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FaIdCard className="text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FaIdCard className="text-green-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">License Number</p>
                <p className="font-medium">{user?.license_number || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* License Number Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Professional License</h2>
          
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g., PRC-0012345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter your professional license number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              <FaSave className="mr-2" />
              {loading ? 'Saving...' : 'Save License Number'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
