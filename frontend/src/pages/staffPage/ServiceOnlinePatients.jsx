import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { FaSearch, FaEye, FaFilePdf, FaNotesMedical } from 'react-icons/fa';
import { generateMedicalRecordHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../../utils/logoUtils';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const StaffServiceOnlinePatients = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const serviceType = query.get('service_type') || '';
  const [initializedDefault, setInitializedDefault] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesRecord, setNotesRecord] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    const setDefaultService = async () => {
      if (serviceType || initializedDefault) return;
      try {
        const res = await axios.get('/api/users/services');
        const list = Array.isArray(res.data) ? res.data : [];
        const match = list.find(s => (s.name || '').toLowerCase().includes('prenatal')) || list.find(s => (s.type || '').toLowerCase().includes('prenatal'));
        const name = match ? match.name : 'Prenatal';
        navigate(`/staff/services/online-patients?service_type=${encodeURIComponent(name)}`, { replace: true });
      } finally {
        setInitializedDefault(true);
      }
    };
    setDefaultService();
  }, [serviceType, initializedDefault, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!serviceType) return;
      setLoading(true);
      setError('');
      try {
        // Staff can use admin endpoint; backend enforces role
        const response = await axios.get('/api/admin/service-online-patients', {
          params: { service_type: serviceType }
        });
        setRows(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching online patients by service:', err);
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [serviceType]);

  

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(r => (r.patient_name || '').toLowerCase().includes(term));
  }, [rows, searchTerm]);

  const handleViewProfile = (row) => {
    if (row?.user_id) {
      navigate(`/staff/patient/${row.user_id}`);
      return;
    }
    const name = row?.patient_name || '';
    const contact = row?.contact_number || '';
    navigate(`/staff/walkin?name=${encodeURIComponent(name)}&contact=${encodeURIComponent(contact)}`);
  };

  const handleDownloadRecords = async (row) => {
    try {
      if (!row?.patient_id) {
        alert('Medical records download is only available for registered patients.');
        return;
      }
      const recordsResponse = await axios.get(`/api/staff/medical-records/patient/${row.patient_id}`);
      const { patient_info, medical_records } = recordsResponse.data || {};
      if (!medical_records || medical_records.length === 0) {
        alert('No medical records found for this patient.');
        return;
      }
      const logoUrl = await resolveLogoUrl();
      const html = generateMedicalRecordHTML(patient_info || {
        name: row.patient_name,
        email: row.email || 'N/A',
        phone: row.contact_number || 'N/A',
      }, medical_records, logoUrl);
      const filename = `Medical_Records_${(row.patient_name || 'Patient').replace(/\s+/g, '_')}_Complete_History`;
      downloadHTMLAsPDF(html, filename);
    } catch (error) {
      console.error('Error downloading medical records:', error);
      if (error.response?.status === 404) {
        alert('No medical records found for this patient.');
      } else {
        alert('Error downloading medical records. Please try again.');
      }
    }
  };

  const handleViewMedicalNotes = async (row) => {
    try {
      setNotesLoading(true);
      const bookingId = row.booking_id || row.id;
      if (!bookingId) {
        alert('Missing booking id');
        setNotesLoading(false);
        return;
      }
      const res = await axios.get(`/api/staff/medical-record/${bookingId}`);
      setNotesRecord(res.data || null);
      setShowNotesModal(true);
    } catch (err) {
      console.error('Error loading medical notes:', err);
      alert(err.response?.data?.error || 'Failed to load medical notes');
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Online Patients</h1>
          <p className="text-gray-600">Service: <span className="font-semibold">{serviceType || '—'}</span></p>
        </div>
        <div className="relative w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
      </div>

      {loading && (
        <div className="text-gray-600">Loading...</div>
      )}
      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map((row) => (
                  <tr key={`${row.booking_id}-${row.time_slot}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.time_slot}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">{row.patient_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.contact_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.appointment_status || row.request_status || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewProfile(row)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="View Profile"
                        >
                          <FaEye /> View
                        </button>
                        <button
                          onClick={() => handleViewMedicalNotes(row)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          title="View Medical Notes"
                          disabled={notesLoading}
                        >
                          <FaNotesMedical /> Notes
                        </button>
                        <button
                          onClick={() => handleDownloadRecords(row)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Download Records PDF"
                        >
                          <FaFilePdf /> Records PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={6}>
                      No online patients found for this service.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNotesModal && notesRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Medical Notes</h2>
              <button onClick={() => setShowNotesModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Diagnosis:</span> {notesRecord?.diagnosis || 'Not specified'}</div>
              <div><span className="text-gray-600">Treatment:</span> {notesRecord?.treatment_given || 'Not specified'}</div>
              {notesRecord?.doctor_notes && (
                <div><span className="text-gray-600">Doctor Notes:</span> {notesRecord.doctor_notes}</div>
              )}
              {notesRecord?.recommendations && (
                <div><span className="text-gray-600">Recommendations:</span> {notesRecord.recommendations}</div>
              )}
              {notesRecord?.vital_signs && (
                <div><span className="text-gray-600">Vital Signs:</span> {(() => {
                  try { const v = typeof notesRecord.vital_signs === 'string' ? JSON.parse(notesRecord.vital_signs) : notesRecord.vital_signs; const parts=[]; if (v?.blood_pressure) parts.push(`BP: ${v.blood_pressure}`); if (v?.heart_rate) parts.push(`HR: ${v.heart_rate}`); if (v?.temperature) parts.push(`Temp: ${v.temperature}`); return parts.join(', '); } catch { return 'Recorded'; }
                })()}</div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowNotesModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffServiceOnlinePatients;
