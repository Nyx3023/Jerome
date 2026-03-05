import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";

function Doccalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [bookings, setBookings] = useState([]);
  const [dateSlotCounts, setDateSlotCounts] = useState({});
  const [currentEvent, setCurrentEvent] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchMonthSlotCounts();
  }, [currentDate]);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get("/api/doctors/schedules");
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
          axios.get(`/api/doctors/day-slot-summary?date=${dateStr}`)
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

  const handleDateClick = (date) => {
    const formattedDate = formatDate(date);
    setSelectedDate(formattedDate);

    // Find if there's an existing event for this date
    const existingEvent = events.find(evt => formatDate(new Date(evt.start)) === formattedDate);
    setCurrentEvent(existingEvent || null);

    // Pre-select the current status if exists
    if (existingEvent) {
      setStatus(existingEvent.status || "");
    } else {
      setStatus("");
    }

    setShowModal(true);
    axios.get(`/api/doctors/appointments-by-date`, { params: { date: formattedDate } })
      .then((res) => setBookings(res.data || []))
      .catch(() => setBookings([]));
  };

  const handleSave = async () => {
    if (!status) return alert("Please select a status.");

    try {
      await axios.post("/api/doctors/add-not-available-slot", {
        date: selectedDate,
        status
      });
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
        await axios.delete(`/api/doctors/delete-slot/${event.id}`);
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
    setBookings([]);
    setCurrentEvent(null);
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

    const isFull = remainingSlots === 0 && event.status !== 'notavailable' && event.status !== 'not available' && event.status !== 'ob available';
    if (isFull) return 'full';

    return 'available';
  };

  const renderStatusIcon = (status) => {
    if (status === 'available') {
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Available">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 14l-4-4 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 7z" />
        </svg>
      );
    }
    if (status === 'holiday') {
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Holiday">
          <path d="M6.76 4.84l-1.8-1.79L3.17 4.84 4.96 6.63 6.76 4.84zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm7.03-3.03l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM20 13h3v-2h-3v2zM17.24 4.84l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM12 6a6 6 0 100 12A6 6 0 0012 6z" />
        </svg>
      );
    }
    if (status === 'not-available') {
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Not Available">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
        </svg>
      );
    }
    if (status === 'ob-available') {
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-label="OB Available">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    }
    if (status === 'full') {
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor" aria-label="Fully Booked">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      );
    }
    return null;
  };

  const renderCalendarDays = () => {
    const days = [];

    // Previous month fill
    const prevMonthDays = firstDayOfMonth;
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    let prevMonthStart = prevMonth.getDate() - prevMonthDays + 1;

    for (let i = 0; i < prevMonthDays; i++) {
      days.push(
        <td key={`prev-${i}`} className="text-center text-gray-400 p-2">
          {prevMonthStart++}
        </td>
      );
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const formattedCurrentDay = formatDate(currentDay);

      const event = events.find(event => {
        const eventDate = new Date(event.start);
        const formattedEventDate = formatDate(eventDate);
        return formattedEventDate === formattedCurrentDay;
      });

      const isToday = formatDate(new Date()) === formattedCurrentDay;
      const dayStatus = getDayStatus(currentDay);

      days.push(
        <td
          key={i}
          className={`relative p-2 text-center h-24 border border-gray-200
            cursor-pointer
            ${isToday ? 'bg-blue-50 hover:bg-blue-100' : 
              dayStatus === 'holiday' ? 'bg-yellow-50 hover:bg-yellow-100' :
              dayStatus === 'not-available' ? 'bg-red-50 hover:bg-red-100' :
              dayStatus === 'ob-available' ? 'bg-blue-100 hover:bg-blue-150' :
              dayStatus === 'full' ? 'bg-orange-50 hover:bg-orange-100' :
              'bg-green-50 hover:bg-green-100'}`}
          onClick={() => handleDateClick(currentDay)}
        >
          <span className={`inline-block w-8 h-8 leading-8 ${isToday ? 'bg-blue-500 text-white rounded-full' : ''}`}>
            {i}
          </span>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-70">
            {renderStatusIcon(dayStatus)}
          </div>
          <div className={`text-xs absolute bottom-1 left-0 right-0 mx-1 py-1 ${dayStatus === 'holiday' ? 'text-yellow-700' :
            dayStatus === 'not-available' ? 'text-red-700' :
              dayStatus === 'ob-available' ? 'text-blue-700' :
                dayStatus === 'full' ? 'text-orange-700 font-semibold' :
                  'text-green-700'
            }`}>
            {dayStatus === 'holiday' ? 'Holiday' : dayStatus === 'not-available' ? 'Not Available' : dayStatus === 'ob-available' ? 'OB Available' : dayStatus === 'full' ? 'FULL' : 'Available'}
          </div>
        </td>
      );
    }

    // Next month fill
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push(
        <td key={`next-${nextMonthDay}`} className="text-center text-gray-400 p-2">
          {nextMonthDay++}
        </td>
      );
    }

    // Split into weeks rows
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(<tr key={i}>{days.slice(i, i + 7)}</tr>);
    }

    return weeks;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Clinic Calendar</h1>
        <p className="text-gray-600 mt-1">
          All dates are Available by default. Mark days as Not Available or Holiday to prevent bookings.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Calendar Section */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl">Date</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                &lt;
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                today
              </button>
              <button
                onClick={handleNextMonth}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="mb-4 text-xl font-semibold text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>

          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                {dayNames.map(day => (
                  <th key={day} className="p-2 text-center font-medium">
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
        <div className="w-80 bg-green-50 p-6 rounded-lg">
          <h2 className="text-3xl font-bold mb-2">Legend</h2>
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></div>
            <span className="text-sm">Available (Default)</span>
          </div>
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-2"></div>
            <span className="text-sm">Not Available</span>
          </div>
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 mr-2"></div>
            <span className="text-sm">Holiday</span>
          </div>
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
            <span className="text-sm">OB Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300 mr-2"></div>
            <span className="text-sm">FULL (All slots booked)</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Set Status for {selectedDate}</h3>
            <div className="space-y-3">
              <button
                className={`w-full py-2 px-4 rounded-md transition-colors ${status === "available"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                onClick={() => setStatus("available")}
              >
                Available
              </button>
              <button
                className={`w-full py-2 px-4 rounded-md transition-colors ${status === "not available"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                onClick={() => setStatus("not available")}
              >
                Not Available
              </button>
              <button
                className={`w-full py-2 px-4 rounded-md transition-colors ${status === "holiday"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                onClick={() => setStatus("holiday")}
              >
                Holiday
              </button>
              <button
                className={`w-full py-2 px-4 rounded-md transition-colors ${status === "ob available"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                onClick={() => setStatus("ob available")}
              >
                OB Available
              </button>

            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Bookings on {selectedDate}</h4>
              {bookings.length === 0 ? (
                <div className="text-sm text-gray-500">No bookings for this date.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="text-sm">
                        <div className="font-medium">{b.patient_name}</div>
                        <div className="text-gray-600">{b.time_slot} • {b.service_type}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${b.request_status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.request_status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 mt-6">
              {currentEvent && (
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  onClick={async () => {
                    if (window.confirm(`Delete "${currentEvent.title}"?`)) {
                      try {
                        await axios.delete(`/api/doctors/delete-slot/${currentEvent.id}`);
                        fetchSchedules();
                        closeModal();
                      } catch (error) {
                        console.error("Error deleting slot:", error);
                        alert('Failed to delete');
                      }
                    }
                  }}
                >
                  Delete
                </button>
              )}
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  onClick={handleSave}
                >
                  Save
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Doccalendar;
