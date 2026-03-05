import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { 
  FaCalendar, 
  FaUsers, 
  FaClock, 
  FaCheck, 
  FaStar, 
  FaArrowUp, 
  FaArrowDown,
  FaEye,
  FaUser,
  FaChartBar
} from 'react-icons/fa';

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [patientData, setPatientData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [dashboardRes, serviceRes, patientRes] = await Promise.all([
        axios.get('/api/admin/analytics/dashboard'),
        axios.get('/api/admin/analytics/services'),
        axios.get('/api/admin/analytics/patients')
      ]);
      
      setDashboardData(dashboardRes.data);
      setServiceData(serviceRes.data);
      setPatientData(patientRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  const formatPercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">Error loading analytics data</div>
      </div>
    );
  }

  const thisMonth = dashboardData.thisMonthAppointments?.[0]?.count || 0;
  const lastMonth = dashboardData.lastMonthAppointments?.[0]?.count || 0;
  const monthlyGrowth = formatPercentage(thisMonth, lastMonth);

  const thisMonthPatients = dashboardData.thisMonthPatients?.[0]?.count || 0;
  const avgRating = dashboardData.averageRating?.[0]?.avg_rating || 0;
  const totalRatings = dashboardData.averageRating?.[0]?.total_ratings || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive insights into your clinic operations</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FaChartBar },
              { id: 'appointments', name: 'Appointments', icon: FaCalendar },
              { id: 'services', name: 'Services', icon: FaUser },
              { id: 'patients', name: 'Patients', icon: FaUsers }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(dashboardData.totalAppointments?.[0]?.count)}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className={`text-sm ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyGrowth >= 0 ? <FaArrowUp className="inline mr-1" /> : <FaArrowDown className="inline mr-1" />}
                      {Math.abs(monthlyGrowth)}% from last month
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FaCalendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Patients */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(dashboardData.totalPatients?.[0]?.count)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    +{thisMonthPatients} this month
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FaUsers className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(dashboardData.todayAppointments?.[0]?.count)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatNumber(dashboardData.pendingApprovals?.[0]?.count)} pending approval
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FaClock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {avgRating ? avgRating.toFixed(1) : 'N/A'}
                    {avgRating && <span className="text-yellow-500 ml-1">★</span>}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    From {formatNumber(totalRatings)} reviews
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <FaStar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaChartBar className="text-blue-600" />
                Request Status Distribution
              </h3>
              <div className="space-y-3">
                {dashboardData.statusDistribution?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.request_status)}`}>
                        {item.request_status}
                      </span>
                    </div>
                    <span className="font-medium">{formatNumber(item.count)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Services */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaStar className="text-green-600" />
                Most Popular Services
              </h3>
              <div className="space-y-3">
                {dashboardData.popularServices?.slice(0, 5).map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{service.service_type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{
                            width: `${(service.count / dashboardData.popularServices[0].count) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="font-medium text-sm">{service.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaClock className="text-purple-600" />
              Recent Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Patient</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Service</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentActivity?.map((activity, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-4">{activity.patient_name}</td>
                      <td className="py-2 px-4">{activity.service_type}</td>
                      <td className="py-2 px-4">
                        {new Date(activity.date).toLocaleDateString()} {activity.time_slot}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(activity.request_status)}`}>
                          {activity.request_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Appointment Trends Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaCalendar className="text-blue-600" />
              Appointment Trends (Last 30 Days)
            </h3>
            <div className="space-y-3">
              {dashboardData.appointmentTrends?.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{new Date(trend.appointment_date).toLocaleDateString()}</span>
                  <span className="text-blue-600 font-semibold">{trend.count} appointments</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaClock className="text-orange-600" />
              Peak Booking Hours
            </h3>
            <div className="space-y-3">
              {dashboardData.peakHours?.slice(0, 8).map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{hour.time_slot}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-orange-600 h-3 rounded-full" 
                        style={{
                          width: `${(hour.count / dashboardData.peakHours[0].count) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="font-medium text-sm w-8">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaChartBar className="text-green-600" />
              Monthly Trends (Last 6 Months)
            </h3>
            <div className="space-y-3">
              {dashboardData.monthlyTrends?.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{month.month}</span>
                    <div className="text-sm text-gray-600">
                      {month.unique_patients} unique patients
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">{month.appointments}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-purple-600" />
              Service Performance Analytics
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Service Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Total Bookings</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Completed</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Cancelled</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceData?.map((service, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{service.service_name}</td>
                      <td className="py-3 px-4">{service.total_bookings || 0}</td>
                      <td className="py-3 px-4 text-green-600">{service.completed_bookings || 0}</td>
                      <td className="py-3 px-4 text-red-600">{service.cancelled_bookings || 0}</td>
                      <td className="py-3 px-4">
                        {service.avg_rating ? (
                          <span className="flex items-center gap-1">
                            <FaStar className="text-yellow-500" />
                            {service.avg_rating.toFixed(1)}
                            <span className="text-gray-500">({service.total_ratings})</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">No ratings</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          {/* Patient Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Registered</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(patientData.total_registered_patients)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FaUsers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(patientData.active_patients)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FaCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Age</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {patientData.avg_age ? Math.round(patientData.avg_age) : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FaUser className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUsers className="text-pink-600" />
                Gender Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Female</span>
                  <span className="text-pink-600 font-semibold">{formatNumber(patientData.female_count || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Male</span>
                  <span className="text-blue-600 font-semibold">{formatNumber(patientData.male_count || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Other</span>
                  <span className="text-gray-600 font-semibold">{formatNumber(patientData.other_count || 0)}</span>
                </div>
              </div>
            </div>

            {/* Patient Types */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUser className="text-orange-600" />
                Patient Types
              </h3>
              <div className="space-y-3">
                {dashboardData.patientTypes?.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{type.patient_type}</span>
                    <span className="font-semibold text-orange-600">{formatNumber(type.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cancellation Analysis */}
          {dashboardData.cancellationStats && dashboardData.cancellationStats.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaChartBar className="text-red-600" />
                Cancellation Analysis
              </h3>
              <div className="space-y-3">
                {dashboardData.cancellationStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <span className="font-medium">Cancelled by {stat.cancelled_by || 'Unknown'}</span>
                    <span className="text-red-600 font-semibold">{stat.count} appointments</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
