import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './utils/axiosConfig'; // Import axios configuration
import Login from './pages/Login';
import Register from './pages/Register';
import Analytics from './pages/adminPage/Analytics';
import AdminAppointments from './pages/adminPage/AdminAppointments';
import AdminDoctors from './pages/adminPage/AdminDoctors';
import AdminSlots from './pages/adminPage/AdminSlots';
import Booking from './pages/userPage/Booking';
import AdminLayout from './components/AdminLayout';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<Booking />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <PrivateRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<Analytics />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="doctors" element={<AdminDoctors />} />
                <Route path="slots" element={<AdminSlots />} />
              </Routes>
            </AdminLayout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App; 