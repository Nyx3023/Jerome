import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import axios from '../../utils/axiosConfig';


const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [, setBookedSlots] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [existingFollowUp, setExistingFollowUp] = useState(null);
  const [dateSlotCounts, setDateSlotCounts] = useState({});
  const profileCheckRanRef = useRef(false);
  const [myBookedDates, setMyBookedDates] = useState(new Set());
  const [selectedProvider, setSelectedProvider] = useState('midwife'); // 'midwife' or 'ob'

  const timeSlots = useMemo(() => [
    'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4',
    'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8',
    'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12',
    'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'
  ], []);

  const monthDescriptions = {
    January: "Start your pregnancy journey with us! January is an ideal time for early prenatal checkups and pregnancy planning.",
    February: "Show your baby love this month of hearts! Schedule your prenatal vitamins consultation and ultrasound screening.",
    March: "Spring into motherhood! Book your prenatal classes and learn about childbirth preparation.",
    April: "April showers bring May flowers! Time for second-trimester checkups and gender reveal consultations.",
    May: "Celebrate motherhood this May! Special maternal care packages available for expecting mothers.",
    June: "Summer is here! Stay healthy with our prenatal nutrition counseling and hydration guidance.",
    July: "Beat the heat with proper prenatal care! Schedule your regular checkups and monitoring.",
    August: "Back-to-wellness month! Perfect time for prenatal yoga classes and birth plan discussions.",
    September: "New beginnings! Book your third-trimester preparations and baby care workshops.",
    October: "Fall into gentle care! Schedule your prenatal massage and relaxation sessions.",
    November: "Gratitude for new life! Time for final trimester checkups and delivery preparations.",
    December: "End the year with joy! Special holiday care packages for expecting mothers."
  };

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/schedules');
      if (import.meta.env.DEV) console.log('Fetched events:', response.data);
      setEvents(response.data);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching appointments:', error);
    }
  }, []);

  const fetchMyBookedDates = useCallback(async () => {
    try {
      const res = await axios.get('/api/users/patient-appointments');
      const data = Array.isArray(res.data) ? res.data : [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const set = new Set(
        data
          .filter(a => {
            const rs = String(a.request_status || '').toLowerCase();
            const as = String(a.appointment_status || '').toLowerCase();
            const d = new Date(a.date); d.setHours(0, 0, 0, 0);
            return d >= today && ['pending', 'confirmed'].includes(rs) && !['cancelled'].includes(as);
          })
          .map(a => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(a.date)))
      );
      setMyBookedDates(set);
    } catch {
      if (import.meta.env.DEV) console.warn('Failed to load patient appointments for booked dates');
    }
  }, []);

  const fetchExistingFollowUp = useCallback(async () => {
    try {
      const res = await axios.get('/api/users/patient-appointments');
      const data = Array.isArray(res.data) ? res.data : [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
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
          const parseStart = (slot) => {
            if (!slot) return 0;
            const [range] = slot.split(' ');
            const [start] = range.split('-');
            const [hh, mm] = start.split(':').map(x => parseInt(x, 10));
            const isPM = slot.toUpperCase().includes('PM');
            const hour24 = (isPM && hh !== 12) ? hh + 12 : (isPM && hh === 12) ? 12 : (hh === 12 ? 0 : hh);
            return hour24 * 60 + (mm || 0);
          };
          return parseStart(a.time_slot) - parseStart(b.time_slot);
        });
      setExistingFollowUp(followUps[0] || null);
    } catch {
      // Silent fail; banner won't show if request fails
      if (import.meta.env.DEV) console.warn('Failed to load patient appointments for follow-up check');
    }
  }, []);

  const fetchBookedSlots = useCallback(async () => {
    if (!selectedDate) return;

    try {
      setIsLoading(true);
      const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(selectedDate);
      const response = await axios.get(`/api/users/booked-slots?date=${dateStr}`);
      setBookedSlots(response.data);
      const bookedSet = new Set((response.data || []).filter(s => ['booked', 'not_available', 'pending'].includes(String(s.status))).map(s => s.time_slot));
      const remaining = timeSlots.filter(ts => !bookedSet.has(ts)).length;
      setAvailableCount(remaining);
      setIsLoading(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching booked slots:', error);
      setIsLoading(false);
    }
  }, [selectedDate, timeSlots]);

  const fetchMonthSlotCounts = useCallback(async () => {
    try {
      // Get all dates in the current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const counts = {};
      const promises = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);

        promises.push(
          axios.get(`/api/users/day-slot-summary?date=${dateStr}`)
            .then(response => {
              counts[dateStr] = response.data.remaining_slots || 0;
            })
            .catch(() => {
              counts[dateStr] = 0;
            })
        );
      }

      await Promise.all(promises);
      setDateSlotCounts(counts);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching month slot counts:', error);
    }
  }, [currentDate]);

  const fetchServices = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/services');
      setServices(response.data);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching services:', error);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchEvents();
    fetchExistingFollowUp();
    fetchMyBookedDates();
    if (!profileCheckRanRef.current) {
      profileCheckRanRef.current = true;
      (async () => {
        try {
          const res = await axios.get('/api/users/patient-profile');
          const p = res.data || {};
          const requiredOk = !!(p.first_name && p.last_name && p.phone && p.age && p.gender && p.address);
          if (!requiredOk) {
            if (window.confirm('Please complete your profile before booking. Go to profile now?')) {
              navigate('/profile');
            }
          }
        } catch (e) {
          if (e.response?.status === 404 || e.response?.data?.error) {
            if (window.confirm('Please complete your profile before booking. Go to profile now?')) {
              navigate('/profile');
            }
          }
        }
      })();
    }
    const params = new URLSearchParams(location.search);
    const svc = params.get('service');
    const followOf = params.get('follow_up_of_booking_id');
    const due = params.get('follow_up_due_on');
    if (svc) setSelectedService({ name: svc });
    if (due) setSelectedDate(new Date(due));
    if (followOf) window.__followUp = { id: parseInt(followOf, 10), due };
  }, [navigate, location.search, fetchServices, fetchEvents, fetchExistingFollowUp, fetchMyBookedDates]);

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedDate, fetchBookedSlots]);

  useEffect(() => {
    fetchMonthSlotCounts();
  }, [currentDate, fetchMonthSlotCounts]);


  const handleDateClick = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date <= today) {
      alert('Cannot book appointments for today or past dates. Please select a future date.');
      return;
    }

    const event = events.find(event => {
      const eventDate = new Date(event.start);
      const formattedEventDate = formatDate(eventDate);
      const formattedClicked = formatDate(date);
      return formattedEventDate === formattedClicked;
    });

    // Block booking only if explicitly marked as not available or holiday
    if (event && (event.status === 'not available' || event.status === 'notavailable' || event.status === 'holiday')) {
      const statusText = event.status === 'holiday' ? 'holiday' : 'not available';
      alert(`This date is marked as ${statusText}. Please select another date.`);
      return;
    }

    // Allow booking on unmarked dates (default available) or explicitly available/OB available dates
    setSelectedDate(date);
    setSelectedProvider('midwife'); // Reset to default when selecting a new date
    setShowModal(true);
  };

  // Helper function to check if selected date is OB available
  const isSelectedDateOBAvailable = () => {
    if (!selectedDate) return false;
    const event = events.find(event => {
      const eventDate = new Date(event.start);
      return formatDate(eventDate) === formatDate(selectedDate);
    });
    if (!event) return false;
    const status = String(event.status || '').toLowerCase();
    return status === 'ob available' || status === 'ob-available';
  };

  const handleSubmit = async () => {
    if (!selectedService) {
      alert('Please select a service.');
      return;
    }

    if (!selectedDate) {
      alert('Please select a date.');
      return;
    }

    if (window.__followUp && existingFollowUp) {
      alert('A follow-up is already scheduled on ' + new Date(existingFollowUp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + (existingFollowUp.time_slot || '') + '.\nPlease reschedule from My Appointments instead of booking a duplicate.');
      return;
    }

    setIsLoading(true);

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const dateStr = formatDate(selectedDate);
      const bookingData = {
        service_type: selectedService.name,
        date: dateStr,
        user_id: userData.id,
        patient_name: userData.profile?.name || userData.name,
        follow_up_of_booking_id: window.__followUp?.id || undefined,
        follow_up_due_on: window.__followUp?.due || undefined,
        is_ob_booking: isSelectedDateOBAvailable() ? 1 : 0,
        ob_provider_type: isSelectedDateOBAvailable() ? (selectedProvider === 'ob' ? 'doctor' : 'midwife') : null
      };

      const response = await axios.post('/api/users/book-appointment', bookingData);

      if (response.status === 200) {
        alert('Appointment booked successfully!');
        closeModal();
        fetchEvents();
        navigate('/myappointment'); // Redirect to appointments page
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error submitting booking:', error);
      if (error.response?.status === 400 && error.response?.data?.error === "Please complete your profile first") {
        alert("Please complete your profile before booking an appointment. Redirecting to profile page...");
        navigate('/profile');
      } else {
        const errorMessage = error.response?.data?.error || 'An error occurred while booking the appointment.';
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setSelectedService(null);
    setSelectedProvider('midwife'); // Reset to default
  };

  // Calendar rendering functions
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();


  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);
  };

  const renderCalendarDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay();

    // Previous month days
    const prevMonthDays = firstDayOfMonth;
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    let prevMonthStart = prevMonth.getDate() - prevMonthDays + 1;

    for (let i = 0; i < prevMonthDays; i++) {
      days.push(
        <td key={`prev-${i}`} className="text-center text-gray-400 p-1 sm:p-2 text-sm w-[14.28%]">
          {prevMonthStart++}
        </td>
      );
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const formattedCurrentDay = formatDate(currentDay);

      const event = events.find(event => {
        const eventDate = new Date(event.start);
        const formattedEventDate = formatDate(eventDate);
        return formattedEventDate === formattedCurrentDay;
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      currentDay.setHours(0, 0, 0, 0);
      const isPastOrToday = currentDay <= today;
      const isToday = formatDate(new Date()) === formattedCurrentDay;
      const isBookedByMe = myBookedDates.has(formattedCurrentDay);

      const remainingSlots = dateSlotCounts[formattedCurrentDay] || 0;
      const isFull = remainingSlots === 0 && event && event.status !== 'not available' && event.status !== 'notavailable' && event.status !== 'holiday' && !isPastOrToday;

      // Default to available unless explicitly marked otherwise
      const baseStatus = !event
        ? 'available'
        : (event.status === 'holiday' ? 'holiday'
          : (event.status === 'not available' || event.status === 'notavailable') ? 'not-available'
            : event.status === 'ob available' ? 'ob-available'
              : (isFull ? 'full' : 'available'));
      const effectiveStatus = isPastOrToday ? 'no-slots' : baseStatus;
      const isSelectable = !isPastOrToday && effectiveStatus !== 'not-available' && effectiveStatus !== 'holiday' && !isFull;

      const renderStatusIcon = (status) => {
        if (status === 'available') {
          return (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Available">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 14l-4-4 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 7z" />
            </svg>
          );
        }
        if (status === 'holiday') {
          return (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Holiday">
              <path d="M6.76 4.84l-1.8-1.79L3.17 4.84 4.96 6.63 6.76 4.84zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm7.03-3.03l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM20 13h3v-2h-3v2zM17.24 4.84l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM12 6a6 6 0 100 12A6 6 0 0012 6z" />
            </svg>
          );
        }
        if (status === 'not-available') {
          return (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Not Available">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
            </svg>
          );
        }
        if (status === 'ob-available') {
          return (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-label="OB Available">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          );
        }
        if (status === 'full') {
          return (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Fully Booked">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          );
        }
        return (
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-label="No slots">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm5 10a5 5 0 11-10 0 5 5 0 0110 0zm-2.121 2.879L9.121 9.121A3.5 3.5 0 1014.879 14.88z" />
          </svg>
        );
      };

      days.push(
        <td
          key={i}
          className={`relative p-1 sm:p-2 text-center h-16 sm:h-24 border border-gray-200 w-[14.28%]
            ${isSelectable ? 'cursor-pointer hover:bg-green-50' : 'cursor-not-allowed'}
            ${isToday ? 'bg-blue-50' : 'bg-white'}`}
          onClick={() => isSelectable && handleDateClick(currentDay)}
        >
          <span className={`inline-block w-6 h-6 sm:w-8 sm:h-8 leading-6 sm:leading-8 text-sm sm:text-base
            ${isToday ? 'bg-blue-500 text-white rounded-full' : ''}`}>
            {i}
          </span>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-70">
            {renderStatusIcon(effectiveStatus)}
          </div>
          {isBookedByMe && (
            <div className="absolute top-1 left-1 text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
              Booked
            </div>
          )}
          {!isPastOrToday && effectiveStatus !== 'no-slots' && (
            <div className={`text-[10px] sm:text-xs absolute bottom-0 left-0 right-0 mx-1 py-0.5 sm:py-1 ${effectiveStatus === 'holiday' ? 'text-yellow-700' :
              effectiveStatus === 'not-available' ? 'text-red-700 font-semibold' :
                effectiveStatus === 'ob-available' ? 'text-blue-700 font-semibold' :
                  effectiveStatus === 'full' ? 'text-red-700 font-semibold' :
                    'text-green-700'
              }`}>
              {effectiveStatus === 'holiday' ? 'Holiday' : effectiveStatus === 'not-available' ? 'Not Available' : effectiveStatus === 'ob-available' ? 'OB Available' : effectiveStatus === 'full' ? 'FULL' : 'Available'}
            </div>
          )}
          {isPastOrToday && (
            <div className="text-[10px] sm:text-xs absolute bottom-0 left-0 right-0 mx-1 py-0.5 sm:py-1 text-gray-500">
              {isToday ? 'Today' : 'Past'}
            </div>
          )}
        </td>
      );
    }

    // Next month days
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push(
        <td key={`next-${nextMonthDay}`} className="text-center text-gray-400 p-1 sm:p-2 text-sm w-[14.28%]">
          {nextMonthDay++}
        </td>
      );
    }

    // Split days into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(<tr key={i}>{days.slice(i, i + 7)}</tr>);
    }

    return weeks;
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Book an Appointment</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          All dates are available for booking by default.
          Dates marked in red or yellow (Not Available/Holiday) cannot be booked.
        </p>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Calendar Section */}
          <div className="flex-grow bg-white rounded-lg shadow-lg p-3 sm:p-6 overflow-x-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl">Select Date</h2>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  &lt;
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  &gt;
                </button>
              </div>
            </div>

            <div className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>

            <div className="min-w-[300px] overflow-x-auto">
              <table className="w-full table-fixed border-separate border-spacing-1">
                <thead>
                  <tr>
                    {dayNames.map(day => (
                      <th key={day} className="p-1 sm:p-2 text-center font-medium text-[11px] sm:text-sm w-[14.28%]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderCalendarDays()}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 sm:mt-6 flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start text-xs sm:text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></div>
                <span className="text-sm">Available (Default)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-2"></div>
                <span className="text-sm">Not Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 mr-2"></div>
                <span className="text-sm">Holiday</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
                <span className="text-sm">OB Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-2"></div>
                <span className="text-sm">FULL (All slots booked)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
                <span className="text-sm">Booked (Your appointment)</span>
              </div>
              <div className="w-full text-xs sm:text-sm text-gray-600 mt-2">
                Note: All dates are available for booking by default. The clinic will mark specific dates as Not Available or Holiday when the doctor is not on duty.
              </div>
            </div>
          </div>

          {/* Month Info Section */}
          <div className="w-full lg:w-80 bg-green-50 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Month</h2>
            <div className="text-3xl sm:text-6xl font-bold mb-4 sm:mb-6">
              {monthNames[currentDate.getMonth()]}
            </div>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              {monthDescriptions[monthNames[currentDate.getMonth()]]}
            </p>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
              Book your appointment today for personalized maternal care at N.B. Segodine Lying-In Clinic.
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Book Appointment</h2>
              <p className="text-lg mb-6">
                <strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <div className="mb-4 p-3 rounded border border-blue-200 bg-blue-50 text-sm text-blue-800">
                Slots left today: <span className="font-semibold">{availableCount}</span>. If none remain, choose another available date.
              </div>

              {/* OB Available Date Indicator */}
              {isSelectedDateOBAvailable() && (
                <div className="mb-4 p-3 rounded-lg border-2 border-blue-400 bg-gradient-to-r from-blue-100 to-blue-50">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👶</span>
                    <div>
                      <div className="font-semibold text-blue-800">OB Available Date</div>
                      <div className="text-sm text-blue-700">This date is designated for OB (Obstetrics) appointments. Both midwife and OB services are available - please select your preferred provider below.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Selection for OB Available Dates */}
              {isSelectedDateOBAvailable() && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-3">
                    Who would you like to see?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('midwife')}
                      className={`p-4 rounded-lg border-2 transition-all ${selectedProvider === 'midwife'
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-green-300'
                        }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-3xl mb-2">🤱</span>
                        <div className="font-semibold text-gray-800">Midwife</div>
                        <div className="text-xs text-gray-600 mt-1">General maternal care</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('ob')}
                      className={`p-4 rounded-lg border-2 transition-all ${selectedProvider === 'ob'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-300'
                        }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-3xl mb-2">👶</span>
                        <div className="font-semibold text-gray-800">OB Doctor</div>
                        <div className="text-xs text-gray-600 mt-1">Specialized prenatal care</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {window.__followUp && existingFollowUp && (
                <div className="mb-4 p-3 rounded border border-purple-200 bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-purple-700">Follow-up already scheduled</div>
                      <div className="mt-1 text-gray-800 text-sm">
                        {new Date(existingFollowUp.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        <span className="ml-2">• {existingFollowUp.time_slot}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">You can reschedule from My Appointments.</div>
                    </div>
                    <a href="/myappointment" className="text-sm text-purple-700 hover:text-purple-800 underline">View</a>
                  </div>
                </div>
              )}

              {/* Service Selection (dropdown, no search) */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Service:
                </label>
                <select
                  value={selectedService ? selectedService.name : ''}
                  onChange={(e) => {
                    const service = services.find((s) => s.name === e.target.value) || null;
                    setSelectedService(service);
                  }}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id || service.name} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-700">This clinic uses first-come-first-serve. Your booking reserves a spot for the selected date; please check in at the front desk upon arrival.</div>
              </div>

              {selectedService && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Selected Service Details</h4>
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Service:</strong> {selectedService.name}</p>
                    <p><strong>Duration:</strong> {selectedService.duration}</p>
                    <p><strong>Price:</strong> ₱{selectedService.price}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedService || (window.__followUp && !!existingFollowUp)}
                  className={`px-4 py-2 rounded-md text-white font-medium
                    ${(!selectedService || (window.__followUp && !!existingFollowUp))
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                    }
                  `}
                >
                  {(window.__followUp && !!existingFollowUp) ? 'Already Scheduled' : 'Book Appointment'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Booking;
