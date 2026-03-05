import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCalendarAlt, FaHome, FaList, FaClipboardList, FaBars, FaTimes, FaSignOutAlt, FaNotesMedical } from 'react-icons/fa';
import logo from '../assets/navbar-logo.png';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { path: '/home', label: 'Home', icon: FaHome },
    { path: '/services', label: 'Services', icon: FaList },
    { path: '/appointment', label: 'Book Appointment', icon: FaCalendarAlt },
    { path: '/Myappointment', label: 'My Appointments', icon: FaClipboardList },
    { path: '/medical-history', label: 'Medical History', icon: FaNotesMedical },
    { path: '/profile', label: 'Profile', icon: FaUserCircle },
  ];

  const getHeaderStyle = () => {
    if (!isHomePage) return 'bg-green-600 shadow-lg';
    return isScrolled ? 'bg-green-600 shadow-lg' : 'bg-transparent';
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${getHeaderStyle()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <NavLink
              to="/home"
              className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 no-underline hover:no-underline"
            >
              <img 
                src={logo} 
                alt="Logo" 
                className="h-16 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-white font-bold text-xl leading-tight">SEGODINE</span>
                <span className="text-white text-sm font-medium">Lying-in Clinic</span>
              </div>
            </NavLink>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 md:space-x-4 ml-8">
            {isLoggedIn ? (
              <>
                {navItems.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    to={path}
                    key={path}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105 no-underline hover:no-underline
                      ${isActive 
                        ? 'bg-white text-green-600 shadow-md' 
                        : 'text-white hover:bg-white/10'}`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 flex items-center gap-2"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                  <NavLink
                    to="/login"
                    className="bg-white/10 text-white hover:bg-white/20 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 no-underline hover:no-underline"
                  >
                  Login
                </NavLink>
                
                <NavLink
                  to="/signup"
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-md no-underline hover:no-underline"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-green-600 rounded-lg shadow-lg mb-4">
            {isLoggedIn ? (
              <>
                {navItems.map(({ path, label, icon: Icon }) => (
                  <NavLink
                    to={path}
                    key={path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-3 no-underline hover:no-underline
                      ${isActive 
                        ? 'bg-white text-green-600' 
                        : 'text-white hover:bg-white/10'}`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </NavLink>
                ))}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 mt-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center gap-3"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-white/20">
                <NavLink
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-lg text-base font-semibold transition-all duration-200 text-center no-underline hover:no-underline"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-base font-semibold transition-all duration-200 text-center shadow-md no-underline hover:no-underline"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
