import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaUsers, FaUserMd, FaSignOutAlt, FaList, FaIdCard } from 'react-icons/fa';
import axios from '../utils/axiosConfig';

const DoctorSidebar = () => {
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
    { path: '/doctor/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/doctor/appointments', icon: FaCalendarAlt, label: 'My Appointments' },
    { path: '/doctor/calendar', icon: FaCalendarAlt, label: 'My Calendar' },
    { path: '/doctor/patients', icon: FaUsers, label: 'My Patients' },
    { path: '/doctor/profile', icon: FaUserMd, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-blue-800 text-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Doctor Panel</h1>
        {user?.license_number && (
          <p className="text-sm text-blue-200 mt-1 mb-6">License No: {user.license_number}</p>
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
                  ? 'bg-blue-700 text-white'
                  : 'text-white hover:bg-blue-700/50'
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
          className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700/50 transition-colors"
        >
          <FaSignOutAlt className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default DoctorSidebar;
