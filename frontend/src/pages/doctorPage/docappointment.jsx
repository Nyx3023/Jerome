import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaClock, FaPlay, FaCheckCircle, FaSearch, FaFilter, FaCalendarAlt, FaUndo, FaFilePdf, FaTrash } from 'react-icons/fa';
import { generateSingleMedicalRecordHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';
import SmartCompletionModal from '../../components/SmartCompletionModal';
import ColorCodedDatePicker from '../../components/ColorCodedDatePicker';
import axios from '../../utils/axiosConfig';
import { useRef } from 'react';

const Docappointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('active');
  const [dateFilter, setDateFilter] = useState('today');
  const [showUndo, setShowUndo] = useState(false);
  const [undoData, setUndoData] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpService, setFollowUpService] = useState('');
  const [followUpProviderType, setFollowUpProviderType] = useState('doctor');
  const [services, setServices] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const esRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // Smart completion modal state
  const [showSmartCompletionModal, setShowSmartCompletionModal] = useState(false);
  const [availableDates, setAvailableDates] = useState(new Set());
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState('');
  const [availabilityDaySummary, setAvailabilityDaySummary] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [remainingSlotsByDate, setRemainingSlotsByDate] = useState({});
  const [followUpCalendarMonth, setFollowUpCalendarMonth] = useState(new Date());

  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchSchedules();
    // Subscribe to queue updates so doctor list auto-refreshes on check-in or queue changes
    try {
      if (esRef.current) { try { esRef.current.close(); } catch (e) { /* noop */ } }
      const bases = [];
      const envBase = import.meta.env && import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : '';
      if (envBase) bases.push(envBase);
      bases.push(window.location.origin);
      let i = 0;
      const connect = () => {
        const url = `${bases[i]}/api/queues/stream`;
        const src = new EventSource(url);
        esRef.current = src;
        src.addEventListener('queue_update', () => {
          fetchAppointments();
        });
        src.onerror = () => {
          try { src.close(); } catch (e) { /* noop */ }
          if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); }
          i = (i + 1) % bases.length;
          reconnectTimerRef.current = setTimeout(() => { connect(); }, 1000);
        };
        return src;
      };
      connect();
    } catch (e) { /* noop */ }
    return () => {
      try { if (esRef.current) esRef.current.close(); } catch (e) { /* noop */ }
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); }
    };
  }, []);

  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        setShowUndo(false);
        setUndoData(null);
      }, 5000); // Hide undo after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/doctors/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/doctors/services', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('/api/doctors/schedules', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const rows = res.data || [];
      setSchedules(rows);
      const dates = new Set(
        rows
          .filter(e => String(e.status || e.title || '').toLowerCase() === 'available')
          .map(e => {
            const d = new Date(e.start || e.date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          })
      );
      setAvailableDates(dates);
    } catch (err) {
      setSchedules([]);
      setAvailableDates(new Set());
    }
  };

  // Fetch remaining slots for a given month (for ColorCodedDatePicker)
  const fetchMonthSlotCounts = async (monthDate) => {
    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const counts = {};
      const promises = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);

        promises.push(
          axios.get(`/api/doctors/day-slot-summary?date=${dateStr}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
            .then(response => {
              counts[dateStr] = response.data.remaining_slots ?? 0;
            })
            .catch(() => {
              counts[dateStr] = 0;
            })
        );
      }

      await Promise.all(promises);
      setRemainingSlotsByDate(prev => ({ ...prev, ...counts }));
    } catch (error) {
      console.error('Error fetching month slot counts:', error);
    }
  };

  const fetchAvailabilityDaySummary = async (date) => {
    if (!date) { setAvailabilityDaySummary(null); return; }
    try {
      const response = await axios.get(`/api/doctors/day-slot-summary?date=${date}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setAvailabilityDaySummary(response.data || null);
    } catch (error) {
      setAvailabilityDaySummary(null);
    }
  };

  const handleAppointmentStatus = async (id, newStatus) => {
    if (newStatus === 'cancelled') {
      // For cancellation, show the cancel modal
      const currentAppointment = appointments.find(apt => apt.id === id);
      setSelectedAppointment(currentAppointment);
      setShowCancelModal(true);
      return;
    }

    if (newStatus === 'completed') {
      // For completion, show the smart completion modal
      const currentAppointment = appointments.find(apt => apt.id === id);
      handleCompleteAppointment(currentAppointment);
      return;
    }

    try {
      // Find the current appointment to store for undo
      const currentAppointment = appointments.find(apt => apt.id === id);
      const previousStatus = currentAppointment.appointment_status;

      // Store undo data
      setUndoData({
        appointmentId: id,
        previousStatus: previousStatus,
        newStatus: newStatus,
        patientName: currentAppointment.patient_name
      });

      await axios.put('/api/doctors/updateAppointmentStatus', {
        id,
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      fetchAppointments();
      setShowStatusModal(false);
      setSelectedAppointment(null);
      setShowUndo(true);
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleUndo = async () => {
    if (!undoData) return;

    try {
      await axios.put('/api/doctors/updateAppointmentStatus', {
        id: undoData.appointmentId,
        status: undoData.previousStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      fetchAppointments();
      setShowUndo(false);
      setUndoData(null);
    } catch (error) {
      console.error('Error undoing status change:', error);
    }
  };

  // Date filtering functions
  const isToday = (date) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    return (
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear()
    );
  };

  const isUpcoming = (date, status) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    return appointmentDate >= today && !['completed', 'cancelled'].includes(status?.toLowerCase());
  };

  const isPast = (date, status) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    return appointmentDate < today || ['completed', 'cancelled'].includes(status?.toLowerCase());
  };

  const isThisWeek = (date) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return appointmentDate >= weekStart && appointmentDate <= weekEnd;
  };

  // Filter appointments logic
  const parseTimeSlotToMinutes = (slot) => {
    if (!slot) return -1;
    const simple = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    if (simple.test(slot)) {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m;
    }
    const range = /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(AM|PM)$/i;
    const match = slot.match(range);
    if (match) {
      let sh = parseInt(match[1], 10), sm = parseInt(match[2], 10);
      const period = match[5].toUpperCase();
      if (period === 'PM' && sh !== 12) sh += 12;
      if (period === 'AM' && sh === 12) sh = 0;
      return sh * 60 + sm;
    }
    return -1;
  };

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
      case 'specific':
        if (selectedAvailabilityDate) {
          filtered = filtered.filter(appointment => {
            const aptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(appointment.date));
            return aptDateStr === selectedAvailabilityDate;
          });
        }
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
        appointment.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.contact_number?.includes(searchTerm)
      );
    }

    // Ordering policy:
    // - For today's appointments: checked-in patients first, ordered by checked_in_at ascending (first come, first served).
    //   Remaining (not checked-in) ordered by scheduled time ascending.
    // - For other dates: keep existing behavior (date desc, then time_slot desc).
    filtered.sort((a, b) => {
      const aIsToday = isToday(a.date);
      const bIsToday = isToday(b.date);
      if (aIsToday && bIsToday) {
        const aChecked = !!a.checked_in_at;
        const bChecked = !!b.checked_in_at;
        if (aChecked && bChecked) {
          const ta = new Date(a.checked_in_at).getTime();
          const tb = new Date(b.checked_in_at).getTime();
          return ta - tb; // earlier check-in first
        }
        if (aChecked !== bChecked) {
          return aChecked ? -1 : 1; // checked-in first
        }
        const ta = parseTimeSlotToMinutes(a.time_slot);
        const tb = parseTimeSlotToMinutes(b.time_slot);
        return ta - tb; // earlier slot first
      }
      const da = new Date(a.date);
      const db = new Date(b.date);
      if (db.getTime() !== da.getTime()) return db - da;
      const ta = parseTimeSlotToMinutes(a.time_slot);
      const tb = parseTimeSlotToMinutes(b.time_slot);
      return tb - ta;
    });

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();
  const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  const futureAvailableDates = Array.from(availableDates).filter(d => d >= todayDateStr).sort();

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-200 text-green-900';
      case 'null':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila' }).format(new Date(dateString));
  };

  // Calculate Age of Gestation (AOG) in weeks from LMP to appointment date
  const calculateAOG = (lmp, appointmentDate) => {
    if (!lmp || !appointmentDate) return null;
    const lmpDate = new Date(lmp);
    const aptDate = new Date(appointmentDate);
    if (isNaN(lmpDate) || isNaN(aptDate)) return null;
    const diffMs = aptDate - lmpDate;
    if (diffMs < 0) return null;
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    const days = Math.floor((diffMs % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    return { weeks, days };
  };

  const openStatusModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowStatusModal(true);
  };

  const openFollowUpModal = (appointment) => {
    setSelectedAppointment(appointment);
    setFollowUpDate(null);
    setFollowUpTime('');
    setFollowUpService('');
    setFollowUpProviderType('doctor');
    setShowFollowUpModal(true);
    // Initialize calendar to current month and fetch slot counts
    const now = new Date();
    setFollowUpCalendarMonth(now);
    fetchMonthSlotCounts(now);
  };

  const submitFollowUp = async () => {
    if (!selectedAppointment || !followUpDate || !followUpTime) return;

    try {
      // Format the date to YYYY-MM-DD string
      const dateStr = followUpDate instanceof Date
        ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(followUpDate)
        : followUpDate;

      await axios.post('/api/doctors/scheduleFollowUp', {
        appointmentId: selectedAppointment.id,
        date: dateStr,
        time_slot: followUpTime,
        service_type: followUpService || selectedAppointment.service_type,
        follow_up_provider_type: followUpProviderType
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      setShowFollowUpModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      alert(error.response?.data?.error || 'Failed to schedule follow-up');
    }
  };

  // Handle month change in ColorCodedDatePicker
  const handleFollowUpMonthChange = (newMonth) => {
    setFollowUpCalendarMonth(newMonth);
    fetchMonthSlotCounts(newMonth);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      // Store undo data before cancellation
      setUndoData({
        appointmentId: selectedAppointment.id,
        previousStatus: selectedAppointment.appointment_status,
        newStatus: 'cancelled',
        patientName: selectedAppointment.patient_name
      });

      await axios.put('/api/doctors/updateAppointmentStatus', {
        id: selectedAppointment.id,
        status: 'cancelled',
        cancel_reason: cancelReason,
        cancel_note: cancelNote
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setShowCancelModal(false);
      setSelectedAppointment(null);
      setCancelReason('');
      setCancelNote('');
      fetchAppointments();
      setShowUndo(true);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(error.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  // Handle opening smart completion modal
  const handleCompleteAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowSmartCompletionModal(true);
  };

  // Handle successful completion from smart modal
  const handleCompletionSuccess = (appointmentId, previousStatus, patientName) => {
    // Store undo data
    setUndoData({
      appointmentId: appointmentId,
      previousStatus: previousStatus,
      newStatus: 'completed',
      patientName: patientName
    });

    // Update UI
    setAppointments(prev => prev.map(apt =>
      apt.id === appointmentId
        ? { ...apt, appointment_status: 'completed' }
        : apt
    ));

    // Show success and undo option
    setShowUndo(true);

    // Close modal
    setShowSmartCompletionModal(false);
    setSelectedAppointment(null);
  };

  const handleDownloadMedicalRecord = async (appointmentId, patientName) => {
    try {
      const response = await axios.get(`/api/doctors/medical-record/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data) {
        const medicalRecord = response.data;

        // Create patient info from the medical record data
        const patientData = {
          name: medicalRecord.patient_name || patientName,
          email: 'N/A',
          phone: 'N/A',
          age: 'N/A',
          gender: 'N/A',
          address: 'N/A'
        };

        // Generate PDF
        const base = window.location.origin;
        let logoUrl = `${base}/vite.svg`;
        try {
          const res = await fetch(`${base}/logo.png`, { method: 'HEAD' });
          if (res.ok) logoUrl = `${base}/logo.png`;
        } catch { }
        const html = generateSingleMedicalRecordHTML(patientData, medicalRecord, logoUrl);
        const recordDate = new Date(medicalRecord.appointment_date).toISOString().split('T')[0];
        downloadHTMLAsPDF(html, `Medical_Record_${patientName.replace(/\s+/g, '_')}_${recordDate}`);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      if (error.response?.status === 404) {
        alert('No medical records found for this appointment. Medical records are only available after you complete the appointment and add medical notes.');
      } else {
        alert('Error downloading medical records. Please try again.');
      }
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      await axios.delete(`/api/doctors/appointments/${appointmentToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      fetchAppointments();
      alert('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert(error.response?.data?.error || 'Failed to delete appointment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <p className="text-gray-600 mt-1">
          Manage your appointments and update their status
        </p>
      </div>

      {/* Undo Notification */}
      {showUndo && undoData && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-blue-800">
              <strong>{undoData.patientName}'s</strong> appointment status changed to{' '}
              <strong>{undoData.newStatus === 'null' ? 'Not Started' : undoData.newStatus}</strong>
            </div>
          </div>
          <button
            onClick={handleUndo}
            className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
          >
            <FaUndo className="mr-1" />
            Undo
          </button>
        </div>
      )}

      {/* Filters and Search Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by patient name, service, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4">
          {/* Date Filters */}
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

          {/* Status Filters */}
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
            <FaCalendarAlt className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Advance availability:</span>
            <select
              value={selectedAvailabilityDate}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedAvailabilityDate(v);
                setDateFilter(v ? 'specific' : 'all');
                fetchAvailabilityDaySummary(v);
              }}
              className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select date</option>
              {futureAvailableDates.map(d => (
                <option key={d} value={d}>{new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila' }).format(new Date(d))}</option>
              ))}
            </select>
            {selectedAvailabilityDate && availabilityDaySummary && (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                {availabilityDaySummary.remaining_slots} slots left
              </span>
            )}
            {selectedAvailabilityDate && availabilityDaySummary && (
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                {availabilityDaySummary.booked_count} booked
              </span>
            )}
            {selectedAvailabilityDate && availabilityDaySummary && (
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                {availabilityDaySummary.total_slots} total
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient & Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prenatal Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
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
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    {appointments.length === 0 ? 'No appointments found' : 'No appointments match your filters'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patient_name}
                        </div>
                        {appointment.age && (
                          <div className="text-xs text-gray-600">
                            Age: {appointment.age} years
                          </div>
                        )}
                        {appointment.follow_up_of_booking_id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 inline-flex items-center gap-1 w-fit">
                            🔄 Follow-up
                          </span>
                        )}
                        {appointment.follow_up_provider_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 inline-flex items-center gap-1 w-fit">
                            Next: {appointment.follow_up_provider_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(appointment.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.time_slot}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.service_type}
                      </div>
                      {Number(appointment.has_vitals) === 1 && (
                        <div className="text-xs text-green-700 mt-1">
                          Vitals recorded
                        </div>
                      )}
                      {/* Feedback for completed */}
                      {String(appointment.appointment_status || '').toLowerCase() === 'completed' && appointment.feedback_rating && (
                        <div className="text-xs text-gray-600 mt-1" title={appointment.feedback_comment || ''}>
                          ★ {appointment.feedback_rating}/5 {appointment.feedback_comment ? `— ${appointment.feedback_comment.substring(0, 40)}${appointment.feedback_comment.length > 40 ? '…' : ''}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-700">
                        {appointment.last_menstrual_period && (
                          <div className="mb-1">
                            <span className="font-medium">LMP:</span> {formatDate(appointment.last_menstrual_period)}
                          </div>
                        )}
                        {(() => {
                          const aog = calculateAOG(appointment.last_menstrual_period, appointment.date);
                          return aog ? (
                            <div className="mb-1">
                              <span className="font-medium">AOG:</span>{' '}
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                {aog.weeks}w {aog.days}d
                              </span>
                            </div>
                          ) : null;
                        })()}
                        {appointment.expected_delivery_date && (
                          <div className="mb-1">
                            <span className="font-medium">EDD:</span> {formatDate(appointment.expected_delivery_date)}
                          </div>
                        )}
                        {!appointment.last_menstrual_period && !appointment.expected_delivery_date && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.contact_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRequestStatusBadgeClass(appointment.request_status)}`}>
                        {appointment.request_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.appointment_status)}`}>
                          {appointment.appointment_status === 'null' ? 'Not Started' : appointment.appointment_status}
                        </span>
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
                      {appointment.request_status === 'confirmed' && (isToday(appointment.date) || appointment.appointment_status === 'ongoing') && (
                        <div className="flex flex-wrap gap-2">
                          {/* Start (ongoing) removed; doctors can complete or cancel only */}
                          {appointment.appointment_status === 'ongoing' && (
                            <button
                              onClick={() => handleAppointmentStatus(appointment.id, 'completed')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {(appointment.appointment_status === 'null' || appointment.appointment_status === 'ongoing') && (
                            <button
                              onClick={() => handleAppointmentStatus(appointment.id, 'cancelled')}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {appointment.appointment_status === 'completed' && (
                            <>
                              <button
                                onClick={() => openFollowUpModal(appointment)}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Schedule Follow-up
                              </button>
                              <button
                                onClick={() => {
                                  handleCompleteAppointment(appointment);
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Add Medical Reports
                              </button>
                              <button
                                onClick={() => handleDownloadMedicalRecord(appointment.id, appointment.patient_name)}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                title="Download Medical Records PDF"
                              >
                                <FaFilePdf /> PDF
                              </button>
                              <button
                                onClick={() => {
                                  setAppointmentToDelete(appointment);
                                  setShowDeleteModal(true);
                                }}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                                title="Delete Appointment"
                              >
                                <FaTrash /> Delete
                              </button>
                            </>
                          )}
                          {appointment.appointment_status === 'cancelled' && (
                            <button
                              onClick={() => {
                                setAppointmentToDelete(appointment);
                                setShowDeleteModal(true);
                              }}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                              title="Delete Appointment"
                            >
                              <FaTrash /> Delete
                            </button>
                          )}
                        </div>
                      )}
                      {appointment.request_status === 'pending' && (
                        <span className="text-yellow-600 text-sm">Waiting for admin approval</span>
                      )}
                      {appointment.appointment_status === 'completed' && (
                        <span className="text-green-600 text-sm">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFollowUpModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Follow-up for {selectedAppointment.patient_name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <ColorCodedDatePicker
                  selectedDate={followUpDate}
                  onChange={(date) => setFollowUpDate(date)}
                  schedules={schedules}
                  minDate={new Date()}
                  remainingSlotsByDate={remainingSlotsByDate}
                  disableUnavailable={true}
                  onMonthChange={handleFollowUpMonthChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                <select
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a time slot</option>
                  {['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8', 'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12', 'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'].map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service (optional)</label>
                <select
                  value={followUpService}
                  onChange={(e) => setFollowUpService(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Same as current ({selectedAppointment.service_type})</option>
                  {services.map((s) => (
                    <option key={s.id || s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Visit Provider</label>
                <select
                  value={followUpProviderType}
                  onChange={(e) => setFollowUpProviderType(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="doctor">Doctor</option>
                  <option value="midwife">OBGYN/Midwife</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Specify who should handle the next appointment</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={submitFollowUp}
                disabled={!followUpDate || !followUpTime}
                className={`px-4 py-2 rounded-md text-white font-medium ${(!followUpDate || !followUpTime) ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                Save Follow-up
              </button>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
                  {formatDate(selectedAppointmentDetails.date)} at {selectedAppointmentDetails.time_slot}
                </div>
                <div className="text-sm text-gray-600">Service: {selectedAppointmentDetails.service_type}</div>
              </div>

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

      {/* Smart Completion Modal */}
      {showSmartCompletionModal && selectedAppointment && (
        <SmartCompletionModal
          appointment={selectedAppointment}
          services={services}
          onClose={() => {
            setShowSmartCompletionModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={handleCompletionSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && appointmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Appointment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this appointment for <strong>{appointmentToDelete.patient_name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAppointmentToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAppointment}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Docappointment;
