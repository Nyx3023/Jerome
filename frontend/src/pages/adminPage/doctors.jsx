import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaEdit, FaTrash, FaPlus, FaKey } from 'react-icons/fa';

function Admindoctor() {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'credentials'
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    email: '',
    phone: '',
    schedule: '',
    license_number: ''
  });

  const [credentialsData, setCredentialsData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/admin/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDoctor) {
        await axios.put(`/api/admin/doctors/${selectedDoctor.id}`, formData);
      } else {
        await axios.post('/api/admin/doctors', formData);
      }
      fetchDoctors();
      setShowModal(false);
      setSelectedDoctor(null);
      setFormData({
        name: '',
        specialization: '',
        email: '',
        phone: '',
        schedule: '',
        license_number: ''
      });
    } catch (error) {
      console.error('Error saving doctor:', error);
    }
  };

  const handleEdit = (doctor) => {
    setModalType('add');
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      email: doctor.email || '',
      phone: doctor.contact || doctor.phone || '',
      schedule: doctor.schedule || '',
      license_number: doctor.license_number || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        console.log('Attempting to delete doctor with ID:', id);
        const response = await axios.delete(`/api/admin/doctors/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Delete response:', response.data);
        alert('Doctor deleted successfully!');
        fetchDoctors();
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert(`Error deleting doctor: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleCreateDoctorCredentials = (doctor) => {
    setModalType('credentials');
    setSelectedDoctor(doctor);
    setCredentialsData({
      email: doctor.email || '',
      password: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (credentialsData.password !== credentialsData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const response = await axios.post(`/api/admin/doctors/${selectedDoctor.id}/credentials`, {
        email: credentialsData.email,
        password: credentialsData.password
      });
      
      // Show success popup
      setSuccessMessage(`Doctor account created successfully! Welcome email sent to ${credentialsData.email}`);
      setShowSuccessPopup(true);
      setShowModal(false);
      fetchDoctors();
      
      // Reset form
      setCredentialsData({ email: '', password: '', confirmPassword: '' });
    } catch (error) {
      alert(error.response?.data?.error || 'Error creating doctor credentials');
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Doctors Management</h1>
          <p className="text-gray-600 mt-1">
            Manage clinic doctors and their information
          </p>
        </div>
        <button
          onClick={() => {
            setModalType('add');
            setSelectedDoctor(null);
            setFormData({
              name: '',
              specialization: '',
              email: '',
              phone: '',
              schedule: ''
            });
            setShowModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <FaPlus />
          <span>Add Doctor</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Specialization', 'Email', 'Phone', 'Schedule', 'Actions'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.specialization}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.schedule}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleCreateDoctorCredentials(doctor)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Create Login Credentials"
                    >
                      <FaKey className="inline" />
                    </button>
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      <FaEdit className="inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(doctor.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && modalType === 'add' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule</label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="e.g., Mon-Fri 9AM-5PM"
                  required
                />
              </div>
              {selectedDoctor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="e.g., LIC-2024-001"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  {selectedDoctor ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && modalType === 'credentials' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create Doctor Account
            </h3>
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={credentialsData.email}
                  onChange={(e) => setCredentialsData({...credentialsData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={credentialsData.password}
                  onChange={(e) => setCredentialsData({...credentialsData, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={credentialsData.confirmPassword}
                  onChange={(e) => setCredentialsData({...credentialsData, confirmPassword: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
              <p className="text-sm text-gray-500 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admindoctor;