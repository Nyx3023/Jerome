import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { FaUser, FaWalking } from 'react-icons/fa';

function StaffCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotDetails, setSlotDetails] = useState(null);
  const [showSlotPanel, setShowSlotPanel] = useState(false);
  const [dateSlotCounts, setDateSlotCounts] = useState({});

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchMonthSlotCounts();
  }, [currentDate]);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get("/api/staff/schedules");
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchMonthSlotCounts = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const counts = {};
      const promises = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);

        promises.push(
          axios.get(`/api/staff/day-slot-summary?date=${dateStr}`)
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
      console.error('Error fetching month slot counts:', error);
    }
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

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

  const fetchSlotDetails = async (date) => {
    const formattedDate = formatDate(date);
    try {
      // Fetch bookings for this date
      const bookingsRes = await axios.get(`/api/staff/appointments-by-date?date=${formattedDate}`);
      // Fetch blocked slots for this date
      const blockedRes = await axios.get(`/api/staff/blocked-slots?date=${formattedDate}`);

      const bookings = bookingsRes.data || [];
      const blocked = blockedRes.data || [];

      setSlotDetails({
        date: formattedDate,
        bookings,
        blocked
      });
      setShowSlotPanel(true);
    } catch (error) {
      console.error('Error fetching slot details:', error);
    }
  };

  const handleDateClick = (date) => {
    const formattedDate = formatDate(date);
    setSelectedDate(formattedDate);
    fetchSlotDetails(date);
    setShowModal(true);
    setStatus("");
  };

  const handleSave = async () => {
    if (!status) return alert("Please select a status.");

    try {
      // Handle block/unblock slot operations separately
      if (status === 'block_slot') {
        if (!slotTime) return alert('Please select a time slot to block.');
        await axios.post('/api/staff/block-time-slot', { date: selectedDate, time_slot: slotTime });
      } else if (status === 'unblock_slot') {
        if (!slotTime) return alert('Please select a time slot to unblock.');
        await axios.post('/api/staff/unblock-time-slot', { date: selectedDate, time_slot: slotTime });
      } else {
        // For all other statuses (not available, holiday, available)
        await axios.post("/api/staff/add-not-available-slot", {
          date: selectedDate,
          status
        });
      }
      fetchSchedules();
      closeModal();
    } catch (error) {
      console.error("Error saving:", error);
      alert(error.response?.data?.error || 'Failed to save');
    }
  };

  const handleEventClick = async (date) => {
    const formattedClickDate = formatDate(date);
    const event = events.find(event => {
      const eventDate = new Date(event.start);
      const formattedEventDate = formatDate(eventDate);
      return formattedEventDate === formattedClickDate;
    });

    if (event && window.confirm(`Delete "${event.title}"?`)) {
      try {
        await axios.delete(`/api/staff/delete-slot/${event.id}`);
        fetchSchedules();
      } catch (error) {
        console.error("Error deleting slot:", error);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setStatus("");
    setSlotTime("");
  };

  const getDayStatus = (date) => {
    const formatted = formatDate(date);
    const event = events.find(evt => formatDate(new Date(evt.start)) === formatted);

    if (!event) {
      // Default to available
      return 'available';
    }

    const remainingSlots = dateSlotCounts[formatted] || 0;
    if (event.status === 'holiday') return 'holiday';
    if (event.status === 'notavailable' || event.status === 'not available') return 'not-available';
    if (event.status === 'ob available') return 'ob-available';

    const isFull = remainingSlots === 0 && event.status !== 'notavailable' && event.status !== 'ob available';
    if (isFull) return 'full';

    return 'available';
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <span className="text-green-600">✓</span>;
      case 'not-available':
        return <span className="text-red-600">✗</span>;
      case 'holiday':
        return <span className="text-yellow-600">🌙</span>;
      case 'ob-available':
        return <span className="text-blue-600">👨‍⚕️</span>;
      case 'full':
        return <span className="text-orange-600 font-bold">!</span>;
      default:
        return <span className="text-gray-400">○</span>;
    }
  };

  const timeSlots = [
    'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4',
    'Slot 5', 'Slot 6', 'Slot 7', 'Slot 8',
    'Slot 9', 'Slot 10', 'Slot 11', 'Slot 12',
    'Slot 13', 'Slot 14', 'Slot 15', 'Slot 16'
  ];

  const getSlotStatus = (slotName) => {
    if (!slotDetails) return 'available';

    const isBooked = slotDetails.bookings.some(b => b.time_slot === slotName);
    const isBlocked = slotDetails.blocked.some(b => b.time_slot === slotName);

    if (isBooked) return 'booked';
    if (isBlocked) return 'blocked';
    return 'available';
  };

  const getSlotBooking = (slotName) => {
    if (!slotDetails) return null;
    const bookingsForSlot = slotDetails.bookings.filter(b => b.time_slot === slotName);

    // If multiple bookings exist for the same slot, prioritize:
    // 1. Online patients (user_id > 0) over walk-ins
    // 2. Pending/ongoing bookings over completed ones
    // 3. Most recent (higher ID)
    if (bookingsForSlot.length === 0) return null;
    if (bookingsForSlot.length === 1) return bookingsForSlot[0];

    // Sort by: online first, then by ID descending (most recent)
    return bookingsForSlot.sort((a, b) => {
      // Prioritize online patients
      const aIsOnline = a.user_id && a.user_id !== 0;
      const bIsOnline = b.user_id && b.user_id !== 0;
      if (aIsOnline && !bIsOnline) return -1;
      if (!aIsOnline && bIsOnline) return 1;
      // Then by most recent ID
      return b.id - a.id;
    })[0];
  };

  const countAvailableSlots = () => {
    if (!slotDetails) return 16;
    return timeSlots.filter(slot => getSlotStatus(slot) === 'available').length;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Staff Calendar</h1>
        <p className="text-gray-600">Manage your availability and schedule</p>
      </div>

      <div className="flex gap-6">
        {/* Calendar Section */}
        <div className={`${showSlotPanel ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          {/* Calendar Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevMonth}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayStatus = getDayStatus(date);
                const isToday = formatDate(date) === formatDate(new Date());

                return (
                  <div
                    key={day}
                    className={`p-2 text-center cursor-pointer rounded-md transition-colors ${isToday
                      ? 'bg-blue-100 text-blue-800 font-semibold'
                      : dayStatus === 'available'
                        ? 'bg-green-50 hover:bg-green-100 text-green-800'
                        : dayStatus === 'not-available'
                          ? 'bg-red-50 hover:bg-red-100 text-red-800'
                          : dayStatus === 'holiday'
                            ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800'
                            : dayStatus === 'ob-available'
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-800'
                              : dayStatus === 'full'
                                ? 'bg-orange-50 hover:bg-orange-100 text-orange-800'
                                : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="flex items-center justify-center">
                      <span className="mr-1">{day}</span>
                      {renderStatusIcon(dayStatus)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <span className="text-red-600 mr-2">✗</span>
                <span>Not Available</span>
              </div>
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">🌙</span>
                <span>Holiday</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">👨‍⚕️</span>
                <span>OB Available</span>
              </div>
              <div className="flex items-center">
                <span className="text-orange-600 font-bold mr-2">!</span>
                <span>FULL (All slots booked)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slot Details Panel */}
        {showSlotPanel && slotDetails && (
          <div className="w-1/3">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Slot Availability
                </h3>
                <button
                  onClick={() => setShowSlotPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Selected Date</div>
                <div className="text-lg font-semibold text-gray-800">
                  {new Date(slotDetails.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available Slots:</span>
                  <span className="font-semibold text-green-600">{countAvailableSlots()} / 16</span>
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {timeSlots.map((slot) => {
                  const slotStatus = getSlotStatus(slot);
                  const booking = getSlotBooking(slot);
                  const isOnline = booking && booking.user_id && booking.user_id !== 0;
                  const isWalkIn = booking && (!booking.user_id || booking.user_id === 0);

                  return (
                    <div
                      key={slot}
                      className={`p-3 rounded-lg border-2 transition-all ${slotStatus === 'available'
                        ? 'bg-green-50 border-green-200'
                        : slotStatus === 'booked'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{slot}</span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${slotStatus === 'available'
                            ? 'bg-green-100 text-green-800'
                            : slotStatus === 'booked'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                          {slotStatus === 'available' ? 'Available' : slotStatus === 'booked' ? 'Booked' : 'Blocked'}
                        </span>
                      </div>
                      {booking && (
                        <div className="mt-2 space-y-1">
                          {/* Patient Info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {isOnline ? (
                              <FaUser className="text-blue-500 text-xs" title="Online Patient" />
                            ) : (
                              <FaWalking className="text-orange-500 text-xs" title="Walk-in Patient" />
                            )}
                            <span className="text-xs font-medium text-gray-800">{booking.patient_name}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${isOnline ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                              {isOnline ? 'Online' : 'Walk-in'}
                            </span>
                            {booking.follow_up_of_booking_id && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                                🔄 Follow-up
                              </span>
                            )}
                          </div>

                          {/* Service */}
                          <div className="text-xs text-gray-600">
                            {booking.service_type}
                          </div>

                          {/* Statuses */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {/* Request Status */}
                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${booking.request_status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.request_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : booking.request_status === 'declined'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                              {booking.request_status || 'N/A'}
                            </span>

                            {/* Appointment Status */}
                            {booking.appointment_status && booking.appointment_status !== 'null' && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${booking.appointment_status === 'ongoing'
                                ? 'bg-orange-100 text-orange-700'
                                : booking.appointment_status === 'completed'
                                  ? 'bg-blue-100 text-blue-700'
                                  : booking.appointment_status === 'cancelled'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                {booking.appointment_status}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Schedule for {selectedDate}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="available">Available</option>
                  <option value="not available">Not Available</option>
                  <option value="holiday">Holiday</option>
                  <option value="ob available">OB Available</option>
                  <option value="block_slot">Block Time Slot</option>
                  <option value="unblock_slot">Unblock Time Slot</option>
                </select>
              </div>

              {(status === 'block_slot' || status === 'unblock_slot') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot
                  </label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select time slot</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffCalendar;