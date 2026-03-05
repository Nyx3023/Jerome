import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { FaCalendarAlt, FaFileAlt, FaArrowRight, FaClock, FaHeart, FaBaby } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';

const Home = () => {
  const location = useLocation();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const [remainingSlots, setRemainingSlots] = useState(null);

  // Helper function to format date correctly with timezone
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila' }).format(new Date(dateString));
  };

  useEffect(() => {
    fetchUpcomingAppointment();
    fetchNextAvailability();
  }, []);

  // Refresh data when navigating back to home page (e.g., after booking)
  useEffect(() => {
    // Refresh when the route changes (user navigates to home page)
    fetchUpcomingAppointment();
    fetchNextAvailability();
  }, [location.pathname]);

  const fetchUpcomingAppointment = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/patient-appointments');
      
      // Filter for confirmed appointments and sort by date
      const confirmedAppointments = response.data
        .filter(apt => apt.request_status === 'confirmed' && apt.appointment_status !== 'completed')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Get the next upcoming appointment
      setUpcomingAppointment(confirmedAppointments[0] || null);
    } catch (error) {
      console.error('Error fetching upcoming appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextAvailability = async () => {
    try {
      const schedulesRes = await axios.get('/api/users/schedules');
      const today = new Date();
      const toDate = (s) => new Date(typeof s === 'string' ? s : String(s));
      const upcomingAvailable = (schedulesRes.data || [])
        .filter(ev => (ev.status === 'available') && toDate(ev.start) >= new Date(today.toDateString()))
        .sort((a, b) => toDate(a.start) - toDate(b.start));
      const next = upcomingAvailable[0]?.start || null;
      if (!next) {
        setNextAvailableDate(null);
        setRemainingSlots(null);
        return;
      }
      setNextAvailableDate(next);
      
      // Format date as YYYY-MM-DD for the API
      const nextDate = new Date(next);
      const formattedDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(nextDate);
      
      const summaryRes = await axios.get('/api/users/day-slot-summary', { params: { date: formattedDate } });
      const count = Number(summaryRes?.data?.remaining_slots ?? 0);
      setRemainingSlots(count);
    } catch (error) {
      console.error('Failed to compute next availability:', error);
      setNextAvailableDate(null);
      setRemainingSlots(null);
    }
  };

  return (
    <UserLayout>
      {/* Hero Section */}
      <div className="relative -mt-20 pb-24 sm:pb-32 flex content-center items-center justify-center min-h-[400px] sm:min-h-[600px]">
        <div className="absolute top-0 w-full h-full bg-center bg-cover" 
             style={{
               backgroundImage: 'url("https://images.unsplash.com/photo-1584515933487-779824d29309?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
             }}>
          <span className="w-full h-full absolute opacity-60 bg-gradient-to-r from-green-800 to-green-600"></span>
        </div>
        <div className="container relative mx-auto px-4">
          <div className="items-center flex flex-wrap">
            <div className="w-full lg:w-7/12 ml-auto mr-auto text-center px-4">
              <h1 className="text-white font-bold text-3xl sm:text-5xl md:text-6xl leading-tight mb-4 sm:mb-6">
                Caring for Two Hearts at Once
              </h1>
              <p className="mt-2 sm:mt-4 text-base sm:text-xl text-gray-100 font-light max-w-lg mx-auto">
                Expert midwifery care and comprehensive maternity services in a warm, nurturing environment
              </p>
              <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  to="/appointment"
                  className="w-full sm:w-auto bg-red-500 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-2 no-underline hover:no-underline"
                >
                  Book Now <FaArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/services" className="inline-block">
                  <button className="w-full sm:w-auto bg-gray-700 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all duration-300">
                    Our Services
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Easy Booking Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100">
            <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <FaCalendarAlt className="text-green-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Easy Booking</h2>
            <p className="text-gray-600 mb-6">Schedule your appointments with just a few clicks. Choose your preferred time and doctor.</p>
            <Link to="/appointment" className="inline-flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors">
              Book Appointment <FaArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {/* Medical Records Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100">
            <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <FaFileAlt className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Medical Records</h2>
            <p className="text-gray-600 mb-6">Access your complete medical history and test results anytime, anywhere securely.</p>
            <Link to="/medical-history" className="inline-flex items-center text-red-600 font-semibold hover:text-red-700 transition-colors">
              View Records <FaArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {/* Opening Hours Card */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100">
            <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              <FaClock className="text-gray-600 text-2xl" />
            </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Opening Hours</h2>
          <div className="space-y-2 text-gray-600">
            <p className="flex justify-between">
              <span>Monday - Friday</span>
              <span>8:00 AM - 5:00 PM</span>
            </p>
            <p className="flex justify-between">
              <span>Saturday</span>
              <span>8:00 AM - 12:00 PM</span>
            </p>
            <p className="flex justify-between">
              <span>Sunday</span>
              <span>Closed</span>
            </p>
            <div className="mt-4 border-t pt-4 text-gray-700">
              {nextAvailableDate ? (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next Available</span>
                  <span>{formatDate(nextAvailableDate)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next Available</span>
                  <span>Not scheduled</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-medium">Slots Remaining</span>
                <span>{remainingSlots !== null ? remainingSlots : '-'}</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Upcoming Appointment Section */}
        <div className="mt-16 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upcoming Appointment</h2>
            <Link to="/appointment" className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2">
              View All <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : upcomingAppointment ? (
              <div>
                <p className="text-gray-600 mb-2">Next appointment:</p>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-800">
                    {upcomingAppointment.service_type}
                  </p>
                  <p className="text-gray-600">
                    {formatDate(upcomingAppointment.date)} at {upcomingAppointment.time_slot}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">Next appointment:</p>
                <p className="text-lg font-medium text-gray-800 mb-4">No upcoming appointments</p>
                <Link to="/appointment" className="inline-block">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all duration-300 flex items-center gap-2">
                    Schedule Now <FaArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Home;
