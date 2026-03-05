import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { FaEdit, FaTrash, FaPlus, FaKey, FaUser, FaHome, FaCalendarAlt, FaUsers, FaClock, FaNotesMedical } from 'react-icons/fa';

// Import staff components
import StaffDashboard from '../staffPage/StaffDashboard';
import StaffAppointments from '../staffPage/StaffAppointments';
import StaffPatients from '../staffPage/StaffPatients';
import StaffCalendar from '../staffPage/StaffCalendar';
import StaffMedicalRecords from '../staffPage/StaffMedicalRecords';

function StaffNavigation() {
  const navItems = [
    { path: '/staff/dashboard', icon: FaHome, label: 'Dashboard', component: StaffDashboard },
    { path: '/staff/appointments', icon: FaCalendarAlt, label: 'Appointments', component: StaffAppointments },
    { path: '/staff/patients', icon: FaUsers, label: 'Patients', component: StaffPatients },
    { path: '/staff/calendar', icon: FaClock, label: 'Calendar', component: StaffCalendar },
    { path: '/staff/medical-records', icon: FaNotesMedical, label: 'Medical Records', component: StaffMedicalRecords },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Access to clinic management tools and patient information
        </p>
      </div>

      {/* Navigation Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <item.icon className="text-3xl text-green-600 mr-4" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{item.label}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {item.label === 'Dashboard' && 'Overview of clinic operations'}
                  {item.label === 'Appointments' && 'Manage patient appointments'}
                  {item.label === 'Patients' && 'View patient information'}
                  {item.label === 'Calendar' && 'Schedule management'}
                  {item.label === 'Medical Records' && 'Patient medical history'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800">Today's Schedule</h3>
            <p className="text-sm text-blue-600 mt-1">View today's appointments and tasks</p>
            <Link to="/staff/appointments" className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
              View Appointments →
            </Link>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">Patient Records</h3>
            <p className="text-sm text-green-600 mt-1">Access patient information and history</p>
            <Link to="/staff/patients" className="text-green-600 hover:text-green-800 text-sm mt-2 inline-block">
              View Patients →
            </Link>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800">Medical Records</h3>
            <p className="text-sm text-purple-600 mt-1">Review and manage medical records</p>
            <Link to="/staff/medical-records" className="text-purple-600 hover:text-purple-800 text-sm mt-2 inline-block">
              View Records →
            </Link>
          </div>
        </div>
      </div>

      {/* Routes for staff components */}
      <Routes>
        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/appointments" element={<StaffAppointments />} />
        <Route path="/patients" element={<StaffPatients />} />
        <Route path="/calendar" element={<StaffCalendar />} />
        <Route path="/medical-records" element={<StaffMedicalRecords />} />
      </Routes>
    </div>
  );
}

function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'credentials'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    license_number: ''
  });

  const [credentialsData, setCredentialsData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/admin/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
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
      if (selectedStaff) {
        await axios.put(`/api/admin/staff/${selectedStaff.id}`, formData);
      } else {
        await axios.post('/api/admin/staff', formData);
      }
      fetchStaff();
      setShowModal(false);
      setSelectedStaff(null);
      resetForm();
    } catch (error) {
      console.error('Error saving staff member:', error);
      alert('Error saving staff member: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      email: '',
      phone: '',
      license_number: ''
    });
  };

  const handleEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      position: staffMember.position || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      license_number: staffMember.license_number || ''
    });
    setModalType('add');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await axios.delete(`/api/admin/staff/${id}`);
        alert('Staff member deleted successfully!');
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff member:', error);
        alert(`Error deleting staff member: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleChangeRole = async (staffMember, newRole) => {
    if (!newRole) return;
    try {
      await axios.put(`/api/admin/users/${staffMember.user_id}/role`, { role: newRole });
      setSuccessMessage(`Role updated to ${newRole} for ${staffMember.name}`);
      setShowSuccessPopup(true);
      fetchStaff();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating role');
      console.error('Role update error:', error);
    }
  };

  const handleCreateStaffCredentials = (staffMember) => {
    setModalType('credentials');
    setSelectedStaff(staffMember);
    setCredentialsData({
      email: staffMember.email || '',
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
      const response = await axios.post(`/api/admin/staff/${selectedStaff.id}/credentials`, {
        email: credentialsData.email,
        password: credentialsData.password
      });
      
      // Show success popup
      setSuccessMessage(`Staff account created successfully! Welcome email sent to ${credentialsData.email}`);
      setShowSuccessPopup(true);
      setShowModal(false);
      fetchStaff();
      
      // Reset form
      setCredentialsData({ email: '', password: '', confirmPassword: '' });
    } catch (error) {
      alert(error.response?.data?.error || 'Error creating staff credentials');
      console.error('Error:', error);
    }
  };


  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage clinic staff and their information
          </p>
        </div>
        <button
          onClick={() => {
            setModalType('add');
            setSelectedStaff(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Position', 'Email', 'Phone', 'License No.', 'Login Status', 'Actions'].map((header) => (
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
              {staff.map((staffMember) => (
                <tr key={staffMember.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUser className="h-8 w-8 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.license_number || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {staffMember.user_id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Login Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ No Login Access
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      {!staffMember.user_id ? (
                        <button
                          onClick={() => handleCreateStaffCredentials(staffMember)}
                          className="text-blue-600 hover:text-blue-900 flex items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="Create Login Credentials"
                        >
                          <FaKey className="mr-1" /> Create Login
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCreateStaffCredentials(staffMember)}
                          className="text-purple-600 hover:text-purple-900 flex items-center px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                          title="Update Login Credentials"
                        >
                          <FaKey className="mr-1" /> Update Login
                        </button>
                      )}
                      {staffMember.user_id && (
                        <select
                          onChange={(e) => handleChangeRole(staffMember, e.target.value)}
                          defaultValue=""
                          className="px-2 py-1 border rounded text-sm"
                          title="Switch Role"
                        >
                          <option value="" disabled>Change Role</option>
                          <option value="staff">Staff</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                      )}
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        title="Edit Staff Information"
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember.id)}
                        className="text-red-600 hover:text-red-900 flex items-center px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Staff Member"
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showModal && modalType === 'add' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Receptionist, Nurse, Administrator"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">License Number</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., LIC-2024-001"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  {selectedStaff ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Update Credentials Modal */}
      {showModal && modalType === 'credentials' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedStaff?.user_id ? 'Update Staff Login' : 'Create Staff Account'}
            </h3>
            {selectedStaff?.user_id && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This staff member already has login access. 
                  Updating will change their current password.
                </p>
              </div>
            )}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={credentialsData.email}
                  onChange={(e) => setCredentialsData({...credentialsData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={credentialsData.password}
                  onChange={(e) => setCredentialsData({...credentialsData, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={credentialsData.confirmPassword}
                  onChange={(e) => setCredentialsData({...credentialsData, confirmPassword: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  {selectedStaff?.user_id ? 'Update Login' : 'Create Account'}
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

// Export StaffNavigation as the main component for staff functionality
export { StaffNavigation };
export default AdminStaff;
