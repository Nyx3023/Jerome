import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import axios from '../../utils/axiosConfig';
import { FaCamera, FaUser, FaSpinner } from 'react-icons/fa';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'female',
    address: '',
    religion: '',
    occupation: '',
    place_of_birth: '',
    date_of_birth: '',
    marital_status: '',
    nationality: '',
    ethnicity: '',
    preferred_language: '',
    expected_delivery_date: '' // EDD field
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);

  const requiredFields = ['name', 'phone', 'age', 'gender', 'address'];
  const completedCount = requiredFields.reduce((count, key) => count + (formData[key] ? 1 : 0), 0);
  const isComplete = completedCount === requiredFields.length;

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData?.email) {
      setFormData(prev => ({
        ...prev,
        email: userData.email
      }));
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/patient-profile');
      console.log('Profile API response:', response.data); // Debug log
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          first_name: response.data.first_name || '',
          middle_name: response.data.middle_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || prev.email,
          phone: response.data.phone || '',
          age: response.data.age || '',
          gender: response.data.gender || 'female',
          address: response.data.address || '',
          religion: response.data.religion || '',
          occupation: response.data.occupation || '',
          place_of_birth: response.data.place_of_birth || '',
          date_of_birth: response.data.date_of_birth || '',
          marital_status: response.data.marital_status || '',
          nationality: response.data.nationality || '',
          ethnicity: response.data.ethnicity || '',
          preferred_language: response.data.preferred_language || '',
          expected_delivery_date: response.data.expected_delivery_date || ''
        }));
        if (response.data.profile_picture) {
          console.log('Profile picture found:', response.data.profile_picture); // Debug log
          const pictureUrl = `${axios.defaults.baseURL}/uploads/${response.data.profile_picture}`;
          console.log('Setting profile picture URL:', pictureUrl); // Debug log
          setProfilePictureUrl(pictureUrl);
        } else {
          console.log('No profile picture in response'); // Debug log
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        setError('Failed to fetch profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePictureUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return;

    const formData = new FormData();
    formData.append('profile_picture', profilePicture);

    try {
      setUploading(true);
      const response = await axios.post('/api/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update the profile picture URL with the uploaded filename
      const pictureUrl = `${axios.defaults.baseURL}/uploads/${response.data.profile_picture}`;
      console.log('Upload successful, setting URL:', pictureUrl); // Debug log
      setProfilePictureUrl(pictureUrl);
      setProfilePicture(null); // Clear the file input
      alert('Profile picture updated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users/update-profile', formData);
      alert('Profile updated successfully!');
      navigate('/home');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
              <p className="text-sm text-gray-500 mt-1">Keep your information up to date for faster bookings and better care.</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {isComplete ? 'Profile complete' : `Complete profile (${completedCount}/${requiredFields.length})`}
            </span>
          </div>

          {/* Completion progress */}
          <div className="mb-6">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${Math.round((completedCount / requiredFields.length) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="mb-8 text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 ring-2 ring-offset-2 ring-gray-200 mx-auto mb-4">
                {profilePictureUrl ? (
                  <img 
                    src={profilePictureUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setShowImagePreview(true)}
                    title="Click to view"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                <FaCamera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {profilePicture && (
              <div className="mt-4">
                <button
                  onClick={uploadProfilePicture}
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Picture'
                  )}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Juan"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  placeholder="Santos"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Dela Cruz"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Email is linked to your account and cannot be changed here.</p>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09xxxxxxxxx"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="24"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Religion</label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleChange}
                placeholder="e.g., Roman Catholic"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="e.g., Teacher"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Place of Birth</label>
              <input
                type="text"
                name="place_of_birth"
                value={formData.place_of_birth}
                onChange={handleChange}
                placeholder="City/Province"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Marital Status</label>
              <select
                name="marital_status"
                value={formData.marital_status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="separated">Separated</option>
                <option value="widowed">Widowed</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Expected Delivery Date (EDD) 👶
              </label>
              <input
                type="date"
                name="expected_delivery_date"
                value={formData.expected_delivery_date}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">For pregnant patients - when is your baby due?</p>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Nationality</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="e.g., Filipino"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Ethnicity</label>
              <input
                type="text"
                name="ethnicity"
                value={formData.ethnicity}
                onChange={handleChange}
                placeholder="e.g., Tagalog"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Preferred Language</label>
              <input
                type="text"
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                placeholder="e.g., English"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="House No., Street, Barangay, City/Province"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                ></textarea>
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {showImagePreview && profilePictureUrl && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={profilePictureUrl}
              alt="Profile preview"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between">
              <button
                className="px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => setShowImagePreview(false)}
              >
                Close
              </button>
              <a
                href={profilePictureUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default Profile;
