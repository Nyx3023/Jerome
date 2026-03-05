import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import UserLayout from '../../components/UserLayout';
import ColorCodedDatePicker from '../../components/ColorCodedDatePicker';
import { FaClock, FaCalendarAlt, FaStethoscope, FaCheckCircle, FaTimesCircle, FaSpinner, FaSearch } from 'react-icons/fa';

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'ongoing':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return <FaCheckCircle className="mr-1.5" />;
    case 'pending':
      return <FaClock className="mr-1.5" />;
    case 'cancelled':
      return <FaTimesCircle className="mr-1.5" />;
    case 'completed':
      return <FaCheckCircle className="mr-1.5" />;
    case 'ongoing':
      return <FaClock className="mr-1.5" />;
    default:
      return null;
  }
};

const Myappointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [secondaryFilter, setSecondaryFilter] = useState('all'); // today | thisWeek | needsAction | all
  const [searchTerm, setSearchTerm] = useState('');
  const [nextAppointment, setNextAppointment] = useState(null);
  const [nextFollowUp, setNextFollowUp] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('patient_request');
  const [cancelNote, setCancelNote] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [overdueReportedIds, setOverdueReportedIds] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [daySlotSummary, setDaySlotSummary] = useState(null);
  const [monthCounts, setMonthCounts] = useState({});

  // Clinic info for action chips
  const clinicAddress = 'N.B. Segodine Lying-In Clinic';
  const clinicPhone = '+63 900 000 0000';

  useEffect(() => {
    fetchAppointments();
    axios.get('/api/users/schedules')
      .then(res => setSchedules(res.data || []))
      .catch(() => setSchedules([]));
  }, []);

  useEffect(() => {
    if (showRescheduleModal) {
      const d = new Date();
      fetchMonthCounts(d);
    }
  }, [showRescheduleModal]);

  const formatDateCA = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);

  const fetchMonthCounts = async (anchorDate) => {
    try {
      const base = anchorDate || new Date();
      const year = base.getFullYear();
      const month = base.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      const counts = {};
      const tasks = [];
      for (let day = 1; day <= days; day++) {
        const d = new Date(year, month, day);
        const ds = formatDateCA(d);
        tasks.push(
          axios.get(`/api/users/day-slot-summary?date=${ds}`)
            .then(res => { counts[ds] = res.data?.remaining_slots ?? 0; })
            .catch(() => { counts[ds] = 0; })
        );
      }
      await Promise.all(tasks);
      setMonthCounts(counts);
    } catch (e) { void e }
  };

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

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/patient-appointments');
      const data = response.data || [];
      setAppointments(data);
      try {
        const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(d));
        const todayStr = fmt(new Date());
        const overdueIds = (data || [])
          .filter(a => {
            const aptStr = fmt(a.date);
            const as = String(a.appointment_status || '').toLowerCase();
            return aptStr < todayStr && !['completed', 'cancelled'].includes(as);
          })
          .map(a => a.id)
          .filter(id => !overdueReportedIds.includes(id));
        if (overdueIds.length > 0) {
          await axios.post('/api/users/report-overdue', { booking_ids: overdueIds });
          setOverdueReportedIds(prev => [...prev, ...overdueIds]);
        }
      } catch (e) { void e }
      // Compute next upcoming (today or future), pending/confirmed, not cancelled/completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parseStartMinutes = (timeSlot) => {
        if (!timeSlot) return 0;
        const part = String(timeSlot).split('-')[0]?.trim() || '';
        const m = part.match(/(\d{1,2})(?::(\d{2}))?(AM|PM)/i);
        if (!m) return 0;
        let h = parseInt(m[1] || '0', 10);
        const min = parseInt(m[2] || '0', 10);
        const ampm = (m[3] || 'AM').toUpperCase();
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      };
      const upcomingSorted = data
        .filter(a => {
          const rs = (a.request_status || '').toLowerCase();
          const as = (a.appointment_status || '').toLowerCase();
          const d = new Date(a.date); d.setHours(0, 0, 0, 0);
          return d >= today && ['pending', 'confirmed'].includes(rs) && !['cancelled', 'completed'].includes(as);
        })
        .sort((a, b) => {
          const ad = new Date(a.date) - new Date(b.date);
          if (ad !== 0) return ad;
          return parseStartMinutes(a.time_slot) - parseStartMinutes(b.time_slot);
        });
      setNextAppointment(upcomingSorted[0] || null);

      // Compute earliest upcoming follow-up to highlight
      const followUps = data
        .filter(a => {
          const rs = (a.request_status || '').toLowerCase();
          const as = (a.appointment_status || '').toLowerCase();
          const d = new Date(a.date); d.setHours(0, 0, 0, 0);
          return a.follow_up_of_booking_id && d >= today && ['pending', 'confirmed'].includes(rs) && !['cancelled', 'completed'].includes(as);
        })
        .sort((a, b) => {
          const ad = new Date(a.date) - new Date(b.date);
          if (ad !== 0) return ad;
          return parseStartMinutes(a.time_slot) - parseStartMinutes(b.time_slot);
        });
      setNextFollowUp(followUps[0] || null);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };

  const isThisWeek = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  };

  const needsAction = (apt) => {
    const rs = (apt.request_status || '').toLowerCase();
    const as = (apt.appointment_status || '').toLowerCase();
    // An appointment needs action if it's pending and not cancelled/completed
    return rs === 'pending' && !['cancelled', 'completed'].includes(as);
  };

  const isOverdue = (apt) => {
    const fmt = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(d));
    const todayStr = fmt(new Date());
    const aptStr = fmt(apt.date);
    const as = String(apt.appointment_status || '').toLowerCase();
    return aptStr < todayStr && !['completed', 'cancelled'].includes(as);
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      // An appointment is upcoming if request is approved and appointment is not completed/cancelled
      const rs = (appointment.request_status || '').toLowerCase();
      const as = (appointment.appointment_status || '').toLowerCase();
      return ['pending', 'confirmed'].includes(rs) && !['cancelled', 'completed'].includes(as);
    }
    if (filter === 'past') {
      // An appointment is past if request was declined or appointment was cancelled/completed
      const rs = (appointment.request_status || '').toLowerCase();
      const as = (appointment.appointment_status || '').toLowerCase();
      return rs === 'declined' || ['cancelled', 'completed'].includes(as);
    }
    return true;
  }).filter(appointment => {
    if (secondaryFilter === 'all') return true;
    if (secondaryFilter === 'today') return isToday(appointment.date);
    if (secondaryFilter === 'thisWeek') return isThisWeek(appointment.date);
    if (secondaryFilter === 'needsAction') return needsAction(appointment);
    return true;
  }).filter(appointment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.service_type?.toLowerCase().includes(searchLower) ||
      new Date(appointment.date).toLocaleDateString().includes(searchLower) ||
      appointment.time_slot?.toLowerCase().includes(searchLower) ||
      appointment.request_status?.toLowerCase().includes(searchLower) ||
      appointment.appointment_status?.toLowerCase().includes(searchLower)
    );
  });

  // Ensure upcoming appointment is always on top (then others)
  const parseStartMinutes = (timeSlot) => {
    if (!timeSlot) return 0;
    const part = String(timeSlot).split('-')[0]?.trim() || '';
    const m = part.match(/(\d{1,2})(?::(\d{2}))?(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1] || '0', 10);
    const min = parseInt(m[2] || '0', 10);
    const ampm = (m[3] || 'AM').toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  };

  const isUpcomingApt = (apt) => {
    const rs = (apt.request_status || '').toLowerCase();
    const as = (apt.appointment_status || '').toLowerCase();
    const d = new Date(apt.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today && ['pending', 'confirmed'].includes(rs) && !['cancelled', 'completed'].includes(as);
  };

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const aUpcoming = isUpcomingApt(a);
    const bUpcoming = isUpcomingApt(b);
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    // both upcoming or both not upcoming
    const ad = new Date(a.date) - new Date(b.date);
    if (ad !== 0) {
      // upcoming -> ascending date; others -> descending date
      return aUpcoming ? ad : -ad;
    }
    // same date: compare start time within slot
    const at = parseStartMinutes(a.time_slot);
    const bt = parseStartMinutes(b.time_slot);
    return aUpcoming ? (at - bt) : (bt - at);
  });

  const toggleSelectAll = (checked) => {
    if (checked) setSelectedIds(sortedAppointments.map(a => a.id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkCancel = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Cancel ${selectedIds.length} appointment(s)?`)) return;
    try {
      await Promise.all(selectedIds.map(id => axios.post('/api/users/cancel-appointment', { booking_id: id })));
      setSelectedIds([]);
      fetchAppointments();
      alert('Selected appointments cancelled');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to cancel appointments');
    }
  };

  const buildGoogleCalendarUrl = (apt) => {
    // Attempt to parse time slot like "1:30-2:00PM"
    const parseTime = (time) => {
      const match = time.match(/(\d{1,2})(?::(\d{2}))?(?:\s*)?(AM|PM)/i);
      if (!match) return { h: 9, m: 0 };
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2] || '0', 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return { h, m };
    };
    const parts = (apt.time_slot || '').split('-');
    const start = parts[0]?.trim() || '9:00AM';
    const end = parts[1]?.trim() || '9:30AM';
    const s = parseTime(start);
    const e = parseTime(end);
    const startDt = new Date(apt.date);
    startDt.setHours(s.h, s.m, 0, 0);
    const endDt = new Date(apt.date);
    endDt.setHours(e.h, e.m, 0, 0);
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    };
    const text = encodeURIComponent(`${apt.service_type} Appointment`);
    const dates = `${fmt(startDt)}/${fmt(endDt)}`;
    const details = encodeURIComponent(`Appointment with ${apt.service_type} on ${new Date(apt.date).toDateString()} at ${apt.time_slot}.`);
    const location = encodeURIComponent(clinicAddress);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  };

  const downloadICS = (apt) => {
    const uid = `${apt.id}@appointment-system`;
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const summary = `${apt.service_type} Appointment`;
    const description = `Time: ${apt.time_slot}`;
    const dtStart = new Date(apt.date);
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//App//EN\nBEGIN:VEVENT\nUID:${uid}\nDTSTAMP:${dtstamp}\nDTSTART;VALUE=DATE:${dtStart.toISOString().slice(0, 10).replace(/-/g, '')}\nSUMMARY:${summary}\nDESCRIPTION:${description}\nLOCATION:${clinicAddress}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-${apt.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2 text-blue-600">
            <FaClock className="text-2xl" />
            <span>Loading appointments...</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-600 flex items-center space-x-2">
            <FaTimesCircle />
            <span>{error}</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8">
        {nextFollowUp && (
          <div className="mb-6 p-4 rounded-lg border border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-700 font-semibold">Auto-scheduled follow-up</div>
                <div className="mt-1 text-gray-800">
                  <span className="font-medium">
                    {new Date(nextFollowUp.date).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                  <span className="ml-2">• {nextFollowUp.time_slot}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">Already scheduled — no action needed</div>
              </div>
              <button
                onClick={() => { setSelectedBooking(nextFollowUp); setNewDate(''); setNewTime(''); setShowRescheduleModal(true); }}
                className="text-sm text-purple-700 hover:text-purple-800 underline"
              >
                Reschedule
              </button>
            </div>
          </div>
        )}
        {nextAppointment && (
          <div className="mb-6 p-4 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 font-semibold">Upcoming appointment</div>
                <div className="mt-1 text-gray-800">
                  <span className="font-medium">
                    {new Date(nextAppointment.date).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      timeZone: 'Asia/Manila'
                    })}
                  </span>
                  <span className="ml-2">• {nextAppointment.time_slot}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">Service: {nextAppointment.service_type}</div>
              </div>
              <a href="/appointment" className="text-sm text-green-700 hover:text-green-800 underline">Book another</a>
            </div>
          </div>
        )}
        {/* Search and Filters Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search by service, date, status..."
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
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Appointments</h1>
            <p className="text-gray-600">Manage and track your appointments</p>
          </div>
          <div className="mt-4 sm:mt-0 space-y-3">
            <div className="inline-flex rounded-md shadow-sm mr-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border
                  ${filter === 'all'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 text-sm font-medium border-t border-b
                  ${filter === 'upcoming'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border
                  ${filter === 'past'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                Past
              </button>
            </div>
            <div className="inline-flex rounded-md shadow-sm">
              <button onClick={() => setSecondaryFilter('all')} className={`px-3 py-1 text-xs border rounded-l-md ${secondaryFilter === 'all' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>All</button>
              <button onClick={() => setSecondaryFilter('today')} className={`px-3 py-1 text-xs border-t border-b ${secondaryFilter === 'today' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Today</button>
              <button onClick={() => setSecondaryFilter('thisWeek')} className={`px-3 py-1 text-xs border-t border-b ${secondaryFilter === 'thisWeek' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>This Week</button>
              <button onClick={() => setSecondaryFilter('needsAction')} className={`px-3 py-1 text-xs border rounded-r-md ${secondaryFilter === 'needsAction' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>Needs Action</button>
              {selectedIds.length > 0 && (
                <button onClick={bulkCancel} className="ml-3 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Cancel Selected ({selectedIds.length})</button>
              )}
            </div>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaCalendarAlt className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Found</h3>
            <p className="text-gray-600 mb-6">You don't have any appointments scheduled at the moment.</p>
            <a
              href="/appointment"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaCalendarAlt className="mr-2" />
              Book an Appointment
            </a>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaSearch className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Match Your Filters</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? `No appointments found for "${searchTerm}".` : 'No appointments match the selected filters.'}
              Try adjusting your search or filter criteria.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setSecondaryFilter('all');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear All Filters
              </button>
              <a
                href="/appointment"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaCalendarAlt className="mr-2" />
                Book New Appointment
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid sm:hidden grid-cols-1 gap-4">
              {sortedAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{new Date(appointment.date).toLocaleDateString()}</div>
                      <div className="mt-0.5 text-gray-800 flex items-center text-sm">
                        <FaClock className="mr-1.5 text-gray-400" />
                        {appointment.time_slot}
                      </div>
                      <div className="mt-1 text-sm text-gray-800 flex items-center">
                        <FaStethoscope className="mr-1.5 text-blue-500" />
                        {appointment.service_type}
                        {appointment.follow_up_of_booking_id && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 border border-purple-200">Follow-up</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 inline-flex items-center text-[11px] leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.request_status)}`}>
                        {getStatusIcon(appointment.request_status)}
                        {appointment.request_status || 'N/A'}
                      </span>
                      <span className={`px-2 py-0.5 inline-flex items-center text-[11px] leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.appointment_status)}`}>
                        {getStatusIcon(appointment.appointment_status)}
                        {appointment.appointment_status || 'N/A'}
                      </span>
                      {isOverdue(appointment) && (
                        <span className="px-2 py-0.5 inline-flex items-center text-[11px] leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                          <FaTimesCircle className="mr-1.5" /> missed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={buildGoogleCalendarUrl(appointment)} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Add to Google</a>
                    <button onClick={() => downloadICS(appointment)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">.ics</button>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicAddress)}`} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Directions</a>
                    <a href={`tel:${clinicPhone}`} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Call</a>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {isUpcomingApt(appointment) && (
                      <button
                        onClick={() => { setSelectedBooking(appointment); setNewDate(''); setNewTime(''); setShowRescheduleModal(true); }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
                      >
                        Reschedule
                      </button>
                    )}
                    {isUpcomingApt(appointment) && (
                      <button
                        onClick={() => { setSelectedBooking(appointment); setCancelReason('patient_request'); setCancelNote(''); setShowCancelModal(true); }}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                      >
                        Cancel
                      </button>
                    )}
                    {['completed'].includes((appointment.appointment_status || '').toLowerCase()) && (
                      <button
                        onClick={() => { setSelectedBooking(appointment); setFeedbackRating(5); setFeedbackComment(''); setShowFeedbackModal(true); }}
                        className="px-3 py-1 text-xs bg-purple-600 text-white rounded"
                      >
                        Feedback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/tablet table */}
            <div className="hidden sm:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">
                        <input type="checkbox" checked={selectedIds.length === sortedAppointments.length && sortedAppointments.length > 0} onChange={(e) => toggleSelectAll(e.target.checked)} />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2" />
                          Date & Time
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FaStethoscope className="mr-2" />
                          Service
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointment Status
                      </th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="checkbox" checked={selectedIds.includes(appointment.id)} onChange={() => toggleSelectOne(appointment.id)} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(appointment.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <FaClock className="mr-1.5 text-gray-400" />
                              {appointment.time_slot}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              {['requested', 'confirmed', 'ongoing', 'completed'].map((step) => {
                                const rs = (appointment.request_status || '').toLowerCase();
                                const as = (appointment.appointment_status || '').toLowerCase();
                                const active = (step === 'requested') || (step === 'confirmed' && ['confirmed', 'pending'].includes(rs)) || (step === 'ongoing' && as === 'ongoing') || (step === 'completed' && as === 'completed');
                                return (
                                  <span key={step} className={`px-2 py-0.5 rounded-full ${active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>{step}</span>
                                );
                              })}
                              {isOverdue(appointment) && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800">missed</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <FaStethoscope className="mr-2 text-blue-500" />
                            {appointment.service_type}
                            {appointment.follow_up_of_booking_id && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 border border-purple-200">Follow-up</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.request_status)}`}>
                              {getStatusIcon(appointment.request_status)}
                              {appointment.request_status || 'N/A'}
                            </span>
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.appointment_status)}`}>
                              {getStatusIcon(appointment.appointment_status)}
                              {appointment.appointment_status || 'N/A'}
                            </span>
                            {isOverdue(appointment) && (
                              <span className="px-2 py-0.5 inline-flex items-center text-[11px] leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                <FaTimesCircle className="mr-1.5" /> missed
                              </span>
                            )}
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
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex gap-2 justify-end mb-2">
                            <a href={buildGoogleCalendarUrl(appointment)} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">Add to Google</a>
                            <button onClick={() => downloadICS(appointment)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">.ics</button>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicAddress)}`} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">Directions</a>
                            <a href={`tel:${clinicPhone}`} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">Call</a>
                          </div>
                          {isUpcomingApt(appointment) && (
                            <button
                              onClick={() => {
                                setSelectedBooking(appointment);
                                setNewDate('');
                                setNewTime('');
                                setShowRescheduleModal(true);
                              }}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Reschedule
                            </button>
                          )}
                          {isUpcomingApt(appointment) && (
                            <button
                              onClick={() => { setSelectedBooking(appointment); setCancelReason('patient_request'); setCancelNote(''); setShowCancelModal(true); }}
                              className="ml-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          )}
                          {['completed'].includes((appointment.appointment_status || '').toLowerCase()) && (
                            <button
                              onClick={() => { setSelectedBooking(appointment); setFeedbackRating(5); setFeedbackComment(''); setShowFeedbackModal(true); }}
                              className="ml-2 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Feedback
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showRescheduleModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reschedule Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <ColorCodedDatePicker
                  selectedDate={newDate ? new Date(newDate) : null}
                  onChange={(date) => {
                    const formatted = date ? formatDateCA(date) : '';
                    setNewDate(formatted);
                    if (formatted) {
                      axios.get(`/api/users/day-slot-summary?date=${formatted}`)
                        .then(res => setDaySlotSummary(res.data || null))
                        .catch(() => setDaySlotSummary(null));
                    } else {
                      setDaySlotSummary(null);
                    }
                  }}
                  schedules={schedules}
                  minDate={new Date()}
                  remainingSlotsByDate={monthCounts}
                  disableUnavailable={true}
                  onMonthChange={(d) => {
                    fetchMonthCounts(d);
                  }}
                />
                {newDate && (
                  <div className="mt-2 text-xs flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded ${getDateStatus(newDate) === 'available' ? 'bg-green-100 text-green-800' :
                        getDateStatus(newDate) === 'holiday' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {getDateStatus(newDate) === 'available' ? 'Available' : getDateStatus(newDate) === 'holiday' ? 'Holiday/Unavailable' : 'No Schedule'}
                    </span>
                    {daySlotSummary && (
                      <>
                        <span className={`px-2 py-1 rounded ${daySlotSummary.remaining_slots > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                          {daySlotSummary.remaining_slots} slots left
                        </span>
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                          {daySlotSummary.booked_count} booked
                        </span>
                        <span className="px-2 py-1 rounded bg-blue-50 text-blue-800">
                          {daySlotSummary.total_slots} total
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Time Slot</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a time slot</option>
                  {['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8', 'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12', 'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'].map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={async () => {
                  try {
                    await axios.post('/api/users/reschedule-appointment', {
                      booking_id: selectedBooking.id,
                      new_date: newDate,
                      new_time_slot: newTime
                    });
                    setShowRescheduleModal(false);
                    setSelectedBooking(null);
                    fetchAppointments();
                  } catch (err) {
                    alert(err.response?.data?.error || 'Failed to reschedule');
                  }
                }}
                disabled={!newDate || !newTime}
                className={`px-4 py-2 rounded-md text-white font-medium ${(!newDate || !newTime) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="patient_request">Patient request</option>
                  <option value="schedule_conflict">Schedule conflict</option>
                  <option value="not_feeling_well">Not feeling well</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={async () => {
                try {
                  await axios.post('/api/users/cancel-appointment', { booking_id: selectedBooking.id, cancel_reason: cancelReason, cancel_note: cancelNote });
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  fetchAppointments();
                } catch (err) {
                  alert(err.response?.data?.error || 'Failed to cancel');
                }
              }} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Confirm Cancel</button>
              <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Your Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select value={feedbackRating} onChange={(e) => setFeedbackRating(parseInt(e.target.value))} className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={async () => {
                try {
                  await axios.post('/api/users/feedback', { booking_id: selectedBooking.id, rating: feedbackRating, comment: feedbackComment });
                  setShowFeedbackModal(false);
                  setSelectedBooking(null);
                  fetchAppointments();
                } catch (err) {
                  alert(err.response?.data?.error || 'Failed to submit feedback');
                }
              }} className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700">Submit</button>
              <button onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">Close</button>
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
                <div className="text-sm text-gray-600">Appointment Date</div>
                <div className="font-medium">{new Date(selectedAppointmentDetails.date).toLocaleDateString()} at {selectedAppointmentDetails.time_slot}</div>
                <div className="text-sm text-gray-600 mt-1">Service: {selectedAppointmentDetails.service_type}</div>
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
    </UserLayout>
  );
};

export default Myappointment;
