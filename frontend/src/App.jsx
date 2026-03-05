import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import Login from "./pages/login.jsx";  // Login is now the landing page
import ChangePassword from "./pages/ChangePassword.jsx";
import Signup from "./pages/signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
//User side
import Home from "./pages/userPage/home.jsx";
import Profile from "./pages/userPage/profile.jsx";
import Services from "./pages/userPage/services.jsx";
import Booking from "./pages/userPage/Booking.jsx";
import Myappointment from "./pages/userPage/Myappointment.jsx";
import MedicalHistory from "./pages/userPage/MedicalHistory.jsx";

//Admin side
import AdminLayout from "./components/AdminLayout.jsx";
import Adminappointments from "./pages/adminPage/appointments.jsx";
import Admincalendar from "./pages/adminPage/calendar.jsx";
import Admindoctor from "./pages/adminPage/doctors.jsx";
import Adminpatient from "./pages/adminPage/patients.jsx";
import ServiceAdmin from "./pages/adminPage/ServiceAdmin.jsx";
import AdminServiceOnlinePatients from "./pages/adminPage/ServiceOnlinePatients.jsx";
import AdminStaff from "./pages/adminPage/staff.jsx";
import Analytics from "./pages/adminPage/Analytics.jsx";
import AdminPatientRecord from "./pages/adminPage/PatientRecord.jsx";
import AdminProfile from "./pages/adminPage/AdminProfile.jsx";

//Doctor side
import DoctorLayout from "./components/DoctorLayout.jsx";
import Dochome from "./pages/doctorPage/dochome.jsx";
import Docappointment from "./pages/doctorPage/docappointment.jsx";
import Docpatients from "./pages/doctorPage/docpatients.jsx";
import Docprofile from "./pages/doctorPage/docprofile.jsx";
import Doccalendar from "./pages/doctorPage/doccalendar.jsx";
import DoctorPatientRecord from "./pages/doctorPage/PatientRecord.jsx";

//Staff side
import StaffLayout from "./components/StaffLayout.jsx";
import StaffDashboard from "./pages/staffPage/StaffDashboard.jsx";
import StaffAppointments from "./pages/staffPage/StaffAppointments.jsx";
import StaffPatients from "./pages/staffPage/StaffPatients.jsx";
import StaffCalendar from "./pages/staffPage/StaffCalendar.jsx";
import StaffMedicalRecords from "./pages/staffPage/StaffMedicalRecords.jsx";
import StaffPatientRecord from "./pages/staffPage/PatientRecord.jsx";
import StaffServiceOnlinePatients from "./pages/staffPage/ServiceOnlinePatients.jsx";
import WalkInRecord from "./pages/staffPage/WalkInRecord.jsx";
import StaffProfile from "./pages/staffPage/StaffProfile.jsx";

import VerifyEmail from "./pages/VerifyEmail.jsx";

const getDefaultPathForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'doctor':
      return '/doctor/dashboard';
    case 'staff':
      return '/staff/dashboard';
    case 'user':
      return '/home';
    default:
      return '/login';
  }
};

const RoleRedirect = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  let user = {};
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : {};
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
  return <Navigate to={getDefaultPathForRole(user.role)} />;
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  let user = {};
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : {};
  } catch (e) {
    // Corrupted value, clear and force login
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
  const path = window.location.pathname;

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Check role-based access
  const roleDefault = <Navigate to={getDefaultPathForRole(user.role)} />;

  if (path.startsWith('/admin') && user.role !== 'admin') {
    return roleDefault;
  }
  if (path.startsWith('/doctor') && user.role !== 'doctor') {
    return roleDefault;
  }
  if (path.startsWith('/staff') && user.role !== 'staff') {
    return roleDefault;
  }

  // Restrict user pages strictly to role 'user'
  const userAreaPrefixes = ['/home', '/profile', '/services', '/appointment', '/myappointment', '/medical-history'];
  const isUserArea = userAreaPrefixes.some((prefix) => path.startsWith(prefix));
  if (isUserArea && user.role !== 'user') {
    return roleDefault;
  }

  return children;
};

