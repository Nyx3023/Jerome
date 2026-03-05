import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaUserMd, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    contact: '',
    schedule: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await axios.put(`/api/admin/doctors/${editingDoctor.id}`, formData);
      } else {
        await axios.post('/api/admin/doctors', formData);
      }
      fetchDoctors();
      closeModal();
    } catch (error) {
      console.error('Error saving doctor:', error);
    }
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

  const openModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        specialization: doctor.specialization,
        contact: doctor.contact,
        schedule: doctor.schedule
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        specialization: '',
        contact: '',
        schedule: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setFormData({
      name: '',
      specialization: '',
      contact: '',
      schedule: ''
    });
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Doctors Management</h1>
          <p className="text-gray-600 mt-1">Manage clinic doctors and their schedules</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <FaPlus className="mr-2" />
          Add New Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <FaUserMd className="text-4xl text-green-500 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold">{doctor.name}</h3>
                  <p className="text-gray-600">{doctor.specialization}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openModal(doctor)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(doctor.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <strong>Contact:</strong> {doctor.contact}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Schedule:</strong> {doctor.schedule}
              </p>
              {doctor.license_number && (
                <p className="text-sm text-gray-600">
                  <strong>License No:</strong> {doctor.license_number}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Schedule</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  {editingDoctor ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctors; 