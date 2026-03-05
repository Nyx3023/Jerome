import React, { useEffect, useState } from 'react';
import axios from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import WalkInPatientEnhanced from '../../components/WalkInPatientEnhanced';

const WalkInRecord = ({ name, contact, role }) => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [convertPatientData, setConvertPatientData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: contact || '',
    age: '',
    gender: 'female',
    address: '',
    blood_type: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });

  useEffect(() => {
    const fetchWalkInPatientData = async () => {
      try {
        setLoading(true);

        // Create a mock patient object for the enhanced view
        const mockPatient = {
          id: `walkin_${name}_${contact}`,
          name: name,
          phone: contact,
          patient_type: 'walk_in',
          email: '',
          age: '',
          gender: '',
          address: '',
          blood_type: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          emergency_contact_relationship: '',
          // Add walk-in specific identifier
          is_walk_in: true,
          walk_in_name: name,
          walk_in_contact: contact
        };

        setPatientData(mockPatient);
      } catch (error) {
        console.error('Error setting up walk-in patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (name && contact) {
      fetchWalkInPatientData();
    }
  }, [name, contact]);

  const handleConvertToPatient = async () => {
    try {
      const response = await axios.post('/api/admin/convert-walkin-to-patient', {
        walk_in_name: name,
        walk_in_contact: contact,
        ...convertPatientData
      });

      alert(response.data.message);

      // Redirect to the new patient record page
      const userRole = role || JSON.parse(localStorage.getItem('user')).role;
      navigate(`/${userRole}/patient/${response.data.user_id}`);
    } catch (error) {
      console.error('Error converting walk-in to patient:', error);
      alert(error.response?.data?.error || 'Failed to create patient profile');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (!patientData) {
    return <div className="p-6">Patient data not found.</div>;
  }

  return (
    <div>
      <WalkInPatientEnhanced
        name={name}
        contact={contact}
        role={role}
        handleConvertToPatient={handleConvertToPatient}
        convertPatientData={convertPatientData}
        setConvertPatientData={setConvertPatientData}
      />
    </div>
  );
};

export default WalkInRecord;