function App() {
  useEffect(() => {
    const restore = () => {
      try {
        if (document && document.body) {
          document.body.style.pointerEvents = 'auto';
        }
        const nodes = Array.from(document.querySelectorAll('*')).filter(el => {
          const cls = el.className || '';
          return typeof cls === 'string' && cls.includes('fixed') && cls.includes('inset-0');
        });
        nodes.forEach(el => {
          if (el && el.childElementCount === 0) {
            el.remove();
          }
        });
        if (typeof window !== 'undefined' && typeof window.focus === 'function') {
          window.focus();
        }
        const focusFirstEditable = () => {
          try {
            const el = document.querySelector(
              'div.fixed.inset-0 .bg-white input:not([disabled]):not([type="hidden"]),\
               div.fixed.inset-0 .bg-white textarea:not([disabled]),\
               div.fixed.inset-0 .bg-white select:not([disabled])'
            ) || document.querySelector(
              'input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled])'
            );
            if (el && typeof el.focus === 'function') el.focus();
          } catch {}
        };
        setTimeout(focusFirstEditable, 20);
        setTimeout(focusFirstEditable, 120);
        setTimeout(focusFirstEditable, 500);
        setTimeout(focusFirstEditable, 1500);
      } catch {}
    };
    const unblockInputs = () => {
      try {
        const fullOverlays = Array.from(document.querySelectorAll('div.fixed.inset-0, [class*="fixed"]')).filter(el => {
          const rect = el.getBoundingClientRect();
          const z = parseInt(getComputedStyle(el).zIndex || '0', 10) || 0;
          return rect.width >= window.innerWidth - 4 && rect.height >= window.innerHeight - 4 && z >= 20;
        });
        fullOverlays.forEach(el => {
          const hasInteractive = el.querySelector('input, textarea, select, button, a[href]');
          if (!hasInteractive) {
            el.style.pointerEvents = 'none';
          }
        });
      } catch {}
    };
    const onFocus = () => restore();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('pageshow', onFocus);
    window.addEventListener('click', unblockInputs, true);
    window.addEventListener('mousedown', unblockInputs, true);
    window.addEventListener('keydown', unblockInputs, true);
    const mql = window.matchMedia && window.matchMedia('print');
    const mqlHandler = (e) => { if (!e.matches) restore(); };
    if (mql && typeof mql.addEventListener === 'function') mql.addEventListener('change', mqlHandler);
    else if (mql && typeof mql.addListener === 'function') mql.addListener(mqlHandler);
    window.addEventListener('afterprint', () => {
      restore();
      setTimeout(restore, 50);
      setTimeout(restore, 200);
      setTimeout(restore, 1000);
    });
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('pageshow', onFocus);
      window.removeEventListener('click', unblockInputs, true);
      window.removeEventListener('mousedown', unblockInputs, true);
      window.removeEventListener('keydown', unblockInputs, true);
      if (mql && typeof mql.removeEventListener === 'function') mql.removeEventListener('change', mqlHandler);
      else if (mql && typeof mql.removeListener === 'function') mql.removeListener(mqlHandler);
      window.removeEventListener('afterprint', restore);
    };
  }, []);
  return (
    <Router>
      <Routes>
        {/* Set Login Page as the Default Landing Page */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        {/* Removed printable clinic checklist route per request */}

        {/* User Pages - Protected */}
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
        <Route path="/appointment" element={<PrivateRoute><Booking /></PrivateRoute>} />
        <Route path="/myappointment" element={<PrivateRoute><Myappointment /></PrivateRoute>} />
        <Route path="/medical-history" element={<PrivateRoute><MedicalHistory /></PrivateRoute>} />

        {/* Doctor Pages - Protected */}
        <Route path="/doctor/*" element={
          <PrivateRoute>
            <DoctorLayout>
              <Routes>
                <Route path="dashboard" element={<Dochome />} />
                <Route path="appointments" element={<Docappointment />} />
                <Route path="calendar" element={<Doccalendar />} />
                <Route path="patients" element={<Docpatients />} />
                <Route path="patient/:userId" element={<DoctorPatientRecordWrapper />} />
                <Route path="walkin" element={<WalkInRecordWrapper role="doctor" />} />
                <Route path="profile" element={<Docprofile />} />
                {/* services routes removed per requirement */}
              </Routes>
            </DoctorLayout>
          </PrivateRoute>
        } />
        
        {/* Admin Pages - Protected */}
        <Route path="/admin/*" element={
          <PrivateRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<Analytics />} />
                <Route path="appointments" element={<Adminappointments />} />
                <Route path="calendar" element={<Admincalendar />} />
                <Route path="doctors" element={<Admindoctor />} />
                <Route path="patients" element={<Adminpatient />} />
                <Route path="patient/:userId" element={<AdminPatientRecordWrapper />} />
                <Route path="walkin" element={<WalkInRecordWrapper role="admin" />} />
                <Route path="services" element={<ServiceAdmin />} />
                <Route path="services/online-patients" element={<AdminServiceOnlinePatients />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="patient-record/:id" element={<AdminPatientRecord />} />
                <Route path="profile" element={<AdminProfile />} />

              </Routes>
            </AdminLayout>
          </PrivateRoute>
        } />

        {/* Staff Pages - Protected */}
        <Route path="/staff/*" element={
          <PrivateRoute>
            <StaffLayout>
              <Routes>
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="appointments" element={<StaffAppointments />} />
                <Route path="patients" element={<StaffPatients />} />
                <Route path="patient/:userId" element={<StaffPatientRecordWrapper />} />
                <Route path="walkin" element={<WalkInRecordWrapper role="staff" />} />
                <Route path="calendar" element={<StaffCalendar />} />
                <Route path="medical-records" element={<StaffMedicalRecords />} />
                <Route path="services/online-patients" element={<StaffServiceOnlinePatients />} />
                <Route path="patient-record/:id" element={<StaffPatientRecord />} />
                <Route path="profile" element={<StaffProfile />} />
              </Routes>
            </StaffLayout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;

// Wrapper components to extract :userId param
import { useParams, useLocation } from "react-router-dom";
function StaffPatientRecordWrapper(){
  const { userId } = useParams();
  return <StaffPatientRecord userId={userId} />;
}
function AdminPatientRecordWrapper(){
  const { userId } = useParams();
  return <AdminPatientRecord userId={userId} />;
}
function DoctorPatientRecordWrapper(){
  const { userId } = useParams();
  return <DoctorPatientRecord userId={userId} />;
}
function WalkInRecordWrapper(){
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const name = params.get('name') || '';
  const contact = params.get('contact') || '';
  return <WalkInRecord name={name} contact={contact} />;
}
