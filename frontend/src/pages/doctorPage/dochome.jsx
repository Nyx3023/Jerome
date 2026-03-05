import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaUserAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';

const Dochome = () => {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalAppointments: 0,
    pendingRequests: 0,
    completedAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    fetchDoctorStats();
    fetchRecentActivity();
  }, []);

  const fetchDoctorStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/doctors/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(response.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        return; // handled by global interceptor (redirect to login)
      }
      console.error('Error fetching doctor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setRecentLoading(true);
      const response = await axios.get('/api/doctors/recent-activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setRecentItems(response.data || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }
      setRecentItems([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const statsData = [
    {
      title: "Today's Appointments",
      value: loading ? "..." : stats.todayAppointments.toString(),
      icon: FaCalendarCheck,
      color: "border-l-4 border-blue-500"
    },
    {
      title: "Total Appointments",
      value: loading ? "..." : stats.totalAppointments.toString(),
      icon: FaUserAlt,
      color: "border-l-4 border-green-500"
    },
    {
      title: "Pending Requests",
      value: loading ? "..." : stats.pendingRequests.toString(),
      icon: FaExclamationTriangle,
      color: "border-l-4 border-yellow-500"
    },
    {
      title: "Completed Appointments",
      value: loading ? "..." : stats.completedAppointments.toString(),
      icon: FaClock,
      color: "border-l-4 border-red-500"
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div key={index} className={`bg-white rounded-lg shadow-md p-6 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
              <stat.icon className={`text-4xl ${stat.color.replace('border-l-4', 'text')}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          {recentLoading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : recentItems.length === 0 ? (
            <div className="text-sm text-gray-600">No recent activity</div>
          ) : (
            <div className="space-y-2">
              {recentItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.subtitle}</p>
                  </div>
                  <span className="text-sm text-gray-500">{formatTimeAgo(item.occurred_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Admissions View */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Active Admissions</h2>
        <ActiveAdmissionsWidget />
      </div>
    </div>
  );
};

export default Dochome;

function ActiveAdmissionsWidget(){
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState([]);
  React.useEffect(()=>{
    (async()=>{
      try{
        const axiosMod = await import('../../utils/axiosConfig');
        const res = await axiosMod.default.get('/api/doctors/admissions?status=admitted', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        setRows(res.data||[]);
      }catch(e){ setRows([]); }
      finally{ setLoading(false); }
    })();
  },[]);
  if(loading) return <div className="text-sm text-gray-600">Loading...</div>;
  if(!rows.length) return <div className="text-sm text-gray-600">No active admissions</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 pr-4">Patient</th>
            <th className="py-2 pr-4">Admitted</th>
            <th className="py-2 pr-4">Room</th>
            <th className="py-2 pr-4">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0,6).map(r=>{
            const name = r.registered_patient_name || r.patient_name || 'N/A';
            return (
              <tr key={r.id} className="border-t">
                <td className="py-2 pr-4">{name}</td>
                <td className="py-2 pr-4">{r.admitted_at ? new Date(r.admitted_at).toLocaleString() : '-'}</td>
                <td className="py-2 pr-4">{r.room || '-'}</td>
                <td className="py-2 pr-4">{r.admission_reason || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatTimeAgo(dateString){
  try{
    const now = new Date();
    const then = new Date(dateString);
    const diff = Math.max(0, now - then);
    const s = Math.floor(diff/1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s/60);
    if (m < 60) return `${m} minute${m!==1?'s':''} ago`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h} hour${h!==1?'s':''} ago`;
    const d = Math.floor(h/24);
    return `${d} day${d!==1?'s':''} ago`;
  }catch{ return ''; }
}
