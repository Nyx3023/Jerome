import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaEye, FaSearch, FaFilePdf, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { generateMedicalRecordHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../../utils/logoUtils';

function StaffPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient] = useState(null);
  const [patientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ first_name: '', middle_name: '', last_name: '', email: '', phone: '', age: '', gender: 'female', address: '' });

  useEffect(() => {
    fetchPatients();
  }, []);

  

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Using admin patients endpoint since staff should have access to view patient data
      const response = await axios.get('/api/admin/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (patient) => {
    try {
      // Navigate to full patient record pages instead of limited modal
      if (patient.patient_type === 'walk_in' || !patient.user_id) {
        const name = patient.name || '';
        const contact = patient.phone || '';
        navigate(`/staff/walkin?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}`);
        return;
      }
      navigate(`/staff/patient/${patient.user_id}`);
    } catch (error) {
      console.error('Error opening patient record:', error);
      alert('Error opening patient record. Please try again.');
    }
  };

  const handleDownloadMedicalRecords = async (patient) => {
    try {
      if (patient.patient_type === 'walk_in' || !patient.user_id) {
        alert('Medical records download is only available for registered patients.');
        return;
      }
      // Get patient's profile first to get patient_id
      const profileResponse = await axios.get(`/api/admin/patient-profile/${patient.user_id}`);
      const patientProfile = profileResponse.data;
      
      // Get medical records using patient_id
      const recordsResponse = await axios.get(`/api/admin/medical-records/patient/${patientProfile.id}`);
      
      if (recordsResponse.data && recordsResponse.data.medical_records && recordsResponse.data.medical_records.length > 0) {
        const { patient_info, medical_records } = recordsResponse.data;
        
        // Generate comprehensive PDF with all records
        const logoUrl = await resolveLogoUrl();
        const html = generateMedicalRecordHTML(patient_info, medical_records, logoUrl);
        const filename = `Medical_Records_${patient.name.replace(/\s+/g, '_')}_Complete_History`;
        
        downloadHTMLAsPDF(html, filename);
      } else {
        alert('No medical records found for this patient.');
      }
    } catch (error) {
      console.error('Error downloading medical records:', error);
      if (error.response?.status === 404) {
        alert('No medical records found for this patient.');
      } else {
        alert('Error downloading medical records. Please try again.');
      }
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Patients Management</h1>
            <p className="text-gray-600 mt-1">
              View and manage patient information and records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={()=>setShowAddModal(true)}>Add Patient</button>
            <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Patient', 'Contact Info', 'Age', 'Last Visit', 'Total Visits', 'Actions'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      <span className="ml-2">Loading patients...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No patients found matching your search' : 'No patients found'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaUser className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patient.patient_type === 'walk_in' || !patient.user_id ? (
                              <a href={`/staff/walkin?name=${encodeURIComponent(patient.name)}&contact=${encodeURIComponent(patient.phone || '')}`} className="text-orange-700 hover:underline">{patient.name}</a>
                            ) : (
                              <a href={`/staff/patient/${patient.user_id}`} className="text-green-700 hover:underline">{patient.name}</a>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">ID: {patient.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.email}</div>
                      <div className="text-sm text-gray-500">{patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.age || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.total_visits || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleViewDetails(patient)}
                          className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 rounded hover:bg-green-50 transition-colors"
                          title="View Patient Profile"
                        >
                          <FaEye className="mr-1" /> Profile
                        </button>
                        <button
                          onClick={() => handleDownloadMedicalRecords(patient)}
                          className="text-blue-600 hover:text-blue-900 flex items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="Download Complete Medical Records"
                        >
                          <FaFilePdf className="mr-1" /> Records
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {showModal && selectedPatient && patientProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full mx-4 max-h-screen overflow-y-auto max-w-md md:max-w-2xl lg:max-w-4xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Patient Profile</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600">Personal Information</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Full Name</label>
                    <p className="text-gray-900">{selectedPatient.name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Age</label>
                    <p className="text-gray-900">{patientProfile.age || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Gender</label>
                    <p className="text-gray-900">{patientProfile.gender || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Blood Type</label>
                    <p className="text-gray-900">{patientProfile.blood_type || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600">Contact Information</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Email</label>
                    <p className="text-gray-900">{selectedPatient.email}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Phone</label>
                    <p className="text-gray-900">{patientProfile.phone || selectedPatient.phone}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Address</label>
                    <p className="text-gray-900">{patientProfile.address || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-500 font-medium">Emergency Contact</label>
                    <p className="text-gray-900">{patientProfile.emergency_contact || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Medical Overview */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 text-green-600">Medical Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="text-sm text-blue-600 font-medium">Total Visits</label>
                    <p className="text-2xl font-semibold text-blue-800">{patientProfile.total_visits || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <label className="text-sm text-green-600 font-medium">Last Visit</label>
                    <p className="text-lg font-semibold text-green-800">
                      {patientProfile.last_visit ? new Date(patientProfile.last_visit).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <label className="text-sm text-yellow-600 font-medium">Patient Status</label>
                    <p className="text-lg font-semibold text-yellow-800">
                      {patientProfile.total_visits > 0 ? 'Active' : 'New Patient'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <label className="text-sm text-purple-600 font-medium">Patient ID</label>
                    <p className="text-lg font-semibold text-purple-800">{patientProfile.id}</p>
                  </div>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 text-green-600">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 font-medium">Medical Conditions</label>
                    <p className="text-gray-900 mt-1">{patientProfile.medical_conditions || 'None reported'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 font-medium">Allergies</label>
                    <p className="text-gray-900 mt-1">{patientProfile.allergies || 'None reported'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 text-green-600">Additional Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900">{patientProfile.notes || 'No additional notes available'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => handleDownloadMedicalRecords(selectedPatient)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaFilePdf className="mr-2" />
                Download Medical Records
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

  {/* Add Patient Modal */}
  {showAddModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add Patient</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="First Name" value={newPatient.first_name} onChange={(e)=>setNewPatient(v=>({...v, first_name: e.target.value}))} />
          <input className="border rounded p-2" placeholder="Middle Name" value={newPatient.middle_name} onChange={(e)=>setNewPatient(v=>({...v, middle_name: e.target.value}))} />
          <input className="border rounded p-2" placeholder="Last Name" value={newPatient.last_name} onChange={(e)=>setNewPatient(v=>({...v, last_name: e.target.value}))} />
          <input className="border rounded p-2" placeholder="Email" value={newPatient.email} onChange={(e)=>setNewPatient(v=>({...v, email: e.target.value}))} />
          <input className="border rounded p-2" placeholder="Phone" value={newPatient.phone} onChange={(e)=>setNewPatient(v=>({...v, phone: e.target.value}))} />
          <input className="border rounded p-2" placeholder="Age" value={newPatient.age} onChange={(e)=>setNewPatient(v=>({...v, age: e.target.value}))} />
          <select className="border rounded p-2" value={newPatient.gender} onChange={(e)=>setNewPatient(v=>({...v, gender: e.target.value}))}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          <input className="border rounded p-2 md:col-span-2" placeholder="Address" value={newPatient.address} onChange={(e)=>setNewPatient(v=>({...v, address: e.target.value}))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 border rounded" onClick={()=>setShowAddModal(false)}>Cancel</button>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={async()=>{
            try{
              await axios.post('/api/admin/patients', newPatient);
              setShowAddModal(false);
              setNewPatient({ first_name: '', middle_name: '', last_name: '', email: '', phone: '', age: '', gender: 'female', address: '' });
              fetchPatients();
            }catch(e){ alert(e.response?.data?.error||'Failed'); }
          }}>Save</button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}

export default StaffPatients;
