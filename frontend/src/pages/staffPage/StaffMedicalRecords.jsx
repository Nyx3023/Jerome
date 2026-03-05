import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { FaSearch, FaCheckCircle, FaEye, FaFilePdf, FaUser, FaBaby } from 'react-icons/fa';
import { ViewAdmissionFormModal, ViewDischargeModal, ViewNewbornDischargeModal, ViewDeliveryRecordModal } from '../../components/modals/AdmissionDocumentViewModals';
import { resolveLogoUrl } from '../../utils/logoUtils';
import { generateAdmissionFormHTML, generateDeliveryRoomRecordHTML, generateMotherDischargeSummaryHTML, generateNewbornDischargeSummaryHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';

function StaffMedicalRecords() {
  const [admissions, setAdmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddAdmission, setShowAddAdmission] = useState(false);
  const [viewAdmissionForm, setViewAdmissionForm] = useState(null);
  const [viewDischarge, setViewDischarge] = useState(null);
  const [viewNewbornDischarge, setViewNewbornDischarge] = useState(null);
  const [viewDeliveryRecord, setViewDeliveryRecord] = useState(null);
  const [dischargeTarget, setDischargeTarget] = useState(null);
  const [deliveryTarget, setDeliveryTarget] = useState(null);
  const navigate = useNavigate();

  const variants = {
    neutral: 'border-gray-300 text-gray-700 hover:bg-gray-50',
    blue: 'border-blue-300 text-blue-700 hover:bg-blue-50',
    yellow: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50',
    green: 'border-green-300 text-green-700 hover:bg-green-50',
    red: 'border-red-300 text-red-700 hover:bg-red-50'
  };
  const btn = (v) => `inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded border ${variants[v] || variants.neutral}`;


  useEffect(() => {
    loadAdmissions();
  }, []);

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/admissions');
      setAdmissions(res.data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDischarge = async (admission) => {
    setDischargeTarget(admission);
  };

  const printAdmissionForm = async (admission) => {
    try {
      const logoUrl = await resolveLogoUrl();
      let dd = {};
      try {
        if (admission.notes) {
          const n = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
          dd = n?.delivery_details || {};
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to parse admission notes JSON', e);
      }
      const fullName = admission.display_patient_name || admission.patient_name || '';
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      const patientData = {
        age: admission.patient_age || '',
        gender: admission.patient_gender || '',
        address: admission.patient_address || '',
        last_name: parts.length ? parts[parts.length - 1] : '',
        first_name: parts.length ? parts[0] : '',
        middle_name: parts.length > 2 ? parts.slice(1, -1).join(' ') : ''
      };
      const prenatal = {
        gravida: dd.gravida || '',
        para: dd.para || '',
        vitals: {}
      };
      const html = generateAdmissionFormHTML(admission, patientData, prenatal, logoUrl);
      const name = (fullName || 'Admission').replace(/\s+/g, '_');
      downloadHTMLAsPDF(html, `Admission_Form_${name}_${admission.id}`);
    } catch {
      alert('Failed to generate Admission PDF');
    }
  };

  const printDischargeSummary = async (admission) => {
    try {
      const logoUrl = await resolveLogoUrl();
      let dd = {};
      try {
        if (admission.notes) {
          const n = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
          dd = n?.delivery_details || {};
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to parse admission notes JSON', e);
      }
      const fullName = admission.display_patient_name || admission.patient_name || '';
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      const patientData = {
        age: admission.patient_age || '',
        gender: admission.patient_gender || '',
        address: admission.patient_address || '',
        last_name: parts.length ? parts[parts.length - 1] : '',
        first_name: parts.length ? parts[0] : '',
        middle_name: parts.length > 2 ? parts.slice(1, -1).join(' ') : ''
      };
      const prenatal = {
        gravida: dd.gravida || '',
        para: dd.para || '',
        aog: admission.pregnancy_cycle || ''
      };
      const html = generateMotherDischargeSummaryHTML(patientData, admission, prenatal, logoUrl);
      const name = (admission.display_patient_name || admission.patient_name || 'Patient').replace(/\s+/g, '_');
      downloadHTMLAsPDF(html, `Discharge_${name}_${admission.id}`);
    } catch {
      alert('Failed to generate Discharge PDF');
    }
  };

  const printNewbornDischargeSummary = async (admission) => {
    try {
      const logoUrl = await resolveLogoUrl();
      let dd = {};
      try {
        if (admission.notes) {
          const n = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
          dd = n?.delivery_details || {};
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to parse admission notes JSON', e);
      }
      const motherName = admission.display_patient_name || admission.patient_name || '';
      const mother = {
        name: motherName,
        age: admission.patient_age || '',
        address: admission.patient_address || '',
        gravida: dd.gravida || '',
        para: dd.para || ''
      };
      const baby = {
        full_name: dd.baby_details?.full_name || '',
        gender: dd.baby_details?.gender || '',
        birth_weight_kg: dd.baby_details?.birth_weight_kg || admission.baby_weight_kg || '',
        apgar_1min: admission.apgar1 || '',
        apgar_5min: admission.apgar5 || ''
      };
      const maternal = {
        delivery_type: admission.delivery_type || '',
        aog: ''
      };
      const dAd = admission.admitted_at ? new Date(admission.admitted_at) : null;
      const dDc = admission.discharged_at ? new Date(admission.discharged_at) : null;
      const nbAdmission = {
        date_admitted: dAd ? `${dAd.toLocaleDateString()} ${dAd.toLocaleTimeString()}` : '',
        date_discharge: dDc ? `${dDc.toLocaleDateString()} ${dDc.toLocaleTimeString()}` : '',
        admitting_diagnosis: admission.admission_reason || '',
        screening_date: dd.screening_date || '',
        screening_filter_card_no: dd.screening_filter_card_no || '',
        vitamin_k_date: dd.vitamin_k_date || '',
        bcg_date: dd.bcg_date || '',
        hepb_date: dd.hepb_date || '',
        home_medication: dd.home_medication || '',
        follow_up: dd.follow_up || '',
        discharged_by: admission.discharged_by || ''
      };
      const html = generateNewbornDischargeSummaryHTML(mother, baby, nbAdmission, maternal, logoUrl);
      const name = (motherName || 'Newborn').replace(/\s+/g, '_');
      downloadHTMLAsPDF(html, `Newborn_Discharge_${name}_${admission.id}`);
    } catch {
      alert('Failed to generate Newborn Discharge PDF');
    }
  };





  const filteredAdmissions = admissions.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      (a.display_patient_name || a.patient_name || '').toLowerCase().includes(term) ||
      (a.display_contact_number || a.contact_number || '').toLowerCase().includes(term) ||
      (a.admission_reason || '').toLowerCase().includes(term) ||
      (a.room || '').toLowerCase().includes(term) ||
      (a.status || '').toLowerCase().includes(term)
    );
  });


  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admissions</h1>
            <p className="text-gray-600 mt-1">Patients Admitted</p>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowAddAdmission(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Admission
            </button>
          </div>
        </div>
      </div>
      {/* Delivery and newborn details are handled within UpdateDeliveryModal */}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Patient', 'Contact', 'Status', 'Admitted', 'Room', 'Reason', 'Actions'].map((header) => (
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
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      <span className="ml-2">Loading admissions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No admissions match your search' : 'No current admissions found'}
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{a.display_patient_name || a.patient_name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{a.display_contact_number || a.contact_number || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${a.status === 'admitted' ? 'bg-green-100 text-green-700' : a.status === 'delivered' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{a.status || 'admitted'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{a.admitted_at ? new Date(a.admitted_at).toLocaleString() : '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{a.room || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{a.admission_reason || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setViewAdmissionForm(a)} className={btn('neutral')} title="View Admission Form">
                          <FaEye /> View Admission
                        </button>
                        <button onClick={() => setViewDischarge(a)} className={btn('green')} title="View Discharge Summary">
                          <FaEye /> View Discharge
                        </button>
                        <button onClick={() => setViewNewbornDischarge(a)} className={btn('yellow')} title="View Newborn Discharge">
                          <FaEye /> View Newborn
                        </button>
                        <button onClick={() => setViewDeliveryRecord(a)} className={btn('blue')} title="View Delivery Record">
                          <FaEye /> View Delivery
                        </button>
                        {a.user_id ? (
                          <button onClick={() => navigate(`/staff/patient/${a.user_id}`)} className={btn('neutral')} title="Go to Patient Record">
                            <FaUser /> View Patient
                          </button>
                        ) : null}
                        {a.status !== 'discharged' && (
                          <button onClick={() => setDeliveryTarget(a)} className={btn('yellow')} title="Update Delivery Details">
                            <FaBaby /> Update Delivery
                          </button>
                        )}
                        {a.status !== 'discharged' && (
                          <button onClick={() => handleDischarge(a)} className={btn('red')} title="Discharge Patient">
                            <FaCheckCircle /> Discharge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {showAddAdmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
            <AddAdmissionForAnyPatient
              onClose={() => setShowAddAdmission(false)}
              onSuccess={(p) => {
                setShowAddAdmission(false);
                const id = p?.user_id || p?.id;
                if (id) navigate(`/staff/patient/${id}`);
              }}
            />
          </div>
        </div>
      )}


      {/* View Admission Form Modal */}
      {viewAdmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewAdmissionForm(null)}>
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <ViewAdmissionFormModal
              admission={viewAdmissionForm}
              onClose={() => setViewAdmissionForm(null)}
              onPrint={() => printAdmissionForm(viewAdmissionForm)}
            />
          </div>
        </div>
      )}

      {/* View Discharge Summary Modal */}
      {viewDischarge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewDischarge(null)}>
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <ViewDischargeModal
              admission={viewDischarge}
              onClose={() => setViewDischarge(null)}
              onPrint={() => printDischargeSummary({ ...viewDischarge, discharged_at: viewDischarge.discharged_at || new Date().toISOString(), status: 'discharged' })}
            />
          </div>
        </div>
      )}

      {/* View Newborn Discharge Modal */}
      {viewNewbornDischarge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewNewbornDischarge(null)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <ViewNewbornDischargeModal
              admission={viewNewbornDischarge}
              onClose={() => setViewNewbornDischarge(null)}
              onPrint={() => {
                const v = { ...viewNewbornDischarge, discharged_at: viewNewbornDischarge.discharged_at || new Date().toISOString(), status: 'discharged' };
                printNewbornDischargeSummary(v);
              }}
            />
          </div>
        </div>
      )}

      {/* View Delivery Record Modal */}
      {viewDeliveryRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewDeliveryRecord(null)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <ViewDeliveryRecordModal
              admission={viewDeliveryRecord}
              onClose={() => setViewDeliveryRecord(null)}
              onPrint={() => printDeliveryRoomRecord(viewDeliveryRecord)}
            />
          </div>
        </div>
      )}

      {dischargeTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDischargeTarget(null)}>
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <DischargeAdmissionModal
              admission={dischargeTarget}
              onClose={() => setDischargeTarget(null)}
              onSuccess={async (updated) => {
                setDischargeTarget(null);
                await loadAdmissions();
              }}
            />
          </div>
        </div>
      )}

      {deliveryTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
            <UpdateDeliveryModal
              admission={deliveryTarget}
              onClose={() => setDeliveryTarget(null)}
              onSuccess={async (updated) => {
                setDeliveryTarget(null);
                await loadAdmissions();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AddAdmissionForAnyPatient({ onClose, onSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPatient, setNewPatient] = useState({ first_name: '', middle_name: '', last_name: '', email: '', phone: '', age: '', gender: '', address: '' });
  const [formData, setFormData] = useState({ patient_name: '', contact_number: '', booking_id: '', room: '', status: 'admitted', admission_reason: '', pregnancy_cycle: '', gravida: '', para: '', delivery_type: '', outcome: '', baby_weight_kg: '', apgar1: '', apgar5: '', complications: '', disposition: '' });
  const [loading, setLoading] = useState(false);
  const [cycleOptions, setCycleOptions] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [physicalExam, setPhysicalExam] = useState({ skin: '', conjunctiva: '', breast: '', abdomen: '', extremities: '' });

  useEffect(() => {
    const h = setTimeout(async () => {
      const term = searchTerm.trim();
      if (term.length < 2) { setSearchResults([]); return; }
      try {
        const res = await axios.get('/api/admin/search-patients', { params: { search_term: term } });
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const applySelectedPatient = (p) => {
    setSelectedPatient(p);
    setCreatingNew(false);
    const name = p?.name || [p?.first_name, p?.middle_name, p?.last_name].filter(Boolean).join(' ');
    setFormData(prev => ({
      ...prev,
      patient_name: name,
      contact_number: p?.phone || ''
    }));
  };

  useEffect(() => {
    const loadCycles = async () => {
      try {
        setLoadingCycles(true);
        let records = [];
        if (selectedPatient && selectedPatient.id) {
          // Registered patient path via clinic prenatal schedule
          const res = await axios.get(`/api/clinic/prenatal-schedule/${selectedPatient.id}`);
          records = res.data || [];
        } else if ((formData.patient_name || '').trim() && (formData.contact_number || '').trim()) {
          // Walk-in path via admin walk-in prenatal
          const res = await axios.get('/api/admin/walkin/prenatal', { params: { patient_name: formData.patient_name.trim(), contact_number: formData.contact_number.trim() } });
          records = res.data || [];
        }
        const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(v => v !== null && v !== undefined))).sort((a, b) => a - b);
        const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
        setCycleOptions(opts);
        // Preserve existing selection or clear if invalid
        setFormData(prev => ({ ...prev, pregnancy_cycle: opts.find(o => o.value === prev.pregnancy_cycle) ? prev.pregnancy_cycle : '' }));
      } catch {
        setCycleOptions([]);
      } finally {
        setLoadingCycles(false);
      }
    };
    loadCycles();
  }, [selectedPatient, formData.patient_name, formData.contact_number]);

  const createNewPatient = async () => {
    setLoading(true);
    try {
      const payload = {
        first_name: newPatient.first_name,
        middle_name: newPatient.middle_name || null,
        last_name: newPatient.last_name,
        email: newPatient.email,
        phone: newPatient.phone || null,
        age: newPatient.age || null,
        gender: newPatient.gender || null,
        address: newPatient.address || null
      };
      const res = await axios.post('/api/admin/patients', payload);
      const created = { id: res.data?.id, name: [newPatient.first_name, newPatient.middle_name, newPatient.last_name].filter(Boolean).join(' '), email: newPatient.email, phone: newPatient.phone, user_id: null };
      applySelectedPatient(created);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const existing_user_id = selectedPatient && selectedPatient.user_id ? selectedPatient.user_id : null;
      const submission = {
        existing_user_id,
        patient_name: formData.patient_name || null,
        contact_number: formData.contact_number || null,
        booking_id: formData.booking_id || null,
        room: formData.room || null,
        status: formData.status || 'admitted',
        admission_reason: formData.admission_reason,
        pregnancy_cycle: formData.pregnancy_cycle || null,
        delivery_type: formData.delivery_type || null,
        outcome: formData.outcome || null,
        baby_weight_kg: formData.baby_weight_kg ? parseFloat(formData.baby_weight_kg) : null,
        apgar1: formData.apgar1 ? parseInt(formData.apgar1) : null,
        apgar5: formData.apgar5 ? parseInt(formData.apgar5) : null,
        complications: formData.complications || null,
        disposition: formData.disposition || null
      };
      const hasPE = Object.values(physicalExam).some(v => String(v || '').trim() !== '');
      if (hasPE) {
        submission.notes = JSON.stringify({ physical_exam: physicalExam });
      }
      await axios.post('/api/admin/admissions', submission);
      const p = selectedPatient || { id: null, user_id: null };
      onSuccess(p);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create admission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Add Admission</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Search Patient</label>
          <input type="text" className="w-full p-2 border rounded" placeholder="Type name, phone, or email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded max-h-40 overflow-y-auto">
              {searchResults.map((p) => (
                <div key={p.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => applySelectedPatient(p)}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.email} • {p.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input id="creating_new" type="checkbox" className="w-4 h-4" checked={creatingNew} onChange={(e) => setCreatingNew(e.target.checked)} />
          <label htmlFor="creating_new" className="text-sm">Create new patient</label>
        </div>
        {creatingNew && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" className="w-full p-2 border rounded" placeholder="First name" value={newPatient.first_name} onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded" placeholder="Middle name" value={newPatient.middle_name} onChange={(e) => setNewPatient({ ...newPatient, middle_name: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded" placeholder="Last name" value={newPatient.last_name} onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })} />
            <input type="email" className="w-full p-2 border rounded" placeholder="Email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded" placeholder="Phone" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded" placeholder="Age" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded" placeholder="Gender" value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded md:col-span-2" placeholder="Address" value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} />
            <div className="md:col-span-2">
              <button type="button" onClick={createNewPatient} disabled={loading || !newPatient.first_name || !newPatient.last_name || !newPatient.email} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Create Patient</button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" className="w-full p-2 border rounded" placeholder="Patient name" value={formData.patient_name} onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })} />
          <input type="text" className="w-full p-2 border rounded" placeholder="Contact number" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} />
          <input type="number" className="w-full p-2 border rounded" placeholder="Booking ID (optional)" value={formData.booking_id} onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })} />
          <input type="text" className="w-full p-2 border rounded" placeholder="Room" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} />
          <div>
            <label className="block text-sm font-medium mb-1">Cycle</label>
            <select className="w-full p-2 border rounded" value={formData.pregnancy_cycle} onChange={(e) => setFormData({ ...formData, pregnancy_cycle: e.target.value })}>
              <option value="">Select cycle (from prenatal)</option>
              {loadingCycles ? <option value="" disabled>Loading…</option> : null}
              {!loadingCycles && cycleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <textarea className="w-full p-2 border rounded" rows="3" placeholder="Admission reason" value={formData.admission_reason} onChange={(e) => setFormData({ ...formData, admission_reason: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select className="w-full p-2 border rounded" value={formData.delivery_type} onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}>
            <option value="">Select delivery type</option>
            <option value="Normal Spontaneous Delivery">Normal Spontaneous Delivery</option>
            <option value="Cesarean Section">Cesarean Section</option>
            <option value="Assisted Delivery">Assisted Delivery</option>
            <option value="VBAC">VBAC (Vaginal Birth After Cesarean)</option>
          </select>
          <select className="w-full p-2 border rounded" value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}>
            <option value="">Select outcome</option>
            <option value="Live Birth">Live Birth</option>
            <option value="Stillbirth">Stillbirth</option>
            <option value="Ongoing Care">Ongoing Care</option>
          </select>
          <input type="number" step="0.01" className="w-full p-2 border rounded" placeholder="Baby weight (kg)" value={formData.baby_weight_kg} onChange={(e) => setFormData({ ...formData, baby_weight_kg: e.target.value })} />
          <input type="number" min="0" max="10" className="w-full p-2 border rounded" placeholder="APGAR 1 min" value={formData.apgar1} onChange={(e) => setFormData({ ...formData, apgar1: e.target.value })} />
          <input type="number" min="0" max="10" className="w-full p-2 border rounded" placeholder="APGAR 5 min" value={formData.apgar5} onChange={(e) => setFormData({ ...formData, apgar5: e.target.value })} />
          <input type="text" className="w-full p-2 border rounded md:col-span-2" placeholder="Complications" value={formData.complications} onChange={(e) => setFormData({ ...formData, complications: e.target.value })} />
        </div>
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-3">Physical Examination (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Skin</label>
              <input type="text" value={physicalExam.skin} onChange={(e) => setPhysicalExam({ ...physicalExam, skin: e.target.value })} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conjunctiva</label>
              <input type="text" value={physicalExam.conjunctiva} onChange={(e) => setPhysicalExam({ ...physicalExam, conjunctiva: e.target.value })} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Breast</label>
              <input type="text" value={physicalExam.breast} onChange={(e) => setPhysicalExam({ ...physicalExam, breast: e.target.value })} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Abdomen</label>
              <input type="text" value={physicalExam.abdomen} onChange={(e) => setPhysicalExam({ ...physicalExam, abdomen: e.target.value })} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Extremities</label>
              <input type="text" value={physicalExam.extremities} onChange={(e) => setPhysicalExam({ ...physicalExam, extremities: e.target.value })} className="w-full p-2 border rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end pt-4">
        <div className="text-xs text-gray-600 mr-auto">
          {!formData.admission_reason ? 'Enter admission reason to enable Create' : ''}
        </div>
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        <button
          type="submit"
          disabled={loading || !formData.admission_reason}
          aria-busy={loading ? 'true' : 'false'}
          className={`px-4 py-2 rounded text-white ${loading || !formData.admission_reason ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Creating…' : 'Create Admission'}
        </button>
      </div>
    </form>
  );
}

function DischargeAdmissionModal({ admission, onClose, onSuccess }) {
  const [disposition, setDisposition] = useState('home');
  const [discharge_notes, setDischargeNotes] = useState('');
  const [discharged_at, setDischargedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        disposition,
        discharge_notes,
        discharged_at: discharged_at ? new Date(discharged_at).toISOString() : null
      };
      await axios.put(`/api/admin/admissions/${admission.id}/discharge`, payload);
      const updated = { ...admission, status: 'discharged', disposition, discharge_notes, discharged_at: payload.discharged_at };
      onSuccess(updated);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to discharge');
    } finally {
      setLoading(false);
    }
  };

  const printDischarge = async () => {
    const updated = { ...admission, status: 'discharged', disposition, discharge_notes, discharged_at: discharged_at ? new Date(discharged_at).toISOString() : new Date().toISOString() };
    await (async () => {
      try {
        const logoUrl = await resolveLogoUrl();
        const patientData = {
          age: updated.patient_age || '',
          gender: updated.patient_gender || '',
          address: updated.patient_address || '',
          last_name: '',
          first_name: '',
          middle_name: ''
        };
        const html = generateMotherDischargeSummaryHTML(patientData, updated, {}, logoUrl);
        const name = (updated.display_patient_name || updated.patient_name || 'Patient').replace(/\s+/g, '_');
        downloadHTMLAsPDF(html, `Discharge_${name}_${updated.id}`);
      } catch {
        alert('Failed to generate Discharge PDF');
      }
    })();
  };

  const printNewbornDischarge = async () => {
    const updated = { ...admission, status: 'discharged', disposition, discharge_notes, discharged_at: discharged_at ? new Date(discharged_at).toISOString() : new Date().toISOString() };
    await (async () => {
      try {
        const logoUrl = await resolveLogoUrl();
        const motherName = updated.display_patient_name || updated.patient_name || '';
        const mother = {
          name: motherName,
          age: updated.patient_age || '',
          address: updated.patient_address || '',
          gravida: '',
          para: ''
        };
        const baby = {
          full_name: '',
          gender: '',
          birth_weight_kg: updated.baby_weight_kg || '',
          apgar_1min: updated.apgar1 || '',
          apgar_5min: updated.apgar5 || ''
        };
        const maternal = {
          delivery_type: updated.delivery_type || '',
          aog: ''
        };
        const dAd = updated.admitted_at ? new Date(updated.admitted_at) : null;
        const dDc = updated.discharged_at ? new Date(updated.discharged_at) : null;
        const nbAdmission = {
          date_admitted: dAd ? `${dAd.toLocaleDateString()} ${dAd.toLocaleTimeString()}` : '',
          date_discharge: dDc ? `${dDc.toLocaleDateString()} ${dDc.toLocaleTimeString()}` : '',
          admitting_diagnosis: updated.admission_reason || ''
        };
        const html = generateNewbornDischargeSummaryHTML(mother, baby, nbAdmission, maternal, logoUrl);
        const name = (motherName || 'Newborn').replace(/\s+/g, '_');
        downloadHTMLAsPDF(html, `Newborn_Discharge_${name}_${updated.id}`);
      } catch {
        alert('Failed to generate Newborn Discharge PDF');
      }
    })();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold">Discharge Patient</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Disposition</label>
          <select value={disposition} onChange={(e) => setDisposition(e.target.value)} className="w-full p-2 border rounded">
            <option value="home">Home</option>
            <option value="transferred">Transferred</option>
            <option value="AMA">AMA</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Discharged at</label>
          <input type="datetime-local" value={discharged_at} onChange={(e) => setDischargedAt(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Discharge notes</label>
          <textarea rows="4" value={discharge_notes} onChange={(e) => setDischargeNotes(e.target.value)} className="w-full p-2 border rounded" placeholder="Summary, medications, follow-up" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        <button type="button" onClick={printDischarge} className="px-4 py-2 bg-red-600 text-white rounded">Print Discharge</button>
        <button type="button" onClick={printNewbornDischarge} className="px-4 py-2 bg-yellow-600 text-white rounded">Newborn Discharge</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Confirm Discharge</button>
      </div>
    </form>
  );
}

function UpdateDeliveryModal({ admission, onClose, onSuccess }) {
  const [delivery_type, setDeliveryType] = useState(admission.delivery_type || '');
  const [outcome, setOutcome] = useState(admission.outcome || '');
  const [baby_weight_kg, setBabyWeight] = useState(admission.baby_weight_kg || '');
  const [apgar1, setApgar1] = useState(admission.apgar1 || '');
  const [apgar5, setApgar5] = useState(admission.apgar5 || '');
  const [complications, setComplications] = useState(admission.complications || '');
  const [delivered_at, setDeliveredAt] = useState(() => admission.delivered_at ? new Date(admission.delivered_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [attending_midwife, setAttendingMidwife] = useState(admission.attending_midwife || '');
  const [fluid_character, setFluidCharacter] = useState(admission.fluid_character || '');
  const [fully_dilated_at, setFullyDilatedAt] = useState(() => admission.fully_dilated_at ? new Date(admission.fully_dilated_at).toISOString().slice(0, 16) : '');
  const [placenta, setPlacenta] = useState(admission.placenta || '');
  const [placenta_delivered_at, setPlacentaDeliveredAt] = useState(() => admission.placenta_delivered_at ? new Date(admission.placenta_delivered_at).toISOString().slice(0, 16) : '');
  const [repair, setRepair] = useState(admission.repair || '');
  const [packing, setPacking] = useState(admission.packing || '');
  const [mother_remarks, setMotherRemarks] = useState(admission.remarks || '');
  const [bp_on_discharge, setBpOnDischarge] = useState(admission.bp_on_discharge || '');
  const [temperatureMother, setTemperatureMother] = useState(admission.temperature || '');
  const [gravida, setGravida] = useState(admission.gravida || '');
  const [para, setPara] = useState(admission.para || '');
  const [baby_name, setBabyName] = useState('');
  const [baby_gender, setBabyGender] = useState('');
  const [general_condition, setGeneralCondition] = useState('');
  const [eye_prophylaxis, setEyeProphylaxis] = useState('');
  const [injuries, setInjuries] = useState('');
  const [birth_length_cm, setBirthLengthCm] = useState('');
  const [head_circumference, setHeadCircumference] = useState('');
  const [chest, setChest] = useState('');
  const [abdomen, setAbdomen] = useState('');
  const [heart_rate, setHeartRate] = useState('');
  const [respiratory_rate, setRespiratoryRate] = useState('');
  const [temperatureBaby, setTemperatureBaby] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        delivery_type,
        outcome,
        baby_weight_kg: baby_weight_kg ? parseFloat(baby_weight_kg) : null,
        apgar1: apgar1 ? parseInt(apgar1) : null,
        apgar5: apgar5 ? parseInt(apgar5) : null,
        complications,
        delivered_at: delivered_at ? new Date(delivered_at).toISOString() : null
      };
      await axios.put(`/api/admin/admissions/${admission.id}/delivery`, payload);
      const extra = {
        attending_midwife: attending_midwife || null,
        fluid_character: fluid_character || null,
        fully_dilated_at: fully_dilated_at ? new Date(fully_dilated_at).toISOString() : null,
        placenta: placenta || null,
        placenta_delivered_at: placenta_delivered_at ? new Date(placenta_delivered_at).toISOString() : null,
        repair: repair || null,
        packing: packing || null,
        remarks: mother_remarks || null,
        bp_on_discharge: bp_on_discharge || null,
        temperature: temperatureMother || null,
        gravida: gravida || null,
        para: para || null,
        baby_details: {
          full_name: baby_name || null,
          gender: baby_gender || null,
          general_condition: general_condition || null,
          eye_prophylaxis: eye_prophylaxis || null,
          injuries: injuries || null,
          birth_length_cm: birth_length_cm || null,
          head_circumference: head_circumference || null,
          chest: chest || null,
          abdomen: abdomen || null,
          heart_rate: heart_rate || null,
          respiratory_rate: respiratory_rate || null,
          temperature: temperatureBaby || null
        }
      };
      try {
        await axios.put(`/api/admin/admissions/${admission.id}`, { notes: JSON.stringify({ delivery_details: extra }) });
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to persist delivery details to notes', err);
      }
      const updated = { ...admission, status: 'delivered', ...payload, ...extra };
      onSuccess(updated);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update delivery');
    } finally {
      setLoading(false);
    }
  };

  const printDelivery = async () => {
    try {
      const logoUrl = await resolveLogoUrl();
      const mother = {
        name: admission.display_patient_name || admission.patient_name || '',
        age: admission.patient_age || '',
        address: admission.patient_address || '',
        gravida: gravida || '',
        para: para || ''
      };
      const baby = {
        birth_weight: baby_weight_kg || admission.baby_weight_kg || '',
        apgar_1min: apgar1 || admission.apgar1 || '',
        apgar_5min: apgar5 || admission.apgar5 || '',
        full_name: baby_name || '',
        gender: baby_gender || '',
        general_condition: general_condition || '',
        eye_prophylaxis: eye_prophylaxis || '',
        injuries: injuries || '',
        birth_length_cm: birth_length_cm || '',
        head_circumference: head_circumference || '',
        chest: chest || '',
        abdomen: abdomen || '',
        heart_rate: heart_rate || '',
        respiratory_rate: respiratory_rate || '',
        temperature: temperatureBaby || ''
      };
      const adm = {
        ...admission,
        delivery_type,
        outcome,
        delivered_at,
        attending_midwife,
        fluid_character,
        fully_dilated_at,
        placenta,
        placenta_delivered_at,
        repair,
        packing,
        remarks: mother_remarks,
        bp_on_discharge,
        temperature: temperatureMother
      };
      const html = generateDeliveryRoomRecordHTML(mother, baby, adm, logoUrl);
      const name = (mother.name || 'Delivery').replace(/\s+/g, '_');
      downloadHTMLAsPDF(html, `Delivery_Record_${name}_${admission.id}`);
    } catch {
      alert('Failed to generate Delivery PDF');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold">Update Delivery</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Delivery type</label>
          <select value={delivery_type} onChange={(e) => setDeliveryType(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select delivery type</option>
            <option value="Normal Spontaneous Delivery">Normal Spontaneous Delivery</option>
            <option value="Cesarean Section">Cesarean Section</option>
            <option value="Assisted Delivery">Assisted Delivery</option>
            <option value="VBAC">VBAC (Vaginal Birth After Cesarean)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Outcome</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select outcome</option>
            <option value="Live Birth">Live Birth</option>
            <option value="Stillbirth">Stillbirth</option>
            <option value="Ongoing Care">Ongoing Care</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Baby weight (kg)</label>
          <input type="number" step="0.01" value={baby_weight_kg} onChange={(e) => setBabyWeight(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">APGAR 1 min</label>
          <input type="number" min="0" max="10" value={apgar1} onChange={(e) => setApgar1(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">APGAR 5 min</label>
          <input type="number" min="0" max="10" value={apgar5} onChange={(e) => setApgar5(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Delivered at</label>
          <input type="datetime-local" value={delivered_at} onChange={(e) => setDeliveredAt(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Complications</label>
          <input type="text" value={complications} onChange={(e) => setComplications(e.target.value)} className="w-full p-2 border rounded" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        <button type="button" onClick={printDelivery} className="px-4 py-2 bg-yellow-600 text-white rounded">Print Delivery</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Save Delivery</button>
      </div>
    </form>
  );
}

export default StaffMedicalRecords;
const printDeliveryRoomRecord = async (admission) => {
  try {
    const logoUrl = await resolveLogoUrl();
    let dd = {};
    try {
      if (admission.notes) {
        const n = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
        dd = n?.delivery_details || {};
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('Failed to parse admission notes JSON', e);
    }
    const mother = {
      name: admission.display_patient_name || admission.patient_name || '',
      age: admission.patient_age || '',
      address: admission.patient_address || '',
      gravida: dd.gravida || '',
      para: dd.para || ''
    };
    const baby = {
      birth_weight: admission.baby_weight_kg || '',
      apgar_1min: admission.apgar1 || '',
      apgar_5min: admission.apgar5 || '',
      full_name: dd.baby_details?.full_name || '',
      gender: dd.baby_details?.gender || '',
      general_condition: dd.baby_details?.general_condition || '',
      eye_prophylaxis: dd.baby_details?.eye_prophylaxis || '',
      injuries: dd.baby_details?.injuries || '',
      birth_length_cm: dd.baby_details?.birth_length_cm || '',
      head_circumference: dd.baby_details?.head_circumference || '',
      chest: dd.baby_details?.chest || '',
      abdomen: dd.baby_details?.abdomen || '',
      heart_rate: dd.baby_details?.heart_rate || '',
      respiratory_rate: dd.baby_details?.respiratory_rate || '',
      temperature: dd.baby_details?.temperature || ''
    };
    const adm = {
      ...admission,
      attending_midwife: dd.attending_midwife || admission.attending_midwife,
      fluid_character: dd.fluid_character || admission.fluid_character,
      fully_dilated_at: dd.fully_dilated_at || admission.fully_dilated_at,
      placenta: dd.placenta || admission.placenta,
      placenta_delivered_at: dd.placenta_delivered_at || admission.placenta_delivered_at,
      repair: dd.repair || admission.repair,
      packing: dd.packing || admission.packing,
      remarks: dd.remarks || admission.remarks,
      bp_on_discharge: dd.bp_on_discharge || admission.bp_on_discharge,
      temperature: dd.temperature || admission.temperature
    };
    const html = generateDeliveryRoomRecordHTML(mother, baby, adm, logoUrl);
    const name = (mother.name || 'Delivery').replace(/\s+/g, '_');
    downloadHTMLAsPDF(html, `Delivery_Record_${name}_${admission.id}`);
  } catch {
    alert('Failed to generate Delivery PDF');
  }
};
