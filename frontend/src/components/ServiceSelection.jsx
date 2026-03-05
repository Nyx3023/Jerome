import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { FaEye, FaImage, FaClock, FaDollarSign, FaSpinner } from 'react-icons/fa';

const ServiceSelection = ({ onServiceSelect }) => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/users/services');
      console.log('Services fetched:', response.data);
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load services. Please try again later.');
      setLoading(false);
    }
  };

  const handleServiceSelect = (e) => {
    const service = services.find(s => s.id === parseInt(e.target.value));
    setSelectedService(service);
    onServiceSelect(service);
  };

  const handleViewDetails = (e, service) => {
    e.preventDefault();
    setSelectedDetails(service);
    setShowDetailsModal(true);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <FaSpinner className="animate-spin text-green-600 text-3xl" />
      <span className="ml-3 text-gray-600">Loading services...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
        />
        <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-grow">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select a Service
          </label>
          <div className="relative">
            <select
              value={selectedService?.id || ''}
              onChange={handleServiceSelect}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white pr-12 transition-all duration-200 hover:border-green-500"
            >
              <option value="">Choose a service</option>
              {filteredServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ₱{service.price} ({service.duration})
                </option>
              ))}
            </select>
            {selectedService && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {selectedService.image && (
                  <img 
                    src={`${axios.defaults.baseURL}${selectedService.image}`}
                    alt={selectedService.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-green-500 transition-transform duration-200 hover:scale-110"
                  />
                )}
                <button
                  onClick={(e) => handleViewDetails(e, selectedService)}
                  className="p-2 text-gray-500 hover:text-green-600 transition-all duration-200 hover:scale-110"
                  title="View details"
                >
                  <FaEye size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Details Modal */}
      {showDetailsModal && selectedDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedDetails.name}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>

            {selectedDetails.image ? (
              <div className="mb-6 relative overflow-hidden rounded-lg group">
                <img
                  src={`${axios.defaults.baseURL}${selectedDetails.image}`}
                  alt={selectedDetails.name}
                  className="w-full h-64 object-cover rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setShowFullImage(true)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">Click to view full image</p>
                </div>
              </div>
            ) : (
              <div className="mb-6 w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center">
                <FaImage className="text-gray-400 text-5xl" />
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{selectedDetails.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900">
                    <FaClock className="text-green-600" />
                    <h3 className="text-lg font-medium">Duration</h3>
                  </div>
                  <p className="text-gray-600 mt-2">{selectedDetails.duration}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-900">
                    <FaDollarSign className="text-green-600" />
                    <h3 className="text-lg font-medium">Price</h3>
                  </div>
                  <p className="text-green-600 font-medium mt-2">₱{selectedDetails.price}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Modal */}
      {showFullImage && selectedDetails?.image && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer animate-fadeIn"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl w-full mx-4">
            <img
              src={`${axios.defaults.baseURL}${selectedDetails.image}`}
              alt={selectedDetails.name}
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-bold transition-colors duration-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection; 