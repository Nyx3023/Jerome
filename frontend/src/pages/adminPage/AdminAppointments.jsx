import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaWalking, FaUser } from 'react-icons/fa';

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-200 text-black';
    case 'confirmed':
      return 'bg-green-500 text-white';
    case 'declined':
      return 'bg-red-500 text-white';
    case 'cancelled':
      return 'bg-red-500 text-white';
    case 'ongoing':
      return 'bg-orange-500 text-white';
    case 'completed':
      return 'bg-green-600 text-white';
    case 'null':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState([]);
  const [walkInForm, setWalkInForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    patient_name: '',
    contact_number: '',
    service_type: '',
    date: '',
    time_slot: '',
    existing_user_id: ''
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [capacityForm, setCapacityForm] = useState({ date: '', slots: '' });

  const timeSlots = [
    'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4',
    'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8',
    'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12',
    'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'
  ];

  // Helper function to format date correctly without timezone issues
  // Using the same approach as doctor page
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila' }).format(new Date(dateString));
  };

  const isToday = (dateString) => {
    const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(d));
    const todayStr = fmt(new Date());
    return fmt(dateString) === todayStr;
  };

  const isOverdue = (apt) => {
    const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(d));
    const todayStr = fmt(new Date());
    const aptStr = fmt(apt.date);
    const as = String(apt.appointment_status || '').toLowerCase();
    return aptStr < todayStr && !['completed', 'cancelled'].includes(as);
  };

  useEffect(() => {
    console.log('Component mounted');
    fetchAppointments();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/users/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Search existing patients
  const searchPatients = async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`/api/admin/search-patients?search_term=${encodeURIComponent(term.trim())}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Error searching patients:', err);
      setSearchResults([]);
    }
  };

  const fetchAppointments = () => {
    console.log('Fetching appointments...');
    axios.get('/api/admin/getAllAppointments')
      .then(response => {
        console.log('Appointments fetched:', response.data);
        setAppointments(response.data);
      })
      .catch(error => {
        console.error('Error fetching appointments:', error);
      });
  };

  const handleCheckIn = async (appointment) => {
    try {
      await axios.post('/api/admin/bookings/check-in', { booking_id: appointment.id });
      fetchAppointments();
      alert('Patient checked-in');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check-in');
    }
  };

  const handleReleaseNoShow = async (appointment) => {
    try {
      await axios.post('/api/admin/bookings/release-no-show', { booking_id: appointment.id });
      fetchAppointments();
      alert('Slot released (no-show)');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to release slot');
    }
  };


  const handleRequestStatus = async (id, status) => {
    try {
      await axios.put('/api/admin/updateRequestStatus', {
        id,
        status
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleAppointmentStatus = async (id, status) => {
    try {
      await axios.put('/api/admin/updateAppointmentStatus', {
        id,
        status
      });
      fetchAppointments();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      const fullName = [walkInForm.first_name, walkInForm.middle_name, walkInForm.last_name].filter(Boolean).join(' ').trim() || walkInForm.patient_name;
      const payload = {
        patient_name: fullName,
        first_name: walkInForm.first_name,
        middle_name: walkInForm.middle_name,
        last_name: walkInForm.last_name,
        contact_number: walkInForm.contact_number,
        service_type: walkInForm.service_type,
        date: walkInForm.date,
        time_slot: walkInForm.time_slot,
        existing_user_id: walkInForm.existing_user_id
      };
      const response = await axios.post('/api/admin/create-walkin', payload);
      if (response.status === 200) {
        setShowWalkInModal(false);
        setWalkInForm({
          first_name: '',
          middle_name: '',
          last_name: '',
          patient_name: '',
          contact_number: '',
          service_type: '',
          date: '',
          time_slot: '',
          existing_user_id: ''
        });
        setSelectedPatient(null);
        setPatientSearch('');
        setSearchResults([]);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error creating walk-in appointment:', error);
      alert(error.response?.data?.error || 'Error creating appointment');
    }
  };

  const handleWalkInFormChange = (e) => {
    const { name, value } = e.target;
    setWalkInForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCapacitySubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { date: capacityForm.date, slots: Number(capacityForm.slots) };
      await axios.post('/api/admin/set-day-capacity', payload);
      alert('Day capacity saved');
      setCapacityForm({ date: '', slots: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set capacity');
    }
  };

  const getAppointmentStatusDisplay = (status) => {
    return status === 'null' ? '-' : status;
  };

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.session.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointments Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and track all patient appointments
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              New Walk-in Appointment
            </button>

            <div className="relative">
              <input
                type="text"
                className="w-64 pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-3 top-2.5">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="text-xl font-semibold mb-2">Set Day Capacity</h2>
          <form onSubmit={handleCapacitySubmit} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-sm text-gray-600">Date</label>
              <input type="date" className="border rounded px-2 py-1" value={capacityForm.date} onChange={(e) => setCapacityForm(prev => ({ ...prev, date: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Capacity</label>
              <input type="number" min="1" className="border rounded px-2 py-1" value={capacityForm.slots} onChange={(e) => setCapacityForm(prev => ({ ...prev, slots: e.target.value }))} required />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Date & Time', 'Patient Name', 'Service', 'Request Status', 'Appointment Status', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(appointment.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.time_slot}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {appointment.user_id && appointment.user_id !== 0 ? (
                          <FaUser className="text-blue-500" title="Registered" />
                        ) : (
                          <FaWalking className="text-orange-500" title="Walk-in" />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patient_name}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${appointment.user_id && appointment.user_id !== 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                            }`}
                        >
                          {appointment.user_id && appointment.user_id !== 0 ? 'Registered' : 'Walk-in'}
                        </span>
                        {appointment.is_ob_booking === 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                            👶 OB
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.session || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(appointment.request_status)}`}>
                          {appointment.request_status}
                        </span>
                        {(() => {
                          const req = String(appointment.request_status || '').toLowerCase();
                          const apt = String(appointment.appointment_status || '').toLowerCase();
                          const canAct = req === 'pending' && !['cancelled', 'completed'].includes(apt);
                          if (!canAct) {
                            return (
                              <div className="text-xs text-gray-500">Action not available for {apt || 'this'} appointment</div>
                            );
                          }
                          return (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleRequestStatus(appointment.id, 'confirmed')}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRequestStatus(appointment.id, 'declined')}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Decline
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.appointment_status !== 'null' ? (
                        <>
                          <span
                            onClick={() => {
                              if (appointment.request_status === 'confirmed') {
                                setSelectedAppointment(appointment);
                                setShowStatusModal(true);
                              }
                            }}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${getStatusStyle(appointment.appointment_status)}`}
                          >
                            {getAppointmentStatusDisplay(appointment.appointment_status)}
                          </span>
                          {isOverdue(appointment) && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">missed</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-3 justify-end">
                        {appointment.request_status === 'confirmed' && !appointment.checked_in_at && isToday(appointment.date) && (
                          <button
                            onClick={() => handleCheckIn(appointment)}
                            className="px-3 py-1.5 rounded text-white bg-blue-600 hover:bg-blue-700"
                            title="Mark as arrived (check-in)"
                          >
                            Check-in
                          </button>
                        )}
                        {appointment.request_status === 'confirmed' && !appointment.checked_in_at && isToday(appointment.date) && (
                          <button
                            onClick={() => handleReleaseNoShow(appointment)}
                            className="px-3 py-1.5 rounded text-white bg-red-600 hover:bg-red-700"
                            title="Release slot (no-show)"
                          >
                            Release no-show
                          </button>
                        )}
                        <button className="text-green-600 hover:text-green-900">
                          <span role="img" aria-label="print" className="text-xl">🖨️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-in Appointment Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create Walk-in Appointment
            </h3>
            <form onSubmit={handleWalkInSubmit}>
              <div className="space-y-4">
                {/* Existing patient search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Find existing patient (optional)</label>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPatientSearch(v);
                      searchPatients(v);
                    }}
                    placeholder="Search by name, phone, or email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((p, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedPatient(p);
                            const tokens = (p.name || '').trim().split(/\s+/);
                            const fn = tokens[0] || '';
                            const ln = tokens.length > 1 ? tokens[tokens.length - 1] : '';
                            const mn = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : '';
                            setWalkInForm(prev => ({
                              ...prev,
                              first_name: fn,
                              middle_name: mn,
                              last_name: ln,
                              patient_name: p.name,
                              contact_number: p.phone || prev.contact_number,
                              existing_user_id: p.user_id || ''
                            }));
                            setPatientSearch('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{p.name}</div>
                              {p.phone && <div className="text-xs text-gray-500">{p.phone}</div>}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${p.patient_type === 'registered' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                              {p.patient_type === 'registered' ? 'Registered' : 'Walk-in'} · {p.total_appointments} visits
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={walkInForm.first_name}
                    onChange={handleWalkInFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    value={walkInForm.middle_name}
                    onChange={handleWalkInFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={walkInForm.last_name}
                    onChange={handleWalkInFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={walkInForm.contact_number}
                    onChange={handleWalkInFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Service</label>
                  <select
                    name="service_type"
                    value={walkInForm.service_type}
                    onChange={handleWalkInFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a service</option>
                    {services.map(service => {
                      // Format category name for display
                      const formatCategory = (category) => {
                        if (!category || category === 'general') return '';
                        return category.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                      };

                      const categoryDisplay = formatCategory(service.category);
                      const displayText = categoryDisplay
                        ? `${service.name} (${categoryDisplay})`
                        : service.name;

                      return (
                        <option key={service.id} value={service.name}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={walkInForm.date}
                    onChange={handleWalkInFormChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                  <select
                    name="time_slot"
                    value={walkInForm.time_slot}
                    onChange={handleWalkInFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a time slot</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Appointment Status
            </h3>
            <div className="space-y-2">
              {['ongoing', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleAppointmentStatus(selectedAppointment.id, status)}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
                    ${selectedAppointment.appointment_status === status
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-green-100'}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppointments;
