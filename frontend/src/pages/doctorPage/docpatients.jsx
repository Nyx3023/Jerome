import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaExclamationTriangle, FaUser, FaWalking, FaEye, FaSort, FaSortUp, FaSortDown, FaFilePdf } from 'react-icons/fa';
import { generateMedicalRecordHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../../utils/logoUtils';
import axios from '../../utils/axiosConfig';

const Docpatients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ first_name: '', middle_name: '', last_name: '', email: '', phone: '', age: '', gender: 'female', address: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients for doctor...');
      const response = await axios.get('/api/doctors/patients');
      console.log('Patients fetched:', response.data);
      setPatients(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching patients:', err);
      let errorMessage = 'Failed to load patients';
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

  // Sort patients
  const sortedPatients = [...patients].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    // Handle different data types
    if (sortField === 'total_appointments') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else if (sortField === 'last_visit' || sortField === 'next_appointment') {
      aValue = new Date(aValue || '1900-01-01');
      bValue = new Date(bValue || '1900-01-01');
    } else {
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Filter patients
  const filteredPatients = sortedPatients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="opacity-50" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  

  const handleDownloadPatientMedicalHistory = async (patient) => {
    // For registered patients, use their actual patient ID
    if (patient.patient_type === 'registered' && patient.id) {
      try {
        const response = await axios.get(`/api/doctors/patient-medical-history/${patient.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data && response.data.length > 0) {
          // Create patient info
          const patientData = {
            name: patient.name,
            email: patient.email || 'N/A',
            phone: patient.phone || 'N/A',
            age: patient.age || 'N/A',
            gender: patient.gender || 'N/A',
            address: 'N/A'
          };
          
          // Generate comprehensive PDF with all records
          const logoUrl = await resolveLogoUrl();
          const html = generateMedicalRecordHTML(patientData, response.data, logoUrl);
          downloadHTMLAsPDF(html, `Medical_Records_${patient.name.replace(/\s+/g, '_')}_Complete_History`);
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
    } else {
      alert('Medical history download is only available for registered patients with complete profiles.');
    }
  };

  const handleViewProfile = (patient) => {
    setSelectedPatient(patient);
    setShowProfileModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
        <span className="ml-3 text-gray-600">Loading patients...</span>
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
        <h1 className="text-3xl font-bold">My Patients</h1>
        <p className="text-gray-600 mt-1">
          View and manage all patient records including walk-ins ({patients.length} total)
        </p>
        <div className="mt-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={()=>setShowAddModal(true)}>Add Patient</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search patients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        </div>

      {patients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No patients found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('patient_type')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Type</span>
                      {getSortIcon('patient_type')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Patient Name</span>
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demographics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('total_appointments')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Appointments</span>
                      {getSortIcon('total_appointments')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('last_visit')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Last Visit</span>
                      {getSortIcon('last_visit')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={`${patient.patient_type}-${patient.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {patient.patient_type === 'walk_in' ? (
                          <div className="flex items-center">
                            <FaWalking className="w-5 h-5 text-orange-500 mr-2" />
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              Walk-in
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <FaUser className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              Registered
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.patient_type === 'registered' && patient.user_id ? (
                          <a href={`/doctor/patient/${patient.user_id}`} className="text-green-700 hover:underline">{patient.name}</a>
                        ) : (
                          <a href={`/doctor/walkin?name=${encodeURIComponent(patient.name)}&contact=${encodeURIComponent(patient.phone || '')}`} className="text-orange-700 hover:underline">{patient.name}</a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.phone && <div>📞 {patient.phone}</div>}
                        {patient.email && <div className="text-gray-500">✉️ {patient.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.age && <div>Age: {patient.age}</div>}
                        {patient.gender && <div className="text-gray-500 capitalize">{patient.gender}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {patient.total_appointments || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(patient.last_visit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.next_appointment ? formatDate(patient.next_appointment) : 'None scheduled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewProfile(patient)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FaEye className="w-3 h-3 mr-1" />
                          Quick View
                        </button>
                        <a
                          href={patient.patient_type === 'registered' && patient.user_id ? 
                            `/doctor/patient/${patient.user_id}` : 
                            `/doctor/walkin?name=${encodeURIComponent(patient.name)}&contact=${encodeURIComponent(patient.phone || '')}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-600 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="View Complete Patient Profile"
                        >
                          <FaUser className="w-3 h-3 mr-1" />
                          Enhanced View
                        </a>
                        <button
                          onClick={() => handleDownloadPatientMedicalHistory(patient)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-orange-600 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          title="Download Complete Medical Records"
                        >
                          <FaFilePdf className="w-3 h-3 mr-1" />
                          Records PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <span className="text-sm text-gray-700">
                Showing {filteredPatients.length} of {patients.length} patients
              </span>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredPatients.length}</span> of{' '}
                  <span className="font-medium">{patients.length}</span> patients
                </p>
              </div>
              <div>
                {searchTerm && (
                  <span className="text-sm text-gray-500">
                    Filtered by: "{searchTerm}"
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredPatients.length === 0 && patients.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No patients match your search criteria.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear search
          </button>
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
                  await (await import('../../utils/axiosConfig')).default.post('/api/admin/patients', newPatient);
                  setShowAddModal(false);
                  setNewPatient({ first_name: '', middle_name: '', last_name: '', email: '', phone: '', age: '', gender: 'female', address: '' });
                  fetchPatients();
                }catch(e){ alert(e.response?.data?.error||'Failed'); }
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Patient Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="text-gray-900 font-medium">{selectedPatient.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Type</div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedPatient.patient_type === 'walk_in' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                      {selectedPatient.patient_type === 'walk_in' ? 'Walk-in' : 'Registered'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-gray-900">{selectedPatient.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-gray-900">{selectedPatient.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Age</div>
                  <div className="text-gray-900">{selectedPatient.age || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Gender</div>
                  <div className="text-gray-900 capitalize">{selectedPatient.gender || 'N/A'}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500">Address</div>
                  <div className="text-gray-900">{selectedPatient.address || 'N/A'}</div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowProfileModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Close</button>
                <button onClick={() => handleDownloadPatientMedicalHistory(selectedPatient)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Download Records</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Docpatients;

// Profile Modal
// Rendered conditionally inside component return (below table)
