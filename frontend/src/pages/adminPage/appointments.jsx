import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaEye, FaClock, FaCalendarAlt, FaCalendarCheck, FaCalendarTimes, FaFilter, FaSearch, FaWalking, FaUser, FaFilePdf } from 'react-icons/fa';
import { generateSingleMedicalRecordHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';

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

function Adminappointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('active');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [services, setServices] = useState([]);
  const [walkInForm, setWalkInForm] = useState({
    patient_name: '',
    contact_number: '',
    service_type: '',
    date: '',
    time_slot: ''
  });
  const [holidays, setHolidays] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDateSlots, setSelectedDateSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineNote, setDeclineNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [overdueAlerts, setOverdueAlerts] = useState([]);
  const esRef = React.useRef(null);
  const reconnectTimerRef = React.useRef(null);

  const timeSlots = [
    'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4',
    'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8',
    'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12',
    'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'
  ];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monitorMode = true;

  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchSchedules();
    try {
      if (esRef.current) { try { esRef.current.close(); } catch (e) { void e } }
      const bases = []
      const envBase = import.meta.env && import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
      if (envBase) bases.push(envBase)
      bases.push(window.location.origin)
      let i = 0
      const connect = () => {
        const url = `${bases[i]}/api/queues/stream`
        const src = new EventSource(url)
        esRef.current = src
        src.addEventListener('appointment_overdue', (e) => {
          try {
            const payload = JSON.parse(e.data || '{}')
            setOverdueAlerts(prev => [{ ...payload, ts: Date.now() }, ...prev].slice(0, 5))
          } catch (err) { void err }
        })
        src.onerror = () => {
          try { src.close(); } catch (e) { void e }
          if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); }
          i = (i + 1) % bases.length
          reconnectTimerRef.current = setTimeout(() => { connect(); }, 1000)
        }
        return src
      }
      connect()
    } catch (e) { void e }
  }, []);

  useEffect(() => {
    if (walkInForm.date) {
      fetchBookedSlots(walkInForm.date);
    }
  }, [walkInForm.date]);

  // Helper function to format date to YYYY-MM-DD without timezone issues
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to display date correctly without timezone issues
  // Using the same approach as doctor page
  const displayDate = (dateString) => {
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila' }).format(new Date(dateString));
  };

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('/api/admin/schedules');
      const schedules = response.data;

      const holidayDates = schedules
        .filter(schedule => schedule.status === 'holiday')
        .map(schedule => {
          const date = new Date(schedule.start);
          return formatDate(date);
        });

      const notAvailableDates = schedules
        .filter(schedule => schedule.status !== 'available' && schedule.status !== 'holiday')
        .map(schedule => {
          const date = new Date(schedule.start);
          return formatDate(date);
        });

      console.log('Holidays:', holidayDates);
      console.log('Not Available:', notAvailableDates);

      setHolidays(holidayDates);
      setUnavailableDates(notAvailableDates);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchBookedSlots = async (date) => {
    try {
      const response = await axios.get(`/api/users/booked-slots?date=${date}`);
      setBookedSlots(response.data);
      setSelectedDateSlots(response.data);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const isDateDisabled = (date) => {
    const dateStr = formatDate(new Date(date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const isDisabled = holidays.includes(dateStr) ||
      unavailableDates.includes(dateStr) ||
      selectedDate <= today;

    console.log('Checking date:', dateStr, 'isDisabled:', isDisabled, 'holidays:', holidays, 'unavailable:', unavailableDates);
    return isDisabled;
  };

  const getDateStatus = (date) => {
    const dateStr = formatDate(new Date(date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) return 'Invalid Date';
    if (holidays.includes(dateStr)) return 'Holiday';
    if (unavailableDates.includes(dateStr)) return 'Not Available';
    return null;
  };

  const isSlotAvailable = (slot) => {
    return !selectedDateSlots.some(bookedSlot =>
      bookedSlot.time_slot === slot &&
      (bookedSlot.status === 'booked' || bookedSlot.status === 'not_available')
    );
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/users/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchAppointments = () => {
    axios.get('/api/admin/getAllAppointments')
      .then(response => {
        setAppointments(response.data);
      })
      .catch(error => {
        console.error('Error fetching appointments:', error);
      });
  };

  const handleRequestStatus = async (id, status) => {
    if (status === 'declined') {
      // For decline, show the decline modal
      const currentAppointment = appointments.find(apt => apt.id === id);
      setSelectedAppointment(currentAppointment);
      setShowDeclineModal(true);
      return;
    }

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
    if (status === 'cancelled') {
      // For cancellation, show the cancel modal
      const currentAppointment = appointments.find(apt => apt.id === id);
      setSelectedAppointment(currentAppointment);
      setShowCancelModal(true);
      setShowStatusModal(false);
      return;
    }

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
      const payload = {
        patient_name: walkInForm.patient_name,
        contact_number: walkInForm.contact_number,
        service_type: walkInForm.service_type,
        triage_level: 'normal',
        assign_immediately: true
      };
      const response = await axios.post('/api/admin/walkins/checkin', payload);
      if (response.status === 201 || response.status === 200) {
        setShowWalkInModal(false);
        setWalkInForm({
          patient_name: '',
          contact_number: '',
          service_type: '',
          date: '',
          time_slot: ''
        });
        if (response.data?.booking) {
          alert(`Walk-in assigned: ${response.data.booking.patient_name} at ${response.data.booking.time_slot}`);
        } else {
          alert('No available slot');
        }
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error adding walk-in to queue:', error);
      alert(error.response?.data?.error || 'Error creating walk-in');
    }
  };

  const handleWalkInFormChange = (e) => {
    const { name, value } = e.target;
    setWalkInForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAppointmentStatusDisplay = (status) => {
    return status === 'null' ? '-' : status;
  };

  useEffect(() => {
    const t = setInterval(() => {
      try { fetchAppointments(); } catch (e) { void e }
    }, 15000);
    return () => clearInterval(t);
  }, []);

  // Add new date filtering functions using timezone-aware approach like doctor page
  const isToday = (date) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const aptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(appointmentDate);
    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(today);
    return aptDateStr === todayDateStr;
  };

  const isUpcoming = (date, status) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const aptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(appointmentDate);
    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(today);
    return aptDateStr >= todayDateStr && !['completed', 'cancelled'].includes(status?.toLowerCase());
  };

  const isPast = (date, status) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const aptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(appointmentDate);
    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(today);
    return aptDateStr < todayDateStr || ['completed', 'cancelled'].includes(status?.toLowerCase());
  };

  const isOverdue = (a) => {
    const past = isPast(a.date, a.appointment_status);
    const inactive = ['completed', 'cancelled'].includes(String(a.appointment_status || '').toLowerCase());
    return past && !inactive;
  };

  const isThisWeek = (date) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const aptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(appointmentDate);
    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(today);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - today.getDay() + 6);

    const weekStartStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(weekStart);
    const weekEndStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(weekEnd);

    return aptDateStr >= weekStartStr && aptDateStr <= weekEndStr;
  };

  // Update the filtered appointments logic
  const getFilteredAppointments = () => {
    let filtered = [...appointments];

    // First apply status filter
    if (filterType !== 'all') {
      if (filterType === 'active') {
        filtered = filtered.filter(appointment => {
          const req = String(appointment.request_status || '').toLowerCase();
          const apt = String(appointment.appointment_status || '').toLowerCase();
          return ['pending', 'confirmed', 'ongoing'].includes(req) || ['ongoing'].includes(apt);
        });
      } else {
        filtered = filtered.filter(appointment =>
          appointment.request_status?.toLowerCase() === filterType ||
          appointment.appointment_status?.toLowerCase() === filterType
        );
      }
    }

    // Then apply date filter
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(appointment => isToday(appointment.date));
        break;
      case 'upcoming':
        filtered = filtered.filter(appointment =>
          isUpcoming(appointment.date, appointment.appointment_status)
        );
        break;
      case 'past':
        filtered = filtered.filter(appointment =>
          isPast(appointment.date, appointment.appointment_status)
        );
        break;
      case 'thisWeek':
        filtered = filtered.filter(appointment => isThisWeek(appointment.date));
        break;
      default:
        break;
    }

    // Finally apply search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();

  const todaysAppointments = appointments.filter(a => isToday(a.date) && String(a.appointment_status || '').toLowerCase() !== 'cancelled' && String(a.request_status || '').toLowerCase() !== 'declined');
  const queueWaiting = todaysAppointments.filter(a => ['pending', 'confirmed'].includes(String(a.request_status || '').toLowerCase()) && !a.checked_in_at).length;
  const queueCalled = todaysAppointments.filter(a => String(a.appointment_status || '').toLowerCase() === 'ongoing' && !!a.checked_in_at).length;
  const pendingOnlineCount = todaysAppointments.filter(a => !!a.user_id && String(a.request_status || '').toLowerCase() === 'pending').length;

  const pendingOnlineToday = todaysAppointments.filter(a => !!a.user_id && String(a.request_status || '').toLowerCase() === 'pending');

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

  // Filter available time slots based on booked slots
  const availableTimeSlots = timeSlots.filter(slot => isSlotAvailable(slot));

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateSelect = (date) => {
    const formattedDate = formatDate(date);
    setWalkInForm(prev => ({ ...prev, date: formattedDate }));
    setShowCalendar(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Previous month days
    const prevMonthDays = firstDayOfMonth;
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    let prevMonthStart = prevMonth.getDate() - prevMonthDays + 1;

    for (let i = 0; i < prevMonthDays; i++) {
      days.push(
        <div key={`prev-${i}`} className="text-center p-2 text-gray-400">
          {prevMonthStart++}
        </div>
      );
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const formattedDay = formatDate(currentDay);
      const isHoliday = holidays.includes(formattedDay);
      const isNotAvailable = !events.some(e => formatDate(new Date(e.start)) === formattedDay && e.status === 'available') && !isHoliday;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      currentDay.setHours(0, 0, 0, 0);
      const isPastOrToday = currentDay <= today;
      const isDisabled = isHoliday || isNotAvailable || isPastOrToday;
      const isSelected = formattedDay === walkInForm.date;

      days.push(
        <div
          key={i}
          onClick={() => !isDisabled && handleDateSelect(currentDay)}
          className={`text-center p-1 cursor-pointer relative min-h-[35px] flex flex-col items-center justify-center
            ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-green-50'}
            ${isSelected ? 'bg-green-100' : ''}
            ${isHoliday ? 'bg-yellow-50' : ''}
            ${isNotAvailable ? 'bg-red-50' : ''}
            ${isPastOrToday ? 'bg-gray-50' : ''}
          `}
        >
          <span className="text-sm font-medium">{i}</span>
          {(isHoliday || isNotAvailable || isPastOrToday) && (
            <div className={`text-xs font-medium
              ${isHoliday ? 'text-yellow-600' : ''}
              ${isNotAvailable ? 'text-gray-400' : ''}
              ${isPastOrToday ? 'text-gray-500' : ''}`}>
              {isHoliday ? 'H' : isNotAvailable ? 'No Slots' : 'X'}
            </div>
          )}
        </div>
      );
    }

    // Next month days
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push(
        <div key={`next-${nextMonthDay}`} className="text-center p-2 text-gray-400">
          {nextMonthDay++}
        </div>
      );
    }

    return days;
  };

  const handleDeclineConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      await axios.put('/api/admin/updateRequestStatus', {
        id: selectedAppointment.id,
        status: 'declined',
        decline_reason: declineReason,
        decline_note: declineNote
      });

      setShowDeclineModal(false);
      setSelectedAppointment(null);
      setDeclineReason('');
      setDeclineNote('');
      fetchAppointments();
    } catch (error) {
      console.error('Error declining appointment:', error);
      alert(error.response?.data?.error || 'Failed to decline appointment');
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      await axios.put('/api/admin/updateAppointmentStatus', {
        id: selectedAppointment.id,
        status: 'cancelled',
        cancel_reason: cancelReason,
        cancel_note: cancelNote
      });

      setShowCancelModal(false);
      setSelectedAppointment(null);
      setCancelReason('');
      setCancelNote('');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(error.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  const handleViewProfile = async (userId) => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }

    try {
      const response = await axios.get(`/api/admin/patient-profile/${userId}`);
      setPatientProfile(response.data);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    }
  };

  const handleDownloadMedicalRecord = async (appointmentId, patientName) => {
    try {
      // Use the same endpoint pattern that works for patients
      const response = await axios.get(`/api/admin/medical-record/${appointmentId}`);

      if (response.data) {
        const medicalRecord = response.data;

        // Create patient info from the medical record data (same as patient-side logic)
        const patientData = {
          name: medicalRecord.patient_name || patientName,
          email: 'N/A',
          phone: 'N/A',
          age: 'N/A',
          gender: 'N/A',
          address: 'N/A'
        };

        // Generate PDF using the same function patients use
        const html = generateSingleMedicalRecordHTML(patientData, medicalRecord);
        const recordDate = new Date(medicalRecord.appointment_date).toISOString().split('T')[0];
        downloadHTMLAsPDF(html, `Medical_Record_${patientName.replace(/\s+/g, '_')}_${recordDate}`);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      if (error.response?.status === 404) {
        alert('No medical records found for this appointment. Medical records are only available after the doctor completes the appointment and adds medical notes.');
      } else {
        alert('Error downloading medical records. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {overdueAlerts.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded p-3">
          <div className="font-semibold">Missed appointments detected</div>
          <div className="text-sm">Recent: {overdueAlerts[0].patient_name || 'Unknown'} • {overdueAlerts[0].service_type || ''} • {new Date(overdueAlerts[0].date).toLocaleDateString()}</div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Appointments Monitor</h1>
        <p className="text-gray-600 mt-1">
          View clinic appointments and statuses. Operational actions are handled by Staff.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Today Waiting</div>
          <div className="text-3xl font-bold text-gray-900">{queueWaiting}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Today In Room</div>
          <div className="text-3xl font-bold text-gray-900">{queueCalled}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Pending Online (Today)</div>
          <div className="text-3xl font-bold text-gray-900">{pendingOnlineCount}</div>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by patient name or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {!monitorMode && (
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <FaCalendarCheck className="mr-2" />
              Add Walk-in
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4">
          <div className="flex rounded-lg shadow-sm">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border
                ${dateFilter === 'all'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              All Dates
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 text-sm font-medium border-t border-b
                ${dateFilter === 'today'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('thisWeek')}
              className={`px-4 py-2 text-sm font-medium border-t border-b
                ${dateFilter === 'thisWeek'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('upcoming')}
              className={`px-4 py-2 text-sm font-medium border-t border-b
                ${dateFilter === 'upcoming'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setDateFilter('past')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border
                ${dateFilter === 'past'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Past
            </button>
          </div>

          <div className="flex rounded-lg shadow-sm">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border
                ${filterType === 'all'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <FaFilter className="inline mr-2" />
              All Status
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-4 py-2 text-sm font-medium border-t border-b
                ${filterType === 'active'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-4 py-2 text-sm font-medium border-t border-b
                ${filterType === 'pending'
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterType('confirmed')}
              className={`px-4 py-2 text-sm font-medium border-t border-b
                ${filterType === 'confirmed'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilterType('ongoing')}
              className={`px-4 py-2 text-sm font-medium border-t border-b
                ${filterType === 'ongoing'
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border
                ${filterType === 'completed'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
              onClick={() => { setFilterType('active'); setDateFilter('today'); }}
            >
              Queue Today
            </button>
          </div>
        </div>
      </div>

      {pendingOnlineToday.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pending Online Requests (Today)</h3>
              <span className="text-sm text-gray-500">{pendingOnlineToday.length} request(s)</span>
            </div>
            <div className="divide-y">
              {pendingOnlineToday.slice(0, 6).map((appointment) => (
                <div key={appointment.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{appointment.patient_name}</div>
                    <div className="text-sm text-gray-500">{displayDate(appointment.date)} • {appointment.time_slot} • {appointment.service_type}</div>
                  </div>
                  <div className="flex gap-2">
                    {monitorMode ? (
                      <span className="text-xs text-gray-500">Managed by Staff</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRequestStatus(appointment.id, 'confirmed')}
                          className="px-3 py-1.5 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestStatus(appointment.id, 'declined')}
                          className="px-3 py-1.5 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
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
                          {displayDate(appointment.date)}
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.session || 'N/A'}
                      </div>
                      {/* Feedback for completed appointments */}
                      {String(appointment.appointment_status || '').toLowerCase() === 'completed' && appointment.feedback_rating && (
                        <div className="text-xs text-gray-600 mt-1" title={appointment.feedback_comment || ''}>
                          ★ {appointment.feedback_rating}/5 {appointment.feedback_comment ? `— ${appointment.feedback_comment.substring(0, 40)}${appointment.feedback_comment.length > 40 ? '…' : ''}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(appointment.request_status)}`}>
                            {appointment.request_status}
                          </span>
                          {/* Decline details button */}
                          {String(appointment.request_status || '').toLowerCase() === 'declined' && (appointment.decline_reason || appointment.decline_note) && (
                            <button
                              onClick={() => {
                                setSelectedAppointmentDetails(appointment);
                                setShowDetailsModal(true);
                              }}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              title="View decline details"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                        {(() => {
                          const req = String(appointment.request_status || '').toLowerCase();
                          const apt = String(appointment.appointment_status || '').toLowerCase();
                          const canAct = !monitorMode && req === 'pending' && !['cancelled', 'completed'].includes(apt);
                          if (!canAct) {
                            return (
                              <div className="text-xs text-gray-500">{monitorMode ? 'Managed by Staff' : `Action not available for ${apt || 'this'} appointment`}</div>
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${monitorMode ? '' : 'cursor-pointer'} ${getStatusStyle(appointment.appointment_status)}`}
                        >
                          {appointment.appointment_status === 'ongoing' && <FaClock className="mr-1" />}
                          {getAppointmentStatusDisplay(appointment.appointment_status)}
                        </span>
                        {isOverdue(appointment) && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">missed</span>
                        )}
                        {/* Cancellation details button */}
                        {String(appointment.appointment_status || '').toLowerCase() === 'cancelled' && (appointment.cancel_reason || appointment.cancel_note) && (
                          <button
                            onClick={() => {
                              setSelectedAppointmentDetails(appointment);
                              setShowDetailsModal(true);
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="View cancellation details"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        {appointment.user_id && (
                          <button
                            onClick={() => handleViewProfile(appointment.user_id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center px-2 py-1 rounded hover:bg-blue-50"
                            title="View Patient Profile"
                          >
                            <FaEye className="mr-1" /> Profile
                          </button>
                        )}
                        {/* Medical Records PDF Download - Only for appointments that could have medical records */}
                        {appointment.request_status !== 'declined' && appointment.appointment_status !== 'cancelled' && (
                          <button
                            onClick={() => handleDownloadMedicalRecord(appointment.id, appointment.patient_name)}
                            className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 rounded hover:bg-green-50"
                            title="Download Medical Records PDF (if available)"
                          >
                            <FaFilePdf className="mr-1" /> PDF
                          </button>
                        )}
                        {appointment.request_status === 'confirmed' && !appointment.checked_in_at && isToday(appointment.date) && (
                          <>
                            <button
                              onClick={() => handleCheckIn(appointment)}
                              className="text-blue-600 hover:text-blue-900 flex items-center px-2 py-1 rounded hover:bg-blue-50"
                              title="Check-in patient"
                            >
                              Check-in
                            </button>
                            <button
                              onClick={() => handleReleaseNoShow(appointment)}
                              className="text-orange-600 hover:text-orange-900 flex items-center px-2 py-1 rounded hover:bg-orange-50"
                              title="Release no-show"
                            >
                              Release no-show
                            </button>
                          </>
                        )}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <input
                    type="text"
                    name="patient_name"
                    value={walkInForm.patient_name}
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

                {/* Removed Date and Time Slot for first-come, first-served queue */}
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
                  disabled={!walkInForm.date || isDateDisabled(walkInForm.date) || !isSlotAvailable(walkInForm.time_slot)}
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
              <button
                onClick={() => handleAppointmentStatus(selectedAppointment.id, 'cancelled')}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${selectedAppointment.appointment_status === 'cancelled'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-green-100'}`}
              >
                Cancelled
              </button>
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

      {/* Patient Profile Modal */}
      {showProfileModal && patientProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Patient Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="text-gray-900">{patientProfile.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Age</label>
                    <p className="text-gray-900">{patientProfile.age}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Gender</label>
                    <p className="text-gray-900">{patientProfile.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Blood Type</label>
                    <p className="text-gray-900">{patientProfile.blood_type || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="text-gray-900">{patientProfile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="text-gray-900">{patientProfile.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="text-gray-900">{patientProfile.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Medical History</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500">Total Visits</label>
                    <p className="text-2xl font-semibold text-gray-900">{patientProfile.total_visits}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500">Last Visit</label>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patientProfile.last_visit ? displayDate(patientProfile.last_visit) : 'Never'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500">Medical Conditions</label>
                    <p className="text-gray-900">{patientProfile.medical_conditions || 'None reported'}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="text-gray-900 mt-1">{patientProfile.notes || 'No additional notes'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Decline Appointment for {selectedAppointment.patient_name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Decline</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a reason</option>
                  <option value="Fully Booked">Fully Booked</option>
                  <option value="Doctor Unavailable">Doctor Unavailable</option>
                  <option value="Holiday/Closed">Holiday/Closed</option>
                  <option value="Incomplete Information">Incomplete Information</option>
                  <option value="Service Not Available">Service Not Available</option>
                  <option value="Duplicate Booking">Duplicate Booking</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={declineNote}
                  onChange={(e) => setDeclineNote(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional details about the decline..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleDeclineConfirm}
                disabled={!declineReason}
                className={`px-4 py-2 rounded-md text-white font-medium ${!declineReason ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirm Decline
              </button>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setDeclineNote('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Appointment for {selectedAppointment.patient_name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a reason</option>
                  <option value="Admin Decision">Admin Decision</option>
                  <option value="Doctor Unavailable">Doctor Unavailable</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Equipment Issue">Equipment Issue</option>
                  <option value="Patient Request">Patient Request</option>
                  <option value="Scheduling Conflict">Scheduling Conflict</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional details about the cancellation..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason}
                className={`px-4 py-2 rounded-md text-white font-medium ${!cancelReason ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirm Cancellation
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelNote('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointmentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Appointment Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Appointment Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Patient</div>
                <div className="font-medium">{selectedAppointmentDetails.patient_name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {displayDate(selectedAppointmentDetails.date)} at {selectedAppointmentDetails.time_slot}
                </div>
                <div className="text-sm text-gray-600">Service: {selectedAppointmentDetails.session}</div>
                <div className="text-sm text-gray-600">
                  Type: {selectedAppointmentDetails.user_id && selectedAppointmentDetails.user_id !== 0 ? 'Registered Patient' : 'Walk-in Patient'}
                </div>
              </div>

              {/* Decline Details */}
              {String(selectedAppointmentDetails.request_status || '').toLowerCase() === 'declined' && (
                <div className="border-l-4 border-red-400 bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Appointment Declined</h4>
                      {selectedAppointmentDetails.decline_reason && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-700">Reason: </span>
                          <span className="text-sm text-red-700">{selectedAppointmentDetails.decline_reason}</span>
                        </div>
                      )}
                      {selectedAppointmentDetails.declined_by && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-700">Declined by: </span>
                          <span className="text-sm text-red-700 capitalize">{selectedAppointmentDetails.declined_by}</span>
                        </div>
                      )}
                      {selectedAppointmentDetails.decline_note && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-700">Note: </span>
                          <span className="text-sm text-red-700">{selectedAppointmentDetails.decline_note}</span>
                        </div>
                      )}
                      {selectedAppointmentDetails.declined_at && (
                        <div className="text-xs text-red-600">
                          Declined on {new Date(selectedAppointmentDetails.declined_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Details */}
              {String(selectedAppointmentDetails.appointment_status || '').toLowerCase() === 'cancelled' && (
                <div className="border-l-4 border-red-400 bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Appointment Cancelled</h4>
                      {selectedAppointmentDetails.cancel_reason && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-700">Reason: </span>
                          <span className="text-sm text-red-700">{selectedAppointmentDetails.cancel_reason}</span>
                        </div>
                      )}
                      {selectedAppointmentDetails.cancelled_by && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-700">Cancelled by: </span>
                          <span className="text-sm text-red-700 capitalize">{selectedAppointmentDetails.cancelled_by}</span>
                        </div>
                      )}
                      {selectedAppointmentDetails.cancel_note && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-700">Note: </span>
                          <span className="text-sm text-red-700">{selectedAppointmentDetails.cancel_note}</span>
                        </div>
                      )}
                      {selectedAppointmentDetails.cancelled_at && (
                        <div className="text-xs text-red-600">
                          Cancelled on {new Date(selectedAppointmentDetails.cancelled_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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

export default Adminappointments;
