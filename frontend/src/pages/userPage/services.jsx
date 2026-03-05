import React, { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import { FaStethoscope, FaUserMd, FaBaby, FaHeartbeat, FaHospital, FaNotesMedical } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';

const ServiceCard = ({ service }) => {
  const getIcon = (type) => {
    const icons = {
      'Consultation': FaUserMd,
      'Checkup': FaStethoscope,
      'Maternity': FaBaby,
      'Prenatal': FaHeartbeat,
      'Delivery': FaHospital,
      'default': FaNotesMedical
    };
    const Icon = icons[type] || icons.default;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image at the top */}
      <img 
        src={service.image ? `${axios.defaults.baseURL}${service.image}` : '/default-service.jpg'} 
        alt={service.name} 
        className="w-full h-40 sm:h-48 object-cover"
      />
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center 
            ${service.type === 'Maternity' || service.type === 'Prenatal' ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className={service.type === 'Maternity' || service.type === 'Prenatal' ? 'text-green-600' : 'text-red-600'}>
              {getIcon(service.type)}
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{service.name}</h3>
            <span className="text-sm text-gray-500">{service.type}</span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 line-clamp-3 sm:line-clamp-none">{service.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-sm text-gray-500">Starting from</span>
            <div className="text-xl sm:text-2xl font-bold text-green-600">₱{service.price}</div>
          </div>
          <a 
            href="/appointment" 
            className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 whitespace-nowrap"
          >
            Book Now
          </a>
        </div>
      </div>
    </div>
  );
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/api/users/services');
        setServices(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to fetch services. Please try again later.');
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <UserLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-800 to-green-600 text-white py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">Our Services</h1>
          <p className="text-base sm:text-xl text-green-100 max-w-2xl">
            We provide comprehensive maternity and healthcare services with a focus on 
            personalized care for mothers and their babies.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-10 sm:py-16">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Services;
