import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { FaEye, FaSearch, FaFilePdf, FaCalendarAlt, FaUserMd, FaNotesMedical, FaUserPlus } from 'react-icons/fa';
import { generateMedicalRecordHTML, generateSingleMedicalRecordHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../../utils/logoUtils';

function Adminpatient() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ first_name: '', middle_name: '', last_name: '', email: '', phone: '', age: '', gender: 'female', address: '' });
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [serviceSummary, setServiceSummary] = useState({ babies: 0, lab_results: 0, prenatal_visits: 0, postpartum_assessments: 0, family_planning: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [accountTarget, setAccountTarget] = useState(null);
  const [accountForm, setAccountForm] = useState({ email: '', password: '', confirm: '' });

  useEffect(() => {
    fetchPatients();
  }, []);

  // Live search across registered and walk-in patients when term >= 2 chars
  useEffect(() => {
    const run = async () => {
      const term = searchTerm.trim();
      if (term.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      try {
        setSearching(true);
        const res = await axios.get(`/api/admin/search-patients?search_term=${encodeURIComponent(term)}`);
        setSearchResults(res.data || []);
      } catch (e) {
        console.error('Error searching patients:', e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    run();
  }, [searchTerm]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/admin/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const openCreateAccount = (patient) => {
    const isPlaceholder = String(patient.email || '').includes('@placeholder.local');
    setAccountForm({ email: isPlaceholder ? '' : (patient.email || ''), password: '', confirm: '' });
    setAccountTarget(patient);
    setShowCreateAccountModal(true);
  };

  const createAccountForPatient = async () => {
    try {
      const email = accountForm.email.trim();
      const pwd = accountForm.password;
      const cf = accountForm.confirm;
      if (!email || !pwd) { alert('Email and password are required'); return; }
      if (pwd !== cf) { alert('Passwords do not match'); return; }
      await axios.post(`/api/admin/patients/${accountTarget.id}/create-account`, { email, password: pwd });
      setShowCreateAccountModal(false);
      setAccountTarget(null);
      setAccountForm({ email: '', password: '', confirm: '' });
      fetchPatients();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create account');
    }
  };

  const handleViewDetails = async (patient) => {
    try {
      if (patient.patient_type && patient.patient_type !== 'registered') {
        alert('Profile view is available for registered patients only.');
        return;
      }
      const response = await axios.get(`/api/admin/patient-profile/${patient.user_id}`);
      setPatientProfile(response.data);
      setSelectedPatient(patient);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    }
  };

  

  const fetchMedicalRecords = async (patient) => {
    try {
      setRecordsLoading(true);
      if (patient.patient_type && patient.patient_type !== 'registered') {
        alert('Viewing medical records is only available for registered patients.');
        setRecordsLoading(false);
        return;
      }
      const profileResponse = await axios.get(`/api/admin/patient-profile/${patient.user_id}`);
      const patientProfile = profileResponse.data;
      const recordsResponse = await axios.get(`/api/admin/medical-records/patient/${patientProfile.id}`);
      if (recordsResponse.data && recordsResponse.data.medical_records) {
        setMedicalRecords(recordsResponse.data.medical_records);
        setSelectedPatient({ ...patient, ...patientProfile });
        setShowRecordsModal(true);
        try {
          setSummaryLoading(true);
          const [babiesRes, labsRes, prenatalRes, postpartumRes, fpRes] = await Promise.all([
            axios.get(`/api/clinic/babies/mother/${patientProfile.id}`),
            axios.get(`/api/clinic/lab-results/${patientProfile.id}`),
            axios.get(`/api/clinic/prenatal-schedule/${patientProfile.id}`),
            axios.get(`/api/clinic/postpartum-care/${patientProfile.id}`),
            axios.get(`/api/admin/walkin/family-planning/${patientProfile.id}`)
          ]);
          setServiceSummary({
            babies: (babiesRes.data || []).length || (babiesRes.data?.count || 0),
            lab_results: (labsRes.data || []).length || (labsRes.data?.count || 0),
            prenatal_visits: (prenatalRes.data || []).length || (prenatalRes.data?.count || 0),
            postpartum_assessments: (postpartumRes.data || []).length || (postpartumRes.data?.count || 0),
            family_planning: (fpRes.data || []).length || (fpRes.data?.count || 0)
          });
        } catch (e) {
          console.warn('Service summary load failed:', e);
        } finally {
          setSummaryLoading(false);
        }
      } else {
        alert('No medical records found for this patient.');
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      if (error.response?.status === 404) {
        alert('No medical records found for this patient.');
      } else {
        alert('Error loading medical records. Please try again.');
      }
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleDownloadRecord = async (record) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const html = generateSingleMedicalRecordHTML(selectedPatient, record, logoUrl);
      const filename = `Medical_Record_${selectedPatient.name.replace(/\s+/g, '_')}_${new Date(record.visit_date).toISOString().split('T')[0]}`;
      downloadHTMLAsPDF(html, filename);
    } catch (error) {
      console.error('Error downloading record:', error);
      alert('Error downloading medical record. Please try again.');
    }
  };

  const handleDownloadMedicalRecords = async (patient) => {
    try {
      if (patient.patient_type && patient.patient_type !== 'registered') {
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
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Decide data source: live search results (cross-source) or default list
  const tableRows = (searchTerm.trim().length >= 2 ? searchResults : filteredPatients);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Patients Management</h1>
            <p className="text-gray-600 mt-1">
              View and manage patient information
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
              placeholder="Search patients (min 2 letters, name/phone/email)..."
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
                {['Type', 'Name', 'Email', 'Phone', 'Age', 'Last Visit', 'Actions'].map((header) => (
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
              {(searching ? [] : tableRows).map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.patient_type ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.patient_type==='walk_in' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {patient.patient_type === 'walk_in' ? 'Walk-in' : 'Registered'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Registered</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.patient_type === 'walk_in' || !patient.user_id || patient.user_id === 0 ? (
                        <a href={`/admin/walkin?name=${encodeURIComponent(patient.name)}&contact=${encodeURIComponent(patient.phone || '')}`} className="text-orange-700 hover:underline">{patient.name}</a>
                      ) : (
                        <a href={`/admin/patient/${patient.user_id}`} className="text-green-700 hover:underline">{patient.name}</a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.age}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleViewDetails(patient)}
                        className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 rounded hover:bg-green-50"
                        title="View Patient Profile"
                      >
                        <FaEye className="mr-1" /> Profile
                  </button>
                  <button
                    onClick={() => fetchMedicalRecords(patient)}
                    className="text-green-600 hover:text-green-900 flex items-center px-2 py-1 rounded hover:bg-green-50"
                    title="View Medical Records"
                    disabled={recordsLoading}
                  >
                    {recordsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    ) : (
                      <>
                        <FaEye className="mr-1" /> View Records
                      </>
                    )}
                  </button>
                  {(patient.patient_type === 'walk_in' || !patient.user_id || patient.user_id === 0) && (
                    <button
                      onClick={() => openCreateAccount(patient)}
                      className="text-orange-600 hover:text-orange-900 flex items-center px-2 py-1 rounded hover:bg-orange-50"
                      title="Create Patient Account"
                    >
                      <FaUserPlus className="mr-1" /> Create Account
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadMedicalRecords(patient)}
                    className="text-blue-600 hover:text-blue-900 flex items-center px-2 py-1 rounded hover:bg-blue-50"
                    title="Download Complete Medical Records"
                  >
                    <FaFilePdf className="mr-1" /> Records PDF
                  </button>
                </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedPatient && patientProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full mx-4 max-w-md md:max-w-2xl lg:max-w-3xl">
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
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="text-gray-900">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Age</label>
                    <p className="text-gray-900">{patientProfile.age}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Gender</label>
                    <p className="text-gray-900">{patientProfile.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Blood Type</label>
                    <p className="text-gray-900">{patientProfile.blood_type || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedPatient.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="text-gray-900">{patientProfile.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="text-gray-900">{patientProfile.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Medical History</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500">Total Visits</label>
                    <p className="text-2xl font-semibold text-gray-900">{patientProfile.total_visits}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500">Last Visit</label>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patientProfile.last_visit ? new Date(patientProfile.last_visit).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500">Medical Conditions</label>
                    <p className="text-gray-900">{patientProfile.medical_conditions || 'None reported'}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="text-gray-900 mt-1">{patientProfile.notes || 'No additional notes'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
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

      {showRecordsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
                <p className="text-gray-600">Patient: {selectedPatient.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      if (!medicalRecords.length) { alert('No records to download'); return; }
                      const logoUrl = await resolveLogoUrl();
                      const html = generateMedicalRecordHTML(selectedPatient, medicalRecords, logoUrl);
                      const filename = `Medical_Records_${selectedPatient.name.replace(/\s+/g, '_')}_Complete_History`;
                      downloadHTMLAsPDF(html, filename);
                    } catch (e) { alert('Error'); }
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaFilePdf className="mr-2" />
                  Download All
                </button>
                <button
                  onClick={() => setShowRecordsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500 font-medium">Total Visits</label>
                  <p className="text-lg font-semibold text-gray-900">{medicalRecords.length}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Age</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPatient.age || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Blood Type</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPatient.blood_type || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500">Prenatal</div>
                <div className="text-2xl font-bold text-gray-900">{serviceSummary.prenatal_visits}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500">Postpartum</div>
                <div className="text-2xl font-bold text-gray-900">{serviceSummary.postpartum_assessments}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500">Family Planning</div>
                <div className="text-2xl font-bold text-gray-900">{serviceSummary.family_planning}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500">Lab Results</div>
                <div className="text-2xl font-bold text-gray-900">{serviceSummary.lab_results}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500">Babies</div>
                <div className="text-2xl font-bold text-gray-900">{serviceSummary.babies}</div>
              </div>
            </div>

            <div className="space-y-4">
              {medicalRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FaNotesMedical className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No medical records found for this patient.</p>
                </div>
              ) : (
                medicalRecords
                  .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
                  .map((record, index) => (
                  <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-green-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Visit #{medicalRecords.length - index} - {new Date(record.visit_date).toLocaleDateString()}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDownloadRecord(record)}
                        className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Download this record"
                      >
                        <FaFilePdf className="mr-1" />
                        PDF
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                          <FaUserMd className="mr-2 text-green-600" />
                          Medical Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Diagnosis:</span>
                            <p className="text-gray-900">{record.diagnosis || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Treatment:</span>
                            <p className="text-gray-900">{record.treatment_given || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Vital Signs:</span>
                            <p className="text-gray-900">{(() => {
                              try {
                                const vitals = typeof record.vital_signs === 'string' ? JSON.parse(record.vital_signs) : record.vital_signs;
                                const parts = [];
                                if (vitals?.blood_pressure) parts.push(`BP: ${vitals.blood_pressure}`);
                                if (vitals?.heart_rate) parts.push(`HR: ${vitals.heart_rate}`);
                                if (vitals?.temperature) parts.push(`Temp: ${vitals.temperature}`);
                                return parts.length ? parts.join(', ') : 'Not recorded';
                              } catch { return 'Not recorded'; }
                            })()}</p>
                          </div>
                          {record.doctor_notes && (
                            <div>
                              <span className="font-medium text-gray-600">Doctor Notes:</span>
                              <p className="text-gray-900">{record.doctor_notes}</p>
                            </div>
                          )}
                          {record.recommendations && (
                            <div>
                              <span className="font-medium text-gray-600">Recommendations:</span>
                              <p className="text-gray-900">{record.recommendations}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                          <FaNotesMedical className="mr-2 text-green-600" />
                          Service Context
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Service:</span>
                            <p className="text-gray-900">{record.service_type || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Related Appointment:</span>
                            <p className="text-gray-900">{record.appointment_id || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {record.appointment_id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Related Appointment ID:</span> {record.appointment_id}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowRecordsModal(false)}
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

  {showCreateAccountModal && accountTarget && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Create Account for {accountTarget.name}</h3>
        <div className="space-y-3">
          <input className="border rounded p-2 w-full" placeholder="Email" value={accountForm.email} onChange={(e)=>setAccountForm(v=>({...v,email:e.target.value}))} />
          <input type="password" className="border rounded p-2 w-full" placeholder="Temporary Password" value={accountForm.password} onChange={(e)=>setAccountForm(v=>({...v,password:e.target.value}))} />
          <input type="password" className="border rounded p-2 w-full" placeholder="Confirm Password" value={accountForm.confirm} onChange={(e)=>setAccountForm(v=>({...v,confirm:e.target.value}))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 border rounded" onClick={()=>{setShowCreateAccountModal(false);setAccountTarget(null);}}>Cancel</button>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={createAccountForPatient}>Create</button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}

export default Adminpatient;
