import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaDollarSign, FaImage, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';

const Docservices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // Debug: Check if token exists
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      // The axios interceptor will automatically add the token
      const response = await axios.get('/api/doctors/services');
      console.log('Services fetched for doctor:', response.data);
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching services:', err);
      console.error('Error details:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Failed to load services';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
        <span className="ml-3 text-gray-600">Loading services...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Available Services</h1>
        <p className="text-gray-600 mt-1">
          View all available services that patients can book
        </p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No services available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Service Image */}
              {service.image ? (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={`${axios.defaults.baseURL}${service.image}`}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="h-full flex items-center justify-center text-gray-400" style={{display: 'none'}}>
                    <FaImage className="text-4xl" />
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <FaImage className="text-4xl text-gray-400" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    service.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {service.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <FaClock className="w-4 h-4 mr-2" />
                    <span className="text-sm">Duration: {service.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaDollarSign className="w-4 h-4 mr-2" />
                    <span className="text-sm">Price: ₱{service.price}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{service.description}</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    ₱{service.price}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => navigate('/doctor/appointments')} className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                      View Appointments
                    </button>
                    <button
                      onClick={() => navigate(`/doctor/services/online-patients?service_type=${encodeURIComponent(service.name)}`)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Online Patients
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Docservices;
