import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaUsers, FaClock, FaSignOutAlt, FaNotesMedical, FaUserTie, FaIdCard, FaUser } from 'react-icons/fa';
import axios from '../utils/axiosConfig';

const StaffSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Fetch fresh data from server to get latest license number
        try {
          const response = await axios.get('/api/auth/me');
          if (response.data) {
            const freshUser = { ...userData, license_number: response.data.license_number };
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, []);

  const navItems = [
    { path: '/staff/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/staff/appointments', icon: FaCalendarAlt, label: 'Appointments' },
    { path: '/staff/patients', icon: FaUsers, label: 'Patients' },
    { path: '/staff/calendar', icon: FaClock, label: 'Calendar' },
    { path: '/staff/medical-records', icon: FaNotesMedical, label: 'Admissions' },
    { path: '/staff/profile', icon: FaUser, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-green-800 text-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center">
          <FaUserTie className="text-2xl mr-3" />
          <h1 className="text-2xl font-bold">Staff Panel</h1>
        </div>
        {user?.license_number && (
          <p className="text-sm text-green-200 mt-1 mb-6">License No: {user.license_number}</p>
        )}
        {!user?.license_number && (
          <div className="mb-6"></div>
        )}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors no-underline ${
                isActive(item.path)
                  ? 'bg-green-700 text-white'
                  : 'text-white hover:bg-green-700/50'
              }`}
            >
              <item.icon className="text-xl" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full p-6">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }}
          className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
        >
          <FaSignOutAlt className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default StaffSidebar;
