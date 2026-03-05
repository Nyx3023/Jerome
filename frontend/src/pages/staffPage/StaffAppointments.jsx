import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { getServiceCategory, getAllVitalSigns, validateRequiredFields } from '../../utils/serviceCategories';
import { FaWalking, FaUser, FaSearch, FaFilter, FaCalendarAlt, FaTrash, FaEllipsisV, FaEdit, FaUserCheck, FaBan, FaEye, FaFilePdf } from 'react-icons/fa';
import { generateSingleMedicalRecordHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../../utils/logoUtils';
import SmartCompletionModal from '../../components/SmartCompletionModal';
import ColorCodedDatePicker from '../../components/ColorCodedDatePicker';

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

const StaffAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    booking_id: '',
    existing_user_id: '',
    patient_name: '',
    contact_number: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showSmartCompletionModal, setShowSmartCompletionModal] = useState(false);
  const [vitals, setVitals] = useState({});
  const [vitalFields, setVitalFields] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterDate, setFilterDate] = useState('today');
  const [filterSource, setFilterSource] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all'); // New filter for Midwife/OB
  const [availableOnly, setAvailableOnly] = useState(false);
  const [availableDates, setAvailableDates] = useState(new Set());

  const [schedules, setSchedules] = useState([]); // Store all schedules for date coloring
  const [services, setServices] = useState([]);
  const [linkServiceType, setLinkServiceType] = useState('');
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
  const [selectedDateSlots, setSelectedDateSlots] = useState([]);
  const [daySlotSummary, setDaySlotSummary] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
  const [dropdownUp, setDropdownUp] = useState(false);
  const [dropdownPortal, setDropdownPortal] = useState(null);
  const [activeDropdownAppointment, setActiveDropdownAppointment] = useState(null);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsPatient, setRecordsPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);

  const timeSlots = [
    'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4',
    'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8',
    'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12',
    'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'
  ];

  const isStaffHandledService = (serviceType) => {
    const category = getServiceCategory(serviceType, services);
    return ['lab_results', 'immunizations', 'screening', 'family_planning'].includes(category);
  };

  const isToday = (date) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    const aptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(appointmentDate);
    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(today);
    return aptDateStr === todayDateStr;
  };

  // Helper function to format date correctly without timezone issues
  // Using the same approach as doctor page
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila' }).format(new Date(dateString));
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get('/api/staff/schedules');
      const rows = res.data || [];
      setSchedules(rows); // Store all schedules
      // Include both 'available' and 'ob available' as bookable dates
      const dates = new Set(
        rows
          .filter(e => {
            const status = String(e.status || e.title || '').toLowerCase();
            return status === 'available' || status === 'ob available';
          })
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

  // Helper function to get date status for styling - matches main calendar behavior
  const getDateStatus = (dateString) => {
    if (!dateString) return 'available';
    const schedule = schedules.find(s => {
      const d = new Date(s.start || s.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}` === dateString;
    });
    // Default to available if no schedule found (matches main calendar behavior)
    if (!schedule) return 'available';
    const status = String(schedule.status || schedule.title || '').toLowerCase();
    // Normalize status values
    if (status === 'holiday') return 'holiday';
    if (status === 'not available' || status === 'notavailable') return 'not-available';
    if (status === 'ob available' || status === 'ob-available') return 'ob-available';
    return 'available';
  };

  const handlePrintAppointment = (appointment) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Appointment Details - ${appointment.patient_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              font-size: 18px;
              color: #333;
              margin-bottom: 10px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-label {
              font-weight: bold;
              width: 200px;
              color: #555;
            }
            .info-value {
              flex: 1;
              color: #333;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-confirmed { background: #d1fae5; color: #065f46; }
            .status-ongoing { background: #fed7aa; color: #9a3412; }
            .status-completed { background: #bfdbfe; color: #1e3a8a; }
            .status-cancelled { background: #fecaca; color: #991b1b; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Appointment Details</h1>
            <p>Printed on: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
          </div>

          <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="info-row">
              <div class="info-label">Patient Name:</div>
              <div class="info-value">${appointment.patient_name || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Contact Number:</div>
              <div class="info-value">${appointment.contact_number || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Patient Type:</div>
              <div class="info-value">${appointment.user_id && appointment.user_id !== 0 ? 'Online/Registered' : 'Walk-in'}</div>
            </div>
            ${appointment.follow_up_of_booking_id ? `
              <div class="info-row">
                <div class="info-label">Follow-up:</div>
                <div class="info-value">
                  <span class="status-badge" style="background: #f3e8ff; color: #6b21a8;">
                    🔄 This is a follow-up appointment
                  </span>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Appointment Details</div>
            <div class="info-row">
              <div class="info-label">Service:</div>
              <div class="info-value">${appointment.session || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Date:</div>
              <div class="info-value">${formatDate(appointment.date)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Time Slot:</div>
              <div class="info-value">${appointment.time || 'Not specified'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Request Status:</div>
              <div class="info-value">
                <span class="status-badge status-${appointment.request_status?.toLowerCase() || 'pending'}">
                  ${appointment.request_status || 'N/A'}
                </span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">Appointment Status:</div>
              <div class="info-value">
                <span class="status-badge status-${appointment.appointment_status?.toLowerCase() || 'pending'}">
                  ${getAppointmentStatusDisplay(appointment.appointment_status)}
                </span>
              </div>
            </div>
            ${appointment.checked_in_at ? `
              <div class="info-row">
                <div class="info-label">Checked-in At:</div>
                <div class="info-value">${new Date(appointment.checked_in_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</div>
              </div>
            ` : ''}
          </div>

          ${appointment.notes ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <div style="padding: 10px; background: #f9fafb; border-radius: 4px;">
                ${appointment.notes}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>This is an official appointment record.</p>
            <p>For inquiries, please contact the clinic.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
            try {
              window.addEventListener('afterprint', () => {
                try { window.close(); } catch (e) {}
                try {
                  if (window.opener) {
                    window.opener.focus && window.opener.focus();
                    window.opener.dispatchEvent && window.opener.dispatchEvent(new Event('focus'));
                    window.opener.dispatchEvent && window.opener.dispatchEvent(new Event('afterprint'));
                  }
                } catch (e) {}
              });
              window.addEventListener('beforeunload', () => {
                try {
                  if (window.opener) {
                    window.opener.focus && window.opener.focus();
                    window.opener.dispatchEvent && window.opener.dispatchEvent(new Event('focus'));
                    window.opener.dispatchEvent && window.opener.dispatchEvent(new Event('afterprint'));
                  }
                } catch (e) {}
              });
            } catch (e) {}
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(printContent);
    doc.close();
    const cleanup = () => {
      try { document.body.removeChild(iframe); } catch (e) { void e }
      try { window.focus && window.focus(); } catch (e) { void e }
      try { window.dispatchEvent && window.dispatchEvent(new Event('focus')); } catch (e) { void e }
      try { window.dispatchEvent && window.dispatchEvent(new Event('afterprint')); } catch (e) { void e }
    };
    if (iframe.contentWindow && typeof iframe.contentWindow.addEventListener === 'function') {
      iframe.contentWindow.addEventListener('afterprint', cleanup);
      iframe.contentWindow.addEventListener('beforeunload', cleanup);
    }
    try { doc.title = `Appointment Details - ${appointment.patient_name}`; } catch (e) { void e }
  };

  useEffect(() => {
    if (import.meta.env.DEV) console.log('Component mounted');
    fetchAppointments();
    fetchServices();
    fetchSchedules();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      try { setOpenDropdown(null); } catch { }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (showSmartCompletionModal || showEditModal || showVitalsModal || showStatusModal || showWalkInModal || showDeleteModal) {
      return;
    }
    const t = setInterval(() => {
      try { fetchAppointments(); } catch (e) { void e }
    }, 15000);
    return () => clearInterval(t);
  }, [showSmartCompletionModal, showEditModal, showVitalsModal, showStatusModal, showWalkInModal, showDeleteModal]);

  const fetchAppointments = () => {
    if (import.meta.env.DEV) console.log('Fetching appointments...');
    axios.get('/api/staff/appointments')
      .then(response => {
        if (import.meta.env.DEV) console.log('Appointments fetched:', response.data);
        setAppointments(response.data);
      })
      .catch(error => {
        if (import.meta.env.DEV) console.error('Error fetching appointments:', error);
      });
  };

  const fetchBookedSlotsForDate = async (date) => {
    if (!date) { setSelectedDateSlots([]); return; }
    try {
      const response = await axios.get(`/api/users/booked-slots?date=${date}`);
      setSelectedDateSlots(response.data || []);
    } catch (error) {
      setSelectedDateSlots([]);
    }
  };

  const fetchDaySlotSummary = async (date) => {
    if (!date) { setDaySlotSummary(null); return; }
    try {
      const response = await axios.get(`/api/users/day-slot-summary?date=${date}`);
      setDaySlotSummary(response.data || null);
    } catch (error) {
      setDaySlotSummary(null);
    }
  };



  const handleCheckIn = async (appointment) => {
    try {
      await axios.post('/api/staff/bookings/check-in', { booking_id: appointment.id });
      fetchAppointments();
      alert('Patient checked-in');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check-in');
    }
  };

  const handleReleaseNoShow = async (appointment) => {
    try {
      await axios.post('/api/staff/bookings/release-no-show', { booking_id: appointment.id });
      fetchAppointments();
      alert('Slot released (no-show)');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to release slot');
    }
  };



  const fetchMedicalRecordsForAppointment = async (appointment) => {
    try {
      setRecordsLoading(true);
      if (appointment.user_id && appointment.user_id !== 0) {
        const profileResponse = await axios.get(`/api/admin/patient-profile/${appointment.user_id}`);
        const patientProfile = profileResponse.data;
        const recordsResponse = await axios.get(`/api/staff/medical-records/patient/${patientProfile.id}`);
        const records = recordsResponse.data?.medical_records || [];
        setMedicalRecords(records);
        setRecordsPatient({ name: patientProfile.name || appointment.patient_name, ...patientProfile });
        setShowRecordsModal(true);
      } else {
        const params = new URLSearchParams({ patient_name: appointment.patient_name || '', contact_number: appointment.contact_number || '' });
        const recordsResponse = await axios.get(`/api/staff/medical-records/walkin?${params.toString()}`);
        const records = recordsResponse.data || [];
        setMedicalRecords(records);
        setRecordsPatient({ name: appointment.patient_name, phone: appointment.contact_number, patient_type: 'walk_in' });
        setShowRecordsModal(true);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching medical records:', error);
      alert(error.response?.data?.error || 'Failed to load medical records');
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleDownloadRecord = async (record) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const patient = recordsPatient || { name: 'Patient' };
      const html = generateSingleMedicalRecordHTML(patient, record, logoUrl);
      const dateStr = new Date(record.visit_date || record.appointment_date || Date.now()).toISOString().split('T')[0];
      downloadHTMLAsPDF(html, `Medical_Record_${(patient.name || 'Patient').replace(/\s+/g, '_')}_${dateStr}`);
    } catch (e) {
      alert('Error generating PDF');
    }
  };


  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/staff/services');
      const raw = response.data || [];
      const normalized = raw.map((s, i) => {
        if (typeof s === 'string') return { id: i + 1, name: s };
        return {
          id: s.id ?? s.service_id ?? i + 1,
          name: s.name ?? s.service_type ?? '',
          category: s.category ?? 'general'
        };
      });
      setServices(normalized);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching services:', error);
    }
  };

  const handleRequestStatus = async (id, status) => {
    try {
      await axios.put('/api/staff/updateRequestStatus', {
        id,
        status
      });
      fetchAppointments();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating request status:', error);
    }
  };

  const handleAppointmentStatus = async (id, status) => {
    if (status === 'completed') {
      // Use smart completion modal for completing appointments
      const appointment = appointments.find(apt => apt.id === id);
      setSelectedAppointment(appointment);
      setShowSmartCompletionModal(true);
      setShowStatusModal(false);
    } else {
      // For other status changes, proceed normally
      try {
        await axios.put('/api/staff/updateAppointmentStatus', {
          id,
          status
        });
        fetchAppointments();
        setShowStatusModal(false);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error updating appointment status:', error);
      }
    }
  };

  const handleCompletionSuccess = () => {
    setShowSmartCompletionModal(false);
    setSelectedAppointment(null);
    fetchAppointments(); // Refresh the appointments list
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      await axios.delete(`/api/staff/appointments/${appointmentToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      fetchAppointments();
      alert('Appointment deleted successfully');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting appointment:', error);
      alert(error.response?.data?.error || 'Failed to delete appointment');
    }
  };

  const openEditModal = (appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      booking_id: appointment.id,
      existing_user_id: appointment.user_id || '',
      patient_name: appointment.patient_name || '',
      contact_number: appointment.contact_number || '',
      service_id: '', // Start empty so user can choose to change or keep current
      appointment_date: '', // Start empty so user can choose to change or keep current
      appointment_time: '', // Start empty so user can choose to change or keep current
      notes: appointment.notes || ''
    });
    setShowEditModal(true);
  };

  const updateAppointment = async (e) => {
    e.preventDefault();
    try {
      // Validate date availability if date is being changed
      if (editForm.appointment_date) {
        const dateStatus = getDateStatus(editForm.appointment_date);
        if (dateStatus === 'holiday') {
          alert('Cannot reschedule to a holiday or unavailable date. Please choose an available date (highlighted in green).');
          return;
        }
      }

      await axios.put(`/api/admin/appointments/${editForm.booking_id}`, {
        service_id: editForm.service_id,
        appointment_date: editForm.appointment_date,
        appointment_time: editForm.appointment_time,
        notes: editForm.notes
      });
      setShowEditModal(false);
      fetchAppointments(); // Refresh the appointments list
      alert('Appointment updated successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update appointment');
    }
  };

  const openVitalsModal = (appointment) => {
    setSelectedAppointment(appointment);
    const category = getServiceCategory(appointment.service_type, services);
    const fields = getAllVitalSigns(category);
    setVitalFields(fields);
    const initial = {};
    fields.forEach(f => { initial[f.key] = ''; });
    initial.recorded_at = new Date().toISOString();
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); initial.recorded_by = u?.name || ''; } catch { initial.recorded_by = ''; }
    setVitals(initial);
    setShowVitalsModal(true);
  };

  const submitVitals = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      const category = getServiceCategory(selectedAppointment.service_type, services);
      const validationErrors = validateRequiredFields(category, vitals, {});
      if (validationErrors.length > 0) {
        alert(validationErrors.join('\n'));
        return;
      }
      const payload = {
        booking_id: selectedAppointment.id,
        patient_id: selectedAppointment.patient_id || null,
        vital_signs: { ...vitals }
      };
      await axios.post('/api/staff/vitals', payload);
      setShowVitalsModal(false);
      setSelectedAppointment(null);
      setVitals({});
      fetchAppointments();
      alert('Vital signs saved');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error saving vital signs:', err);
      alert(err.response?.data?.error || 'Error saving vital signs');
    }
  };

  // Search existing patients
  const searchPatients = async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`/api/staff/search-patients?search_term=${encodeURIComponent(term.trim())}`);
      setSearchResults(res.data || []);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error searching patients:', err);
      setSearchResults([]);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      const fullName = [walkInForm.first_name, walkInForm.middle_name, walkInForm.last_name].filter(Boolean).join(' ').trim() || walkInForm.patient_name;
      if (!fullName) { alert('Please enter the patient name'); return; }
      if (!walkInForm.service_type) { alert('Please select a service'); return; }
      const phone = String(walkInForm.contact_number || '').trim();
      if (phone && !/^\d{10,11}$/.test(phone)) { alert('Contact number must be 10-11 digits'); return; }

      // Validate date availability
      if (walkInForm.date) {
        const dateStatus = getDateStatus(walkInForm.date);
        if (dateStatus === 'holiday') {
          alert('Cannot book on a holiday or unavailable date. Please choose an available date (highlighted in green).');
          return;
        }
      }
      const isScheduled = !!walkInForm.date;
      // Check if selected date is OB available
      const isOBDate = walkInForm.date && getDateStatus(walkInForm.date) === 'ob-available';
      const payload = isScheduled ? {
        patient_name: fullName,
        first_name: walkInForm.first_name,
        middle_name: walkInForm.middle_name,
        last_name: walkInForm.last_name,
        contact_number: walkInForm.contact_number,
        service_type: walkInForm.service_type,
        date: walkInForm.date,
        time_slot: walkInForm.time_slot,
        existing_user_id: walkInForm.existing_user_id,
        is_ob_booking: isOBDate ? 1 : 0,
        ob_provider_type: isOBDate ? 'midwife' : null
      } : {
        patient_name: fullName,
        contact_number: walkInForm.contact_number,
        service_type: walkInForm.service_type,
        triage_level: 'normal',
        assign_immediately: true,
        date: walkInForm.date,
        existing_user_id: walkInForm.existing_user_id
      };
      const endpoint = isScheduled ? '/api/admin/create-walkin' : '/api/staff/walkins/checkin';
      const response = await axios.post(endpoint, payload);
      if (response.status === 201 || response.status === 200) {
        setShowWalkInModal(false);
        setWalkInForm({
          first_name: '',
          middle_name: '',
          last_name: '',
          patient_name: '',
          contact_number: '',
          service_type: '',
          date: '',
          existing_user_id: ''
        });
        setSelectedPatient(null);
        setPatientSearch('');
        setSearchResults([]);
        if (response.data?.booking) {
          alert(`Walk-in created for ${response.data.booking.date}`);
        } else if (response.data?.booking_id) {
          alert('Walk-in appointment created successfully!');
        } else {
          alert('No available slot');
        }
        fetchAppointments();
      }
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Error adding walk-in to queue';
      const code = error?.response?.data?.error_code ? ` (code: ${error.response.data.error_code})` : '';
      const nextDate = error?.response?.data?.next_available_date || null;
      if (import.meta.env.DEV) console.error('Error creating walk-in appointment:', msg, code);
      if (nextDate) {
        alert(`${msg}. Suggested date: ${nextDate}`);
        setWalkInForm(prev => ({ ...prev, date: nextDate, time_slot: '' }));
        fetchBookedSlotsForDate(nextDate);
      } else {
        alert(`${msg}${code}`);
      }
    }
  };

  const handleWalkInFormChange = (e) => {
    const { name, value } = e.target;
    const v = value == null ? '' : value;
    setWalkInForm(prev => ({
      ...prev,
      [name]: v
    }));
    if (name === 'date') {
      fetchBookedSlotsForDate(v);
      fetchDaySlotSummary(v);
    }
  };

  const getAppointmentStatusDisplay = (status) => {
    return status === 'null' ? '-' : status;
  };

  const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  const futureAvailableDates = Array.from(availableDates).filter(d => d >= todayDateStr).sort();

  const filteredAppointments = appointments.filter(appointment => {
    // Search filter
    const matchesSearch =
      appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.session.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active'
        ? (() => {
          const req = String(appointment.request_status || '').toLowerCase();
          const apt = String(appointment.appointment_status || '').toLowerCase();
          return ['pending', 'confirmed', 'ongoing'].includes(req) || ['ongoing'].includes(apt);
        })()
        : appointment.request_status?.toLowerCase() === filterStatus.toLowerCase());

    // Date filter
    const matchesDate = filterDate === 'all' || (() => {
      // Use same timezone-aware approach as doctor page
      const appointmentDate = new Date(appointment.date);
      const today = new Date();

      // Compare using date string to avoid timezone issues
      const aptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(appointmentDate);
      const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(today);

      switch (filterDate) {
        case 'today':
          return aptDateStr === todayDateStr;
        case 'week':
          const weekFromNow = new Date(today);
          weekFromNow.setDate(today.getDate() + 7);
          const weekEndStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(weekFromNow);
          return aptDateStr >= todayDateStr && aptDateStr <= weekEndStr;
        case 'month':
          return aptDateStr.substring(0, 7) === todayDateStr.substring(0, 7);
        default:
          return true;
      }
    })();

    // Source filter: online vs walk-in
    const isOnline = !!(appointment.user_id && appointment.user_id !== 0);
    const matchesSource = filterSource === 'all' || (filterSource === 'online' ? isOnline : !isOnline);

    // Available date toggle
    const y = appointment.date.split('T')[0] || appointment.date; // handle ISO
    const matchesAvailability = !availableOnly || availableDates.has(y);

    // Provider filter: use ob_provider_type to correctly separate OB-doctor vs OB-midwife
    const isOBAppointment = appointment.is_ob_booking === 1;
    const providerType = appointment.ob_provider_type || ''; // 'doctor', 'midwife', or ''
    const isOBDoctor = isOBAppointment && providerType !== 'midwife';
    const isOBMidwife = isOBAppointment && providerType === 'midwife';
    const matchesProvider = filterProvider === 'all' ||
      (filterProvider === 'midwife' && (isOBMidwife || !isOBAppointment)) ||
      (filterProvider === 'ob' && isOBDoctor);

    return matchesSearch && matchesStatus && matchesDate && matchesSource && matchesAvailability && matchesProvider;
  });

  const todaysAppointments = appointments.filter(a => isToday(a.date) && String(a.appointment_status || '').toLowerCase() !== 'cancelled' && String(a.request_status || '').toLowerCase() !== 'declined');
  const queueWaiting = todaysAppointments.filter(a => ['pending', 'confirmed'].includes(String(a.request_status || '').toLowerCase()) && !a.checked_in_at).length;
  const queueCalled = todaysAppointments.filter(a => String(a.appointment_status || '').toLowerCase() === 'ongoing' && !!a.checked_in_at).length;
  const pendingOnlineToday = todaysAppointments.filter(a => !!a.user_id && String(a.request_status || '').toLowerCase() === 'pending');

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
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <FaWalking className="mr-2" />
              New Walk-in Appointment
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Service</span>
              <select
                value={linkServiceType}
                onChange={(e) => setLinkServiceType(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="">Select</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              <button
                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={() => {
                  if (!linkServiceType) { alert('Please select a service'); return; }
                  navigate(`/staff/services/online-patients?service_type=${encodeURIComponent(linkServiceType)}`);
                }}
              >
                Online Patients
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                className="w-64 pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-3 top-2.5">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
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
          <div className="text-3xl font-bold text-gray-900">{pendingOnlineToday.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by date:</span>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>



        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
            onClick={() => { setFilterStatus('active'); setFilterDate('today'); setFilterSource('all'); setFilterProvider('all'); }}
          >
            Queue Today
          </button>
          <button
            className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
            onClick={() => { setFilterStatus('pending'); setFilterDate('today'); setFilterSource('online'); setFilterProvider('all'); }}
          >
            Online Pending Today
          </button>
          <button
            className="px-3 py-1 text-sm rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800"
            onClick={() => { setFilterStatus('all'); setFilterDate('all'); setFilterSource('all'); setFilterProvider('ob'); }}
          >
            👶 OB Appointments
          </button>
          <button
            className="px-3 py-1 text-sm rounded border border-green-300 bg-green-50 hover:bg-green-100 text-green-800"
            onClick={() => { setFilterStatus('all'); setFilterDate('all'); setFilterSource('all'); setFilterProvider('midwife'); }}
          >
            🤱 Midwife Appointments
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Source:</span>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="walkin">Walk-in</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Provider:</span>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All</option>
            <option value="midwife">🤱 Midwife</option>
            <option value="ob">👶 OB (Obstetrics)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
          <span className="text-sm font-medium text-gray-700">Available days only</span>
        </label>
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
                    <div className="text-sm text-gray-500">{new Date(appointment.date).toLocaleDateString()} • {appointment.time_slot} • {appointment.service_type}</div>
                  </div>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-visible">
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
                        {appointment.follow_up_of_booking_id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                            🔄 Follow-up
                          </span>
                        )}
                        {appointment.is_ob_booking === 1 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${appointment.ob_provider_type === 'doctor'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.ob_provider_type === 'midwife'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {appointment.ob_provider_type === 'doctor' ? '👨‍⚕️ OB-Doctor' : appointment.ob_provider_type === 'midwife' ? '🤱 OB-Midwife' : '👶 OB'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        <span>{appointment.session || 'N/A'}</span>
                        {appointment.has_vitals === 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Vitals recorded</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(appointment.request_status)}`}>
                          {appointment.request_status}
                        </span>
                        {String(appointment.request_status || '').toLowerCase() === 'declined' && (appointment.decline_reason || appointment.decline_note) && (
                          <button
                            onClick={() => { setSelectedAppointmentDetails(appointment); setShowDetailsModal(true); }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="View decline details"
                          >
                            View Details
                          </button>
                        )}
                        {(() => {
                          const req = String(appointment.request_status || '').toLowerCase();
                          const apt = String(appointment.appointment_status || '').toLowerCase();
                          const canAct = req === 'pending' && !['cancelled', 'completed'].includes(apt);
                          if (!canAct) {
                            return <span className="text-xs text-gray-500">No actions</span>;
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
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {String(appointment.appointment_status || '').toLowerCase() === 'cancelled' && (appointment.cancel_reason || appointment.cancel_note) && (
                        <button
                          onClick={() => { setSelectedAppointmentDetails(appointment); setShowDetailsModal(true); }}
                          className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title="View cancellation details"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        {/* Record Vitals Button - Standalone */}
                        <button
                          onClick={() => openVitalsModal(appointment)}
                          className={`px-3 py-1.5 rounded text-white whitespace-nowrap ${appointment.has_vitals === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                          title={appointment.has_vitals === 1 ? 'Update Vitals' : 'Record Vitals'}
                        >
                          {appointment.has_vitals === 1 ? 'Update Vitals' : 'Record Vitals'}
                        </button>

                        {/* Print Button */}
                        <button
                          onClick={() => handlePrintAppointment(appointment)}
                          className="text-gray-600 hover:text-gray-900 p-2 transition-colors"
                          title="Print Appointment Details"
                        >
                          <span role="img" aria-label="print" className="text-xl">🖨️</span>
                        </button>

                        {/* Actions Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const nextId = openDropdown === appointment.id ? null : appointment.id;
                              setOpenDropdown(nextId);
                              if (nextId) {
                                const r = e.currentTarget.getBoundingClientRect();
                                const menuH = 168;
                                const menuW = 192;
                                const up = (window.innerHeight - r.bottom) < (menuH + 8);
                                const top = up ? (r.top - menuH - 8) : (r.bottom + 8);
                                let left = r.right - menuW;
                                left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8));
                                setDropdownUp(up);
                                setDropdownPortal({ id: nextId, top, left, up });
                                setActiveDropdownAppointment(appointment);
                              } else {
                                setDropdownUp(false);
                                setDropdownPortal(null);
                                setActiveDropdownAppointment(null);
                              }
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                            title="More actions"
                          >
                            <FaEllipsisV className="text-lg" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openDropdown && dropdownPortal && activeDropdownAppointment && createPortal(
        <div data-portal="appointment-actions" className="contents">
          <div className="fixed inset-0 z-40" onClick={() => { setOpenDropdown(null); setDropdownPortal(null); setActiveDropdownAppointment(null); }}></div>
          <div className="fixed z-50 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" style={{ top: dropdownPortal.top, left: dropdownPortal.left }}>
            <div className="py-1">
              {activeDropdownAppointment.request_status === 'confirmed' && (
                <button
                  onClick={() => { openEditModal(activeDropdownAppointment); setOpenDropdown(null); setActiveDropdownAppointment(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FaEdit /> Edit
                </button>
              )}
              {activeDropdownAppointment.request_status === 'confirmed' && !activeDropdownAppointment.checked_in_at && isToday(activeDropdownAppointment.date) && (
                <button
                  onClick={() => { handleCheckIn(activeDropdownAppointment); setOpenDropdown(null); setActiveDropdownAppointment(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  <FaUserCheck /> Check-in
                </button>
              )}
              {activeDropdownAppointment.request_status === 'confirmed' && !activeDropdownAppointment.checked_in_at && isToday(activeDropdownAppointment.date) && (
                <button
                  onClick={() => { handleReleaseNoShow(activeDropdownAppointment); setOpenDropdown(null); setActiveDropdownAppointment(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                >
                  <FaBan /> Release no-show
                </button>
              )}
              <button
                onClick={() => { fetchMedicalRecordsForAppointment(activeDropdownAppointment); setOpenDropdown(null); setActiveDropdownAppointment(null); }}
                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
              >
                <FaEye /> View Records
              </button>
              {activeDropdownAppointment.request_status === 'confirmed' && (isToday(activeDropdownAppointment.date) || activeDropdownAppointment.appointment_status === 'ongoing') && isStaffHandledService(activeDropdownAppointment.service_type) && (
                <button
                  onClick={() => { setSelectedAppointment(activeDropdownAppointment); setShowSmartCompletionModal(true); setOpenDropdown(null); setActiveDropdownAppointment(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                >
                  Record Service Data
                </button>
              )}
              {(activeDropdownAppointment.appointment_status === 'completed' || activeDropdownAppointment.appointment_status === 'cancelled') && (
                <button
                  onClick={() => { setAppointmentToDelete(activeDropdownAppointment); setShowDeleteModal(true); setOpenDropdown(null); setActiveDropdownAppointment(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <FaTrash /> Delete
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showRecordsModal && recordsPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Medical Records</h2>
                <p className="text-gray-600">Patient: {recordsPatient.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (recordsPatient?.user_id) {
                      navigate(`/staff/patient/${recordsPatient.user_id}`);
                    } else {
                      const name = recordsPatient?.name || '';
                      const contact = recordsPatient?.phone || recordsPatient?.contact || '';
                      navigate(`/staff/walkin?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}`);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  View Full Record
                </button>
                <button
                  onClick={() => setShowRecordsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {medicalRecords.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No medical records found.</div>
              ) : (
                medicalRecords.map((record, idx) => (
                  <div key={record.id || idx} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-green-600" />
                        <span className="font-medium">{new Date(record.visit_date || record.appointment_date).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadRecord(record)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        <FaFilePdf className="inline mr-1" /> PDF
                      </button>
                    </div>
                    <div className="text-sm text-gray-800">
                      <div className="mb-1"><span className="text-gray-600">Diagnosis:</span> {record.diagnosis || 'Not specified'}</div>
                      <div className="mb-1"><span className="text-gray-600">Treatment:</span> {record.treatment_given || 'Not specified'}</div>
                      {record.vital_signs && (
                        <div className="mb-1"><span className="text-gray-600">Vitals:</span> {(() => {
                          try { const v = typeof record.vital_signs === 'string' ? JSON.parse(record.vital_signs) : record.vital_signs; const parts = []; if (v?.blood_pressure) parts.push(`BP: ${v.blood_pressure}`); if (v?.heart_rate) parts.push(`HR: ${v.heart_rate}`); if (v?.temperature) parts.push(`Temp: ${v.temperature}`); return parts.join(', '); } catch { return 'Recorded'; }
                        })()}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowRecordsModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
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
                onClick={() => handleAppointmentStatus(selectedAppointment.id, 'completed')}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${selectedAppointment.appointment_status === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-green-100'}`}
              >
                Completed
              </button>
              <button
                onClick={() => handleAppointmentStatus(selectedAppointment.id, 'cancelled')}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${selectedAppointment.appointment_status === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-red-100'}`}
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

      {/* Walk-in Appointment Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Create Walk-in Appointment
            </h3>
            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              {/* Patient Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Existing Patient (Optional)
                </label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <ColorCodedDatePicker
                    selectedDate={walkInForm.date ? new Date(walkInForm.date) : null}
                    onChange={(date) => {
                      const formatted = date ? new Intl.DateTimeFormat('en-CA').format(date) : '';
                      setWalkInForm(prev => ({ ...prev, date: formatted }));
                      if (formatted) {
                        fetchBookedSlotsForDate(formatted);
                        fetchDaySlotSummary(formatted);
                      }
                    }}
                    schedules={schedules}
                    minDate={new Date()}
                  />
                  {walkInForm.date && getDateStatus(walkInForm.date) === 'holiday' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>⚠️ Warning:</strong> This date is marked as Holiday/Unavailable. Please choose an available date.
                    </div>
                  )}
                  {walkInForm.date && getDateStatus(walkInForm.date) === 'ob-available' && (
                    <div className="mt-2 p-3 rounded-lg border-2 border-blue-400 bg-gradient-to-r from-blue-100 to-blue-50">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👶</span>
                        <div>
                          <div className="font-semibold text-blue-800">OB Available Date</div>
                          <div className="text-sm text-blue-700">This date is designated for OB (Obstetrics) appointments. Specialized prenatal and maternity services are available.</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {walkInForm.date && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {daySlotSummary ? (
                        <>
                          <span className={`px-2 py-1 rounded ${daySlotSummary.remaining_slots > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {daySlotSummary.remaining_slots} slots left
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                            {daySlotSummary.booked_count} booked
                          </span>
                          {daySlotSummary.blocked_count > 0 && (
                            <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
                              {daySlotSummary.blocked_count} blocked
                            </span>
                          )}
                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {daySlotSummary.total_slots} total
                          </span>
                        </>
                      ) : (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Select a date to view slots</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowWalkInModal(false);
                    setWalkInForm({
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
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {showVitalsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Vital Signs</h3>
            <form onSubmit={submitVitals} className="space-y-4">
              {vitalFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={vitals[field.key] || ''}
                    onChange={(e) => setVitals(v => ({ ...v, [field.key]: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder={field.placeholder || ''}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowVitalsModal(false); setSelectedAppointment(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Appointment</h3>
            <form onSubmit={updateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <div className="text-gray-900 text-sm">{selectedAppointment.patient_name}</div>
                <div className="text-gray-500 text-xs">{selectedAppointment.contact_number || 'No contact on file'}</div>
              </div>

              {/* Current appointment details */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Appointment Details:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><span className="font-medium">Service:</span> {selectedAppointment.session || 'Not specified'}</div>
                  <div><span className="font-medium">Date:</span> {selectedAppointment.date || 'Not specified'}</div>
                  <div><span className="font-medium">Time:</span> {selectedAppointment.time || 'Not specified'}</div>
                  <div><span className="font-medium">Notes:</span> {selectedAppointment.notes || 'No notes'}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={editForm.service_id}
                  onChange={(e) => setEditForm(v => ({ ...v, service_id: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Keep current service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current service</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date <span className="text-gray-400">(Optional)</span></label>
                <ColorCodedDatePicker
                  selectedDate={editForm.appointment_date ? new Date(editForm.appointment_date) : null}
                  onChange={(date) => {
                    const formatted = date ? new Intl.DateTimeFormat('en-CA').format(date) : '';
                    setEditForm(v => ({ ...v, appointment_date: formatted }));
                  }}
                  schedules={schedules}
                  minDate={new Date()}
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current date</p>
                {editForm.appointment_date && getDateStatus(editForm.appointment_date) === 'holiday' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>⚠️ Warning:</strong> This date is marked as Holiday/Unavailable. Please choose an available date.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time <span className="text-gray-400">(Optional)</span></label>
                <input
                  type="time"
                  value={editForm.appointment_time}
                  onChange={(e) => setEditForm(v => ({ ...v, appointment_time: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current time</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(v => ({ ...v, notes: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                  placeholder="Additional notes or special requirements"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Update Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Completion Modal */}
      {showSmartCompletionModal && selectedAppointment && (
        <SmartCompletionModal
          appointment={selectedAppointment}
          services={services}
          onClose={() => setShowSmartCompletionModal(false)}
          onSuccess={handleCompletionSuccess}
          actorRole={'staff'}
          allowComplete={true}
        />
      )}

      {showDetailsModal && selectedAppointmentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => { setShowDetailsModal(false); setSelectedAppointmentDetails(null); }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
                <div className="text-sm text-gray-600">{selectedAppointmentDetails.patient_name}</div>
                <div className="text-xs text-gray-500">{formatDate(selectedAppointmentDetails.date)} • {selectedAppointmentDetails.time_slot} • {selectedAppointmentDetails.session}</div>
              </div>
              <button onClick={() => { setShowDetailsModal(false); setSelectedAppointmentDetails(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {String(selectedAppointmentDetails.request_status || '').toLowerCase() === 'declined' && (
              <div className="border-l-4 border-red-400 bg-red-50 p-4 mb-4">
                <div className="text-sm font-medium text-red-800 mb-2">Appointment Declined</div>
                {selectedAppointmentDetails.decline_reason && (
                  <div className="mb-1"><span className="text-sm font-medium text-red-700">Reason: </span><span className="text-sm text-red-700">{selectedAppointmentDetails.decline_reason}</span></div>
                )}
                {selectedAppointmentDetails.declined_by && (
                  <div className="mb-1"><span className="text-sm font-medium text-red-700">Declined by: </span><span className="text-sm text-red-700 capitalize">{selectedAppointmentDetails.declined_by}</span></div>
                )}
                {selectedAppointmentDetails.decline_note && (
                  <div className="mb-1"><span className="text-sm font-medium text-red-700">Note: </span><span className="text-sm text-red-700">{selectedAppointmentDetails.decline_note}</span></div>
                )}
                {selectedAppointmentDetails.declined_at && (
                  <div className="text-xs text-red-600">Declined on {new Date(selectedAppointmentDetails.declined_at).toLocaleString()}</div>
                )}
              </div>
            )}

            {String(selectedAppointmentDetails.appointment_status || '').toLowerCase() === 'cancelled' && (
              <div className="border-l-4 border-red-400 bg-red-50 p-4 mb-2">
                <div className="text-sm font-medium text-red-800 mb-2">Appointment Cancelled</div>
                {selectedAppointmentDetails.cancel_reason && (
                  <div className="mb-1"><span className="text-sm font-medium text-red-700">Reason: </span><span className="text-sm text-red-700">{selectedAppointmentDetails.cancel_reason}</span></div>
                )}
                {selectedAppointmentDetails.cancelled_by && (
                  <div className="mb-1"><span className="text-sm font-medium text-red-700">Cancelled by: </span><span className="text-sm text-red-700 capitalize">{selectedAppointmentDetails.cancelled_by}</span></div>
                )}
                {selectedAppointmentDetails.cancel_note && (
                  <div className="mb-1"><span className="text-sm font-medium text-red-700">Note: </span><span className="text-sm text-red-700">{selectedAppointmentDetails.cancel_note}</span></div>
                )}
                {selectedAppointmentDetails.cancelled_at && (
                  <div className="text-xs text-red-600">Cancelled on {new Date(selectedAppointmentDetails.cancelled_at).toLocaleString()}</div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={() => { setShowDetailsModal(false); setSelectedAppointmentDetails(null); }} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
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

export default StaffAppointments;
