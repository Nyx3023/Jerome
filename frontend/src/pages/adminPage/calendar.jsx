import React, { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";

function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState([]);

  const monthDescriptions = {
    January: "Start your year by managing clinic schedules effectively.",
    February: "Plan ahead for the month of hearts and special care services.",
    March: "Organize spring schedules and medical services.",
    April: "Prepare for increased patient visits this spring season.",
    May: "Manage maternal care schedules for Mother's Day month.",
    June: "Summer health care planning and schedule management.",
    July: "Mid-year schedule review and planning.",
    August: "Back-to-school season schedule management.",
    September: "Fall season medical service scheduling.",
    October: "Autumn care and scheduling management.",
    November: "Preparing schedules for the holiday season rush.",
    December: "Year-end schedule management and planning."
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get("/api/admin/schedules");
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
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

  // Helper function to format date to YYYY-MM-DD in Asia/Manila timezone
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);
  };

  const handleDateClick = (date) => {
    const formattedDate = formatDate(date);
    setSelectedDate(formattedDate);
    setShowModal(true);
    setStatus("");
    axios.get(`/api/admin/appointments-by-date`, { params: { date: formattedDate } })
      .then((res) => setBookings(res.data || []))
      .catch(() => setBookings([]));
  };

  const handleSave = async () => {
    if (!status) return alert("Please select a status.");

    try {
      await axios.post("/api/admin/add-not-available-slot", {
        date: selectedDate,
        status
      });
      fetchSchedules();
      closeModal();
    } catch (error) {
      console.error("Error adding slot:", error);
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
        await axios.delete(`/api/admin/delete-slot/${event.id}`);
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
    setBookings([]);
  };

  const getDayStatus = (date) => {
    const formatted = formatDate(date);
    const event = events.find(evt => formatDate(new Date(evt.start)) === formatted);
    if (!event) return 'available'; // Default to available
    if (event.status === 'holiday') return 'holiday';
    if (event.status === 'notavailable' || event.status === 'not available') return 'not-available';
    if (event.status === 'ob available') return 'ob-available';
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
    return null;
  };

  const renderCalendarDays = () => {
    const days = [];

    // Get previous month's days
    const prevMonthDays = firstDayOfMonth;
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    let prevMonthStart = prevMonth.getDate() - prevMonthDays + 1;

    // Previous month days
    for (let i = 0; i < prevMonthDays; i++) {
      days.push(
        <td key={`prev-${i}`} className="text-center text-gray-400 p-2">
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
              'bg-green-50 hover:bg-green-100'}`}
          onClick={() => event ? handleEventClick(currentDay) : handleDateClick(currentDay)}
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
                'text-green-700'
            }`}>
            {dayStatus === 'holiday' ? 'Holiday' : dayStatus === 'not-available' ? 'Not Available' : dayStatus === 'ob-available' ? 'OB Available' : 'Available'}
          </div>
        </td>
      );
    }

    // Next month days
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push(
        <td key={`next-${nextMonthDay}`} className="text-center text-gray-400 p-2">
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schedule Management</h1>
        <p className="text-gray-600 mt-1">
          All dates are <span className="font-medium text-green-700">Available</span> by default.
          Click a date to mark it as <span className="font-medium text-red-700">Not Available</span> or <span className="font-medium text-yellow-700">Holiday</span> to prevent bookings.
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

        {/* Month Info Section */}
        <div className="w-80 bg-green-50 p-6 rounded-lg">
          <h2 className="text-3xl font-bold mb-2">Month</h2>
          <div className="text-6xl font-bold mb-6">
            {monthNames[currentDate.getMonth()]}
          </div>
          <p className="text-gray-700 leading-relaxed">
            {monthDescriptions[monthNames[currentDate.getMonth()]]}
          </p>
          <div className="mt-4 text-sm text-gray-600">
            Manage your clinic's schedule efficiently at N.B. Segodine Lying-In Clinic.
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></div>
          <span className="text-sm">Available (Default - Doctor on duty)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-2"></div>
          <span className="text-sm">Not Available (Doctor not on duty)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 mr-2"></div>
          <span className="text-sm">Holiday (No appointments)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
          <span className="text-sm">OB Available</span>
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
            <div className="flex justify-end gap-3 mt-6">
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
      )}
    </div>
  );
}

export default AdminCalendar;
