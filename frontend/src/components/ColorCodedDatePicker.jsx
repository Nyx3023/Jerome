import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ColorCodedDatePicker.css';

const ColorCodedDatePicker = ({
  selectedDate,
  onChange,
  schedules = [],
  minDate = new Date(),
  className = "",
  remainingSlotsByDate = {},
  disableUnavailable = true,
  onMonthChange
}) => {
  const formatDateToYYYYMMDD = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to get date status - matches main calendar page logic
  const getDateStatus = (date) => {
    if (!date) return 'available';

    const dateStr = formatDateToYYYYMMDD(date);
    const schedule = schedules.find(s => {
      const scheduleDate = new Date(s.start || s.date);
      return formatDateToYYYYMMDD(scheduleDate) === dateStr;
    });

    // Default to available if no schedule found (like main calendar)
    if (!schedule) return 'available';

    const status = String(schedule.status || schedule.title || '').toLowerCase();

    // Match the main calendar page status detection
    if (status === 'holiday') return 'holiday';
    if (status === 'not available' || status === 'notavailable') return 'not-available';
    if (status === 'ob available' || status === 'ob-available') return 'ob-available';
    if (status === 'available') return 'available';

    return 'available'; // Default to available
  };

  // Custom day className to add colors - matches main calendar
  const getDayClassName = (date) => {
    const status = getDateStatus(date);
    const dateStr = formatDateToYYYYMMDD(date);
    const remaining = typeof remainingSlotsByDate[dateStr] === 'number' ? remainingSlotsByDate[dateStr] : undefined;
    const isFull = (status === 'available' || status === 'ob-available') && typeof remaining === 'number' && remaining <= 0;

    if (isFull) return 'date-full';
    if (status === 'available') return 'date-available';
    if (status === 'ob-available') return 'date-ob-available';
    if (status === 'holiday') return 'date-holiday';
    if (status === 'not-available') return 'date-not-available';
    return 'date-available'; // Default to available styling
  };

  const isSelectable = (date) => {
    const status = getDateStatus(date);
    const dateStr = formatDateToYYYYMMDD(date);
    const remaining = typeof remainingSlotsByDate[dateStr] === 'number' ? remainingSlotsByDate[dateStr] : undefined;

    if (disableUnavailable) {
      if (status === 'holiday' || status === 'not-available') return false;
      if ((status === 'available' || status === 'ob-available') && typeof remaining === 'number' && remaining <= 0) return false;
    }
    return true;
  };

  const renderDayContents = (day, date) => {
    const status = getDateStatus(date);
    const dateStr = formatDateToYYYYMMDD(date);
    const remaining = typeof remainingSlotsByDate[dateStr] === 'number' ? remainingSlotsByDate[dateStr] : undefined;
    const isFull = (status === 'available' || status === 'ob-available') && typeof remaining === 'number' && remaining <= 0;

    return (
      <div className="day-content">
        <span>{day}</span>
        {/* Holiday/Unavailable indicator */}
        {(status === 'holiday' || status === 'not-available') && (
          <span className="day-badge day-badge-holiday">×</span>
        )}
        {/* OB Available indicator */}
        {status === 'ob-available' && !isFull && (
          <span className="day-badge day-badge-ob">OB</span>
        )}
        {/* Slot count for available dates */}
        {typeof remaining === 'number' && (status === 'available' || status === 'ob-available') && (
          isFull ? (
            <span className="day-badge day-badge-full">FULL</span>
          ) : (
            <span className="day-badge">{remaining}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="color-coded-datepicker-wrapper">
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        minDate={minDate}
        dayClassName={getDayClassName}
        filterDate={isSelectable}
        renderDayContents={renderDayContents}
        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${className}`}
        calendarClassName="color-coded-calendar"
        showPopperArrow={false}
        placeholderText="Select date"
        onMonthChange={onMonthChange}
      />

      {/* Legend - matches main calendar page */}
      <div className="mt-2 text-xs text-gray-600 space-y-1">
        <p className="flex items-center">
          <span className="w-3 h-3 bg-green-100 border border-green-500 rounded mr-2"></span>
          Available
        </p>
        <p className="flex items-center">
          <span className="w-3 h-3 bg-red-100 border border-red-500 rounded mr-2"></span>
          Holiday/Unavailable
        </p>
        <p className="flex items-center">
          <span className="w-3 h-3 bg-blue-100 border border-blue-500 rounded mr-2"></span>
          OB Available
        </p>
        <p className="flex items-center">
          <span className="w-3 h-3 bg-white border border-gray-300 rounded mr-2"></span>
          No Schedule
        </p>
        <p className="flex items-center">
          <span className="w-3 h-3 bg-blue-50 border border-blue-400 rounded mr-2"></span>
          Number = slots left; FULL = 0 left
        </p>
      </div>
    </div>
  );
};

export default ColorCodedDatePicker;
