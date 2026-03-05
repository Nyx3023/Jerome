import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import { downloadHTMLAsPDF, generatePrenatalBookletHTML, generateAdmissionFormHTML, generateBirthPlanHTML, generateDeliveryRoomRecordHTML, generateNewbornAdmissionFormHTML, generateNewbornDischargeSummaryHTML, generateMotherDischargeSummaryHTML, generatePostpartumRecordHTML, generateClinicalLabReportsHTML, generateSingleLabTestHTML, generateSinglePostpartumAssessmentHTML } from '../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../utils/logoUtils';
import { ViewProcedureModal } from './modals/ProcedureViewModal';
import { ViewBabyModal } from './modals/BabyViewModal';
// Shared modals (work for both online and walk-in patients)
import {
  AddAdmissionModal as SharedAddAdmissionModal,
  EditAdmissionModal as SharedEditAdmissionModal,
  AddLabResultModal as SharedAddLabResultModal,
  ViewLabResultModal as SharedViewLabResultModal,
  EditLabResultModal as SharedEditLabResultModal,
  AddFamilyPlanningModal as SharedAddFamilyPlanningModal,
  ViewFamilyPlanningModal as SharedViewFamilyPlanningModal,
  EditFamilyPlanningModal as SharedEditFamilyPlanningModal,
  AddScreeningModal as SharedAddScreeningModal,
  ViewScreeningModal as SharedViewScreeningModal,
  EditScreeningModal as SharedEditScreeningModal,
  AddImmunizationModal as SharedAddImmunizationModal,
  ViewImmunizationModal as SharedViewImmunizationModal,
  EditImmunizationModal as SharedEditImmunizationModal,
  AddProcedureModal as SharedAddProcedureModal,
  EditProcedureModal as SharedEditProcedureModal
} from './modals';

// Helper function to get the correct API base path based on user role
const getApiBasePath = (operation = 'read') => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Doctors should use doctor endpoints for both read and write operations
  if (user.role === 'doctor') {
    return '/api/doctors';
  }

  // Admin/Staff default to admin endpoints
  return '/api/admin';
};

// Overview Tab Component
const OverviewTab = ({
  walkInData,
  profile,
  medicalRecords = [],
  admissions = [],
  babies = [],
  labResults = [],
  prenatalVisits = [],
  postpartumCare = [],
  familyPlanning = [],
  openModal
}) => {
  // Return loading state if walkInData is not available
  if (!walkInData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading patient information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              onClick={() => openModal('edit-patient-info')}
            >
              Edit Profile
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Full Name:</span>
              <p className="font-medium">{walkInData.patient_name || 'Not provided'}</p>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 text-sm">Age:</span>
                <p className="font-medium">{profile?.age || walkInData.age || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Gender:</span>
                <p className="font-medium capitalize">{profile?.gender || walkInData.gender || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Date of Birth:</span>
              <p className="font-medium">{profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Place of Birth:</span>
              <p className="font-medium">{profile?.place_of_birth || 'Not provided'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 text-sm">Civil Status:</span>
                <p className="font-medium capitalize">{profile?.civil_status || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Religion:</span>
                <p className="font-medium">{profile?.religion || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Occupation:</span>
              <p className="font-medium">{profile?.occupation || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Phone:</span>
              <p className="font-medium">{walkInData.contact_number || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Email:</span>
              <p className="font-medium">{profile?.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Address:</span>
              <p className="font-medium">{profile?.address || walkInData.address || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Obstetric History - Highlighted Section */}
      {(walkInData.gravida || walkInData.para || walkInData.lmp || walkInData.edd || profile?.gravida || profile?.para || profile?.lmp || profile?.edd) && (
        <div className="bg-pink-50 p-6 rounded-lg shadow border-2 border-pink-200">
          <h3 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
            🤰 Current Pregnancy & Obstetric History
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(walkInData.gravida || profile?.gravida) && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Gravida</div>
                <div className="text-2xl font-bold text-pink-600">G{walkInData.gravida || profile?.gravida}</div>
              </div>
            )}
            {(walkInData.para || profile?.para) && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Para</div>
                <div className="text-2xl font-bold text-pink-600">P{walkInData.para || profile?.para}</div>
              </div>
            )}
            {(walkInData.lmp || profile?.lmp) && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">LMP</div>
                <div className="font-semibold text-pink-800">{new Date(walkInData.lmp || profile?.lmp).toLocaleDateString()}</div>
              </div>
            )}
            {(walkInData.edd || profile?.edd) && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Expected Delivery Date (EDD) 👶</div>
                <div className="font-semibold text-pink-800">{new Date(walkInData.edd || profile?.edd).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partner/Husband Information */}
      {(profile?.partner_name || profile?.partner_age || profile?.partner_occupation || profile?.partner_religion) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Partner/Husband Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Name:</span>
              <p className="font-medium">{profile.partner_name || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Age:</span>
              <p className="font-medium">{profile.partner_age || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Occupation:</span>
              <p className="font-medium">{profile.partner_occupation || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Religion:</span>
              <p className="font-medium">{profile.partner_religion || 'Not provided'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Medical Alerts & Emergency Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medical Alerts */}
        <div className="bg-red-50 p-6 rounded-lg shadow border-2 border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
            ⚠️ Medical Alerts
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-700 text-sm font-medium">Blood Type:</span>
              <p className="font-bold text-red-900 text-lg">{profile?.blood_type || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-700 text-sm font-medium">Allergies:</span>
              <p className="font-medium text-red-900">{profile?.allergies || 'None reported'}</p>
            </div>
            {profile?.is_high_risk && (
              <div className="bg-red-100 p-3 rounded border border-red-300">
                <span className="text-red-800 font-bold">⚠️ HIGH RISK PREGNANCY</span>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Emergency Contact</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Name:</span>
              <p className="font-medium">{profile?.emergency_contact_name || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Phone:</span>
              <p className="font-medium">{profile?.emergency_contact_phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Relationship:</span>
              <p className="font-medium">{profile?.emergency_contact_relationship || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{medicalRecords.length}</div>
          <div className="text-sm text-blue-800">Medical Records</div>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-pink-600">{prenatalVisits.length}</div>
          <div className="text-sm text-pink-800">Prenatal Visits</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{babies.length}</div>
          <div className="text-sm text-green-800">Baby Records</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{labResults.length}</div>
          <div className="text-sm text-purple-800">Lab Results</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{postpartumCare.length}</div>
          <div className="text-sm text-yellow-800">Postpartum Care</div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-indigo-600">{familyPlanning.length}</div>
          <div className="text-sm text-indigo-800">Family Planning</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{admissions.length}</div>
          <div className="text-sm text-red-800">Admissions</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-600">
            {medicalRecords.length + prenatalVisits.length + babies.length + labResults.length + postpartumCare.length + familyPlanning.length + admissions.length}
          </div>
          <div className="text-sm text-gray-800">Total Records</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {medicalRecords.slice(0, 3).map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{record.service_type}</div>
                <div className="text-sm text-gray-600">
                  {new Date(record.visit_date).toLocaleDateString()}
                </div>
              </div>
              <span className="text-sm text-blue-600">Medical Record</span>
            </div>
          ))}
          {medicalRecords.length === 0 && (
            <div className="text-gray-500 text-center py-4">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Findings Tab Component
const FindingsTab = ({ records, openModal }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Medical Records</h3>
      </div>

      {records.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No medical records found</div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => openModal('medical-record', record)}>
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{record.service_type || 'General Consultation'}</div>
                  <div className="text-sm text-gray-600">
                    Date: {new Date(record.appointment_date).toLocaleDateString()}
                  </div>
                  {record.chief_complaint && (
                    <div className="text-sm">Chief Complaint: {record.chief_complaint}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {record.time_slot}
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


// Edit Procedure Modal
const EditProcedureModal = ({ procedure, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    procedure_type: procedure.procedure_type || '',
    date_performed: procedure.date_performed ? new Date(procedure.date_performed).toISOString().split('T')[0] : '',
    status: procedure.status || 'scheduled',
    healthcare_provider: procedure.healthcare_provider || '',
    location: procedure.location || '',
    duration_minutes: procedure.duration_minutes || '',
    anesthesia_type: procedure.anesthesia_type || '',
    complications: procedure.complications || '',
    outcome: procedure.outcome || '',
    follow_up_required: !!procedure.follow_up_required,
    next_appointment: procedure.next_appointment ? new Date(procedure.next_appointment).toISOString().split('T')[0] : '',
    notes: procedure.notes || '',
    cost: procedure.cost || '',
    insurance_covered: !!procedure.insurance_covered
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        procedure_type: formData.procedure_type,
        date_performed: formData.date_performed,
        status: formData.status,
        surgeon: formData.healthcare_provider,
        location: formData.location,
        duration_minutes: formData.duration_minutes,
        anesthesia_type: formData.anesthesia_type,
        complications: formData.complications,
        outcome: formData.outcome,
        follow_up_required: formData.follow_up_required,
        next_appointment: formData.next_appointment,
        notes: formData.notes,
        cost: formData.cost,
        insurance_covered: formData.insurance_covered
      };
      // Use role-based endpoint for procedure updates
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const basePath = user.role === 'doctor' ? '/api/doctors' : '/api/admin';
      await axios.put(`${basePath}/walkin/procedures/${procedure.id}`, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating procedure:', error);
      alert('Failed to update procedure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Medical Procedure</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Procedure Type</label>
            <select
              value={formData.procedure_type}
              onChange={(e) => setFormData({ ...formData, procedure_type: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select Procedure Type</option>
              <option value="IUD Insertion">IUD Insertion</option>
              <option value="IUD Removal">IUD Removal</option>
              <option value="Injectable (DMPA)">Injectable (DMPA)</option>
              <option value="Contraceptive Implant">Contraceptive Implant</option>
              <option value="Implant Insertion">Implant Insertion</option>
              <option value="Implant Removal">Implant Removal</option>
              <option value="Tubal Ligation">Tubal Ligation</option>
              <option value="Vasectomy">Vasectomy</option>
              <option value="Cervical Biopsy">Cervical Biopsy</option>
              <option value="Endometrial Biopsy">Endometrial Biopsy</option>
              <option value="LEEP Procedure">LEEP Procedure</option>
              <option value="Cone Biopsy">Cone Biopsy</option>
              <option value="Colposcopy">Colposcopy</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Performed</label>
            <input
              type="date"
              value={formData.date_performed}
              onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Healthcare Provider</label>
            <input
              type="text"
              value={formData.healthcare_provider}
              onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Provider name"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Procedure location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Duration in minutes"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Anesthesia Type</label>
            <select
              value={formData.anesthesia_type}
              onChange={(e) => setFormData({ ...formData, anesthesia_type: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select Anesthesia</option>
              <option value="None">None</option>
              <option value="Local">Local</option>
              <option value="Regional">Regional</option>
              <option value="General">General</option>
              <option value="Sedation">Sedation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cost</label>
            <input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Procedure cost"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Outcome</label>
          <input
            type="text"
            value={formData.outcome}
            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Procedure outcome"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Complications</label>
          <textarea
            value={formData.complications}
            onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows="2"
            placeholder="Any complications during procedure"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.follow_up_required}
              onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Follow-up Required</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.insurance_covered}
              onChange={(e) => setFormData({ ...formData, insurance_covered: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Insurance Covered</label>
          </div>
        </div>
        {formData.follow_up_required && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Next Appointment</label>
            <input
              type="date"
              value={formData.next_appointment}
              onChange={(e) => setFormData({ ...formData, next_appointment: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows="3"
            placeholder="Additional notes or observations"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Modal Components for managing patient data
const AdmissionsTab = ({ admissions, walkInName, walkInContact, reload, openModal }) => {
  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role || '';
    } catch {
      return '';
    }
  };

  const userRole = getUserRole();
  const canManageAdmissions = ['admin', 'staff', 'doctor', 'midwife'].includes(userRole);

  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const statuses = Array.from(new Set((admissions || []).map(a => a.status).filter(Boolean)));
  const filteredAdmissions = (admissions || []).filter(a => {
    const statusOk = selectedStatus === '__all__' ? true : String(a.status) === String(selectedStatus);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = a.admission_date || a.admitted_at;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return statusOk && monthOk;
  });

  const handleEditAdmission = (admission) => {
    openModal('edit-admission', admission);
  };

  const handleDeleteAdmission = async (admissionId) => {
    if (window.confirm('Are you sure you want to delete this admission record?')) {
      try {
        await axios.delete(`/api/admin/admissions/${admissionId}`);
        reload();
      } catch (error) {
        console.error('Error deleting admission:', error);
        alert('Failed to delete admission record');
      }
    }
  };

  const handleDischargeAdmission = (admission) => {
    openModal('discharge-admission', admission);
  };

  const handlePrintMotherDischargeSummary = async (admission) => {
    try {
      let patientData = {};
      let prenatalData = {};
      if (admission.patient_type === 'registered' && admission.user_id) {
        const p = await axios.get(`/api/admin/patient-profile/${admission.user_id}`);
        const profile = p.data || {};
        patientData = {
          first_name: profile.first_name || '',
          middle_name: profile.middle_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          age: profile.age || '',
          address: profile.address || '',
          gender: profile.gender || ''
        };
        if (profile.id) {
          const pn = await axios.get(`/api/clinic/prenatal-schedule/${profile.id}`);
          const visits = pn.data || [];
          const latest = visits.length ? visits[visits.length - 1] : null;
          if (latest) prenatalData = { aog: latest.gestational_age || 'N/A' };
        }
      } else {
        const fullName = (walkInName || admission.patient_name || '').trim();
        const parts = fullName.split(/\s+/);
        const first = parts[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1] : '';
        patientData = {
          first_name: first,
          last_name: last,
          phone: walkInContact || admission.contact_number || ''
        };
        const pn = await axios.get(`/api/admin/walkin/prenatal`, {
          params: { patient_name: fullName, contact_number: walkInContact || admission.contact_number || '' }
        });
        const visits = pn.data || [];
        const latest = Array.isArray(visits) && visits.length ? visits[0] : null;
        if (latest) prenatalData = { aog: latest.gestational_age || 'N/A' };
        const mr = await axios.get(`/api/admin/medical-records/walkin`, { params: { patient_name: fullName, contact_number: walkInContact || admission.contact_number || '' } });
        const records = mr.data || [];
        const latestRecord = Array.isArray(records) && records.length ? records[0] : null;
        if (latestRecord && latestRecord.vital_signs) {
          prenatalData = {
            ...prenatalData,
            gestational_age: latestRecord.vital_signs.gestational_age || prenatalData.aog,
            aog: latestRecord.vital_signs.gestational_age || prenatalData.aog,
            gravida: latestRecord.vital_signs.gravida,
            para: latestRecord.vital_signs.para
          };
        }
      }
      const logoUrl = await resolveLogoUrl();
      let dd = {};
      try {
        if (admission.notes) {
          const n = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
          dd = n && n.delivery_details ? n.delivery_details : {};
        }
      } catch { }
      const prenatalMerged = {
        ...prenatalData,
        gravida: dd.gravida || prenatalData.gravida || '',
        para: dd.para || prenatalData.para || '',
        aog: prenatalData.aog || admission.pregnancy_cycle || ''
      };
      const html = generateMotherDischargeSummaryHTML(patientData, admission, prenatalMerged, logoUrl);
      const filename = `Mother_Discharge_${(admission.patient_name || walkInName || 'Patient').replace(/\s+/g, '_')}_${admission.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error(e);
      alert('Failed to generate discharge summary');
    }
  };

  const handlePrintAdmissionForm = async (admission) => {
    try {
      const fullName = walkInName || (admission.patient_name || '').trim();
      const contact = walkInContact || admission.contact_number || '';
      const parts = fullName.split(/\s+/);
      const first = parts[0] || '';
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      let patientData = { first_name: first, last_name: last, phone: contact };
      let prenatalData = {};
      const profResp = await axios.get('/api/admin/walkin/patient-profile', { params: { patient_name: fullName, contact_number: contact } });
      const prof = profResp.data || {};
      if (prof && (prof.first_name || prof.last_name)) {
        patientData = {
          first_name: prof.first_name || first,
          middle_name: prof.middle_name || '',
          last_name: prof.last_name || last,
          phone: prof.phone || contact,
          age: prof.age || '',
          address: prof.address || '',
          gender: prof.gender || '',
          civil_status: prof.civil_status || '',
          religion: prof.religion || '',
          occupation: prof.occupation || '',
          place_of_birth: prof.place_of_birth || '',
          date_of_birth: prof.date_of_birth || '',
          partner_name: prof.partner_name || '',
          partner_age: prof.partner_age || '',
          partner_occupation: prof.partner_occupation || '',
          partner_religion: prof.partner_religion || '',
          lmp: prof.lmp || null,
          edd: prof.edd || null
        };
      }
      const pn = await axios.get('/api/admin/walkin/prenatal', { params: { patient_name: fullName, contact_number: contact } });
      const visits = pn.data || [];
      const latestVisit = Array.isArray(visits) && visits.length ? visits[0] : null;
      if (latestVisit) {
        prenatalData = { aog: latestVisit.gestational_age || 'N/A' };
        const v = {
          blood_pressure: latestVisit.blood_pressure,
          heart_rate: latestVisit.maternal_heart_rate,
          respiratory_rate: latestVisit.respiratory_rate,
          temperature: latestVisit.temperature_c,
          weight: latestVisit.weight,
          fetal_heart_rate: latestVisit.fetal_heart_rate,
          fundal_height_cm: latestVisit.fundal_height
        };
        if (v.blood_pressure || v.heart_rate || v.respiratory_rate || v.temperature || v.weight || v.fetal_heart_rate || v.fundal_height_cm) {
          prenatalData.vitals = v;
        }
      }
      const mr = await axios.get('/api/admin/medical-records/walkin', { params: { patient_name: fullName, contact_number: contact } });
      const records = mr.data || [];
      const latestRecord = Array.isArray(records) && records.length ? records[0] : null;
      if (latestRecord && latestRecord.vital_signs) {
        prenatalData = {
          ...prenatalData,
          gestational_age: latestRecord.vital_signs.gestational_age || prenatalData.aog,
          aog: latestRecord.vital_signs.gestational_age || prenatalData.aog,
          gravida: latestRecord.vital_signs.gravida,
          para: latestRecord.vital_signs.para,
          lmp: latestRecord.vital_signs.lmp || patientData.lmp,
          edd: latestRecord.vital_signs.edd || patientData.edd,
          vitals: {
            blood_pressure: latestRecord.vital_signs.blood_pressure,
            heart_rate: latestRecord.vital_signs.heart_rate,
            respiratory_rate: latestRecord.vital_signs.respiratory_rate,
            temperature: latestRecord.vital_signs.temperature,
            weight: latestRecord.vital_signs.weight
          }
        };
      }
      const logoUrl = await resolveLogoUrl();
      const html = generateAdmissionFormHTML(admission, patientData, prenatalData, logoUrl);
      const filename = `Admission_Form_${(fullName || 'WalkIn').replace(/\s+/g, '_')}_${admission.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error(e);
      alert('Failed to generate admission form');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Hospital Admissions</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          {canManageAdmissions && (
            <button
              className="px-3 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={() => openModal('add-admission')}
              title="Add a new admission"
            >
              Add Admission
            </button>
          )}
        </div>
      </div>

      {filteredAdmissions.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No admissions found</div>
      ) : (
        <div className="space-y-3">
          {filteredAdmissions.map((admission) => (
            <div key={admission.id} className="p-4 border rounded hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold">Admission #{admission.id}</div>
                    <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">
                      Walk-in Patient
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    {/* Patient Information */}
                    <div className="space-y-1">
                      <div className="font-medium text-gray-800">Patient Information:</div>
                      <div>Name: {walkInName}</div>
                      <div>Contact: {walkInContact}</div>
                    </div>

                    {/* Admission Details */}
                    <div className="space-y-1">
                      <div className="font-medium text-gray-800">Admission Details:</div>
                      <div>Admitted: {admission.admission_date && new Date(admission.admission_date).toLocaleString()}</div>
                      <div>Room: {admission.room || 'Not assigned'}</div>
                      <div>Reason: {admission.admission_reason}</div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  {(admission.delivery_type || admission.outcome || admission.complications) && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="font-medium text-gray-800">Medical Information:</div>
                      {admission.delivery_type && <div>Delivery Type: {admission.delivery_type}</div>}
                      {admission.outcome && <div>Outcome: {admission.outcome}</div>}
                      {admission.baby_weight_kg && <div>Baby Weight: {admission.baby_weight_kg} kg</div>}
                      {admission.apgar1 && <div>APGAR 1 min: {admission.apgar1}</div>}
                      {admission.apgar5 && <div>APGAR 5 min: {admission.apgar5}</div>}
                      {admission.complications && <div>Complications: {admission.complications}</div>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded text-sm ${admission.status === 'discharged' ? 'bg-green-100 text-green-800' :
                    admission.status === 'admitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {admission.status}
                  </span>

                  {canManageAdmissions && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('admission-view', admission);
                        }}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="View"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handlePrintAdmissionForm(admission)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="Print Admission Form"
                      >
                        Print Form
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('add-baby', {
                            prefill: {
                              birth_date: admission.baby_birth_date || (admission.admission_date ? String(admission.admission_date).slice(0, 10) : ''),
                              birth_time: admission.baby_birth_time || '',
                              birth_weight: admission.baby_weight_kg || '',
                              birth_length: admission.baby_length_cm || '',
                              head_circumference: admission.baby_head_circumference_cm || '',
                              apgar_score: [admission.apgar1, admission.apgar5].filter(Boolean).join('/') || '',
                              delivery_type: admission.delivery_type || ''
                            }
                          });
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        title="Create Baby Record"
                      >
                        Create Baby
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('add-medication-admin', { prefill_admission_id: admission.id });
                        }}
                        className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                        title="Add Medication Administration"
                      >
                        Add Medication
                      </button>

                      <button
                        onClick={() => handleEditAdmission(admission)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handlePrintMotherDischargeSummary(admission)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Print Maternal Discharge Summary"
                      >
                        Discharge PDF
                      </button>

                      {admission.status === 'admitted' && (
                        <button
                          onClick={() => handleDischargeAdmission(admission)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Discharge"
                        >
                          Discharge
                        </button>
                      )}

                      {admission.status !== 'discharged' && (
                        <button
                          onClick={() => handleDeleteAdmission(admission.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Delete"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Prenatal Tab Component (mirrored from Online)
const PrenatalTab = ({ visits, admissions = [], walkInId, walkInName, walkInContact, reload, openModal }) => {
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('__all__');
  const handlePrintBooklet = () => {
    try {
      const name = walkInName || (String(walkInId || '').split('_')[0] || '');
      const phone = walkInContact || (String(walkInId || '').split('_')[1] || '');
      const mapped = (visits || []).map((visit, index) => ({
        visit_number: index + 1,
        scheduled_date: visit.visit_date || visit.scheduled_date || null,
        gestational_age: visit.gestational_age || '',
        weight_kg: typeof visit.weight !== 'undefined' ? visit.weight : visit.weight_kg ?? null,
        blood_pressure: visit.blood_pressure || '',
        fundal_height_cm: typeof visit.fundal_height !== 'undefined' ? visit.fundal_height : visit.fundal_height_cm ?? null,
        fetal_heart_rate: typeof visit.fetal_heart_rate !== 'undefined' ? visit.fetal_heart_rate : null,
        complaints: visit.complaints || '',
        assessment: visit.assessment || visit.notes || '',
        plan: visit.plan || '',
        next_visit_date: visit.next_visit_date || null,
        trimester: (() => {
          const ga = parseInt(visit.gestational_age, 10);
          if (isNaN(ga)) return '';
          if (ga <= 12) return 1;
          if (ga <= 27) return 2;
          return 3;
        })()
      }));
      const params = new URLSearchParams({ patient_name: name, contact_number: phone });
      axios.get(`/api/admin/walkin/patient-profile?${params.toString()}`)
        .then((resp) => {
          const prof = resp.data || {};
          const html = generatePrenatalBookletHTML({ name, phone, lmp: prof.lmp || null, edd: prof.edd || null, gravida: prof.gravida, para: prof.para }, mapped);
          downloadHTMLAsPDF(html, `Prenatal_Booklet_${name || 'WalkIn'}`);
        })
        .catch(() => {
          const html = generatePrenatalBookletHTML({ name, phone }, mapped);
          downloadHTMLAsPDF(html, `Prenatal_Booklet_${name || 'WalkIn'}`);
        });
    } catch (e) {
      alert('Failed to generate booklet');
    }
  };

  const admissionFilteredVisits = (visits || []).filter(v => {
    if (!selectedAdmissionId || selectedAdmissionId === '__all__') return true;
    if (selectedAdmissionId === '__none__') return true;
    const adm = (admissions || []).find(a => String(a.id) === String(selectedAdmissionId)) || {};
    const pivot = adm.baby_birth_date || adm.admitted_at || adm.admission_date;
    if (!pivot) return true;
    const dt = v.scheduled_date || v.visit_date;
    if (!dt) return false;
    return new Date(dt) <= new Date(pivot);
  });
  const groups = React.useMemo(() => {
    const map = new Map();
    (admissionFilteredVisits || []).forEach((v) => {
      const id = v.pregnancy_id == null ? '__none__' : String(v.pregnancy_id);
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(v);
    });
    const list = Array.from(map.entries()).map(([id, items]) => {
      const latest = items.map(v => v.scheduled_date || v.visit_date).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
      const label = id === '__none__' ? 'Unassigned' : `Cycle ${id}`;
      return { id, label, latest, items };
    }).sort((a, b) => new Date(b.latest || 0) - new Date(a.latest || 0));
    return list;
  }, [admissionFilteredVisits]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Prenatal Visit Schedule</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            onClick={() => {
              const ids = Array.from(new Set((visits || []).map(v => v.pregnancy_id).filter(id => id != null))).map(Number).filter(n => !Number.isNaN(n));
              const nextId = (ids.length ? Math.max(...ids) : 0) + 1;
              openModal('add-prenatal', { pregnancy_id: nextId });
            }}
          >
            Start New Cycle
          </button>
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            onClick={() => openModal('order-prenatal-labs')}
          >
            Order Prenatal Labs
          </button>
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm"
            onClick={handlePrintBooklet}
          >
            Print Prenatal Booklet
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <label className="text-sm text-gray-600">Cycle</label>
        <select
          className="px-3 py-2 border rounded"
          value={selectedAdmissionId}
          onChange={(e) => setSelectedAdmissionId(e.target.value)}
          title="Select cycle by admission"
        >
          <option value="__all__">All admissions</option>
          <option value="__none__">Unassigned</option>
          {(admissions || []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.admitted_at ? `Admission ${a.id} (${new Date(a.admitted_at).toLocaleDateString()})` : `Admission ${a.id}`}
            </option>
          ))}
        </select>
        <button className="px-3 py-2 border rounded" onClick={() => setSelectedAdmissionId('__all__')}>Clear</button>
      </div>

      {groups.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No prenatal visits scheduled</div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="text-xl font-semibold mb-3">Present prenatal cycle</div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">{groups[0].label}</div>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => openModal('add-prenatal', { pregnancy_id: groups[0].id === '__none__' ? null : groups[0].id })}
              >
                Schedule Visit
              </button>
            </div>
            <div className="space-y-3">
              {groups[0].items.map((visit) => (
                <div key={visit.id} className="p-4 border rounded hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{visit.visit_number ? `Visit #${visit.visit_number}` : 'Visit'}</div>
                      <div className="text-sm text-gray-600">
                        Scheduled: {new Date(visit.scheduled_date || visit.visit_date).toLocaleDateString()}
                      </div>
                      {visit.gestational_age && (
                        <div className="text-sm">GA: {visit.gestational_age}</div>
                      )}
                      {visit.blood_pressure && (
                        <div className="text-sm">BP: {visit.blood_pressure}</div>
                      )}
                      {visit.weight_kg && (
                        <div className="text-sm">Weight: {visit.weight_kg} kg</div>
                      )}
                      {visit.fundal_height_cm && (
                        <div className="text-sm">Fundal Height: {visit.fundal_height_cm} cm</div>
                      )}
                      {visit.fetal_heart_rate && (
                        <div className="text-sm">FHR: {visit.fetal_heart_rate} bpm</div>
                      )}
                      {visit.notes && (
                        <div className="text-sm text-gray-600 mt-1">Notes: {visit.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded text-sm ${visit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {visit.status || 'scheduled'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal('prenatal-visit', visit)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openModal('edit-prenatal', visit)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Edit Visit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openModal('delete-prenatal', visit)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Delete Visit"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {groups.length > 1 && (
            <div>
              <div className="text-xl font-semibold mb-3">The past prenatal cycle</div>
              <div className="space-y-6">
                {groups.slice(1).map((g) => (
                  <div key={g.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">{g.label}</div>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => openModal('add-prenatal', { pregnancy_id: g.id === '__none__' ? null : g.id })}
                      >
                        Schedule Visit
                      </button>
                    </div>
                    <div className="space-y-3">
                      {g.items.map((visit) => (
                        <div key={visit.id} className="p-4 border rounded hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold">{visit.visit_number ? `Visit #${visit.visit_number}` : 'Visit'}</div>
                              <div className="text-sm text-gray-600">
                                Scheduled: {new Date(visit.scheduled_date || visit.visit_date).toLocaleDateString()}
                              </div>
                              {visit.gestational_age && (
                                <div className="text-sm">GA: {visit.gestational_age}</div>
                              )}
                              {visit.blood_pressure && (
                                <div className="text-sm">BP: {visit.blood_pressure}</div>
                              )}
                              {visit.weight_kg && (
                                <div className="text-sm">Weight: {visit.weight_kg} kg</div>
                              )}
                              {visit.fundal_height_cm && (
                                <div className="text-sm">Fundal Height: {visit.fundal_height_cm} cm</div>
                              )}
                              {visit.fetal_heart_rate && (
                                <div className="text-sm">FHR: {visit.fetal_heart_rate} bpm</div>
                              )}
                              {visit.notes && (
                                <div className="text-sm text-gray-600 mt-1">Notes: {visit.notes}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded text-sm ${visit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {visit.status || 'scheduled'}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openModal('prenatal-visit', visit)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  title="View Details"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => openModal('edit-prenatal', visit)}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  title="Edit Visit"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => openModal('delete-prenatal', visit)}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  title="Delete Visit"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

// Postpartum Tab Component
const PostpartumTab = ({ care, admissions = [], walkInId, reload, openModal }) => {
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const admissionIds = Array.from(new Set((care || []).map(c => c.admission_id).filter(id => id !== null)));
  const filteredCareByAdmission = (care || []).filter(c => {
    if (selectedAdmissionId === '__all__') return true;
    if (selectedAdmissionId === '__none__') return c.admission_id == null;
    return String(c.admission_id) === String(selectedAdmissionId);
  });
  const filteredCare = filteredCareByAdmission.filter((c) => {
    if (!selectedMonth) return true;
    const dt = c.assessment_date;
    if (!dt) return false;
    const d = new Date(dt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return key === selectedMonth;
  });
  const sortedCare = [...filteredCare].sort((a, b) => {
    const ad = a.assessment_date ? new Date(a.assessment_date).getTime() : 0;
    const bd = b.assessment_date ? new Date(b.assessment_date).getTime() : 0;
    return bd - ad;
  });

  const handlePrintSinglePostpartum = async (assessment) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = {};
      try {
        const p = await axios.get(`/api/admin/patient-profile/${walkInId}`);
        const prof = p.data || {};
        patient = { first_name: prof.first_name || '', middle_name: prof.middle_name || '', last_name: prof.last_name || '' };
        patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
      } catch { }
      if (!patient.full_name) {
        const parts = String(walkInId || '').split('_');
        patient.full_name = parts[0] || 'Walk-in Patient';
      }
      const html = generateSinglePostpartumAssessmentHTML(patient, assessment, logoUrl);
      const filename = `Postpartum_Assessment_${(patient.full_name || 'Patient').replace(/\s+/g, '_')}_${(assessment.assessment_date ? new Date(assessment.assessment_date).toISOString().split('T')[0] : 'Date')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate Postpartum Assessment PDF');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Postpartum Care</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="px-3 py-2 border rounded"
            value={selectedAdmissionId}
            onChange={(e) => setSelectedAdmissionId(e.target.value)}
            title="Filter by admission"
          >
            <option value="__all__">All admissions</option>
            <option value="__none__">Unassigned</option>
            {admissionIds.map((id) => {
              const adm = (admissions || []).find(a => String(a.id) === String(id));
              const label = adm && adm.admitted_at ? `Admission ${id} (${new Date(adm.admitted_at).toLocaleDateString()})` : `Admission ${id}`;
              return <option key={id} value={id}>{label}</option>;
            })}
          </select>
          <input
            type="month"
            className="px-3 py-2 border rounded"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
            onClick={() => openModal('add-postpartum', { admissionId: selectedAdmissionId === '__all__' || selectedAdmissionId === '__none__' ? null : selectedAdmissionId })}
          >
            Add Assessment
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={async () => {
              try {
                const base = window.location.origin;
                const logoUrl = await resolveLogoUrl();
                let patient = {};
                try {
                  const p = await axios.get(`/api/admin/patient-profile/${walkInId}`);
                  const prof = p.data || {};
                  patient = { first_name: prof.first_name || '', middle_name: prof.middle_name || '', last_name: prof.last_name || '' };
                  patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
                } catch { }
                let delivery = {};
                try {
                  const a = await axios.get(`/api/admin/admissions/patient/${walkInId}`);
                  const rows = a.data || [];
                  const latest = rows.length ? rows[rows.length - 1] : {};
                  delivery = { baby_birth_date: latest.baby_birth_date || '', admitted_at: latest.admitted_at || '' };
                } catch { }
                const within24h = care.find(c => Number(c.day_postpartum) <= 1) || care[0] || {};
                const within7d = care.find(c => Number(c.day_postpartum) > 1 && Number(c.day_postpartum) <= 7) || (care.length > 1 ? care[1] : {});
                if (!within24h.family_planning_method || !within7d.family_planning_method) {
                  try {
                    const fp = await axios.get(`/api/clinic/family-planning/${walkInId}`);
                    const list = fp.data || [];
                    const latestFp = list[0] || {};
                    const method = latestFp.method_chosen || '';
                    if (!within24h.family_planning_method) within24h.family_planning_method = method;
                    if (!within7d.family_planning_method) within7d.family_planning_method = method;
                  } catch { }
                }
                const html = generatePostpartumRecordHTML(patient, delivery, within24h, within7d, logoUrl);
                const filename = `Postpartum_Record_${(patient.full_name || 'Patient').replace(/\s+/g, '_')}`;
                downloadHTMLAsPDF(html, filename);
              } catch (e) {
                console.error(e);
                alert('Failed to generate Postpartum Record');
              }
            }}
            title="Print Postpartum Record"
          >
            Postpartum PDF
          </button>
        </div>
      </div>

      {sortedCare.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No postpartum assessments found</div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Present postpartum cycle</div>
            {(() => {
              const assessment = sortedCare[0];
              return (
                <div className="p-4 border rounded hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div className="cursor-pointer flex-1" onClick={() => openModal('postpartum-assessment', assessment)}>
                      <div className="font-semibold">Day {assessment.day_postpartum ?? assessment.days_postpartum} Postpartum</div>
                      <div className="text-sm text-gray-600">{new Date(assessment.assessment_date).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal('postpartum-assessment', assessment); }}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrintSinglePostpartum(assessment); }}
                        className="px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700"
                      >
                        Print
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal('edit-postpartum', assessment); }}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal('delete-postpartum', assessment); }}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          {sortedCare.length > 1 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Previous cycles</div>
              <div className="space-y-3">
                {sortedCare.slice(1).map((assessment, idx) => (
                  <div key={idx} className="p-4 border rounded hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div className="cursor-pointer flex-1" onClick={() => openModal('postpartum-assessment', assessment)}>
                        <div className="font-semibold">Day {assessment.day_postpartum ?? assessment.days_postpartum} Postpartum</div>
                        <div className="text-sm text-gray-600">{new Date(assessment.assessment_date).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal('postpartum-assessment', assessment); }}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrintSinglePostpartum(assessment); }}
                          className="px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700"
                        >
                          Print
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal('edit-postpartum', assessment); }}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal('delete-postpartum', assessment); }}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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

// Duplicate FamilyPlanningTab component removed

const WalkInPatientEnhanced = ({ name, contact }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [records, setRecords] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [babies, setBabies] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [prenatalVisits, setPrenatalVisits] = useState([]);
  const [postpartumCare, setPostpartumCare] = useState([]);
  const [familyPlanning, setFamilyPlanning] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [immunizations, setImmunizations] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [birthPlan, setBirthPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walkInProfile, setWalkInProfile] = useState({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState({});

  // Selected items for edit/delete
  const [selectedPrenatal, setSelectedPrenatal] = useState(null);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [selectedPostpartum, setSelectedPostpartum] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [selectedFamilyPlanning, setSelectedFamilyPlanning] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  useEffect(() => {
    loadWalkInData();
  }, [name, contact]);

  const loadWalkInData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      console.log('Authentication check:', {
        hasToken: !!token,
        userRole: user.role,
        fullUser: user
      });

      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      if (!['admin', 'staff', 'doctor'].includes(user.role)) {
        setError('Insufficient permissions. Staff access required.');
        return;
      }

      // Test authentication with a simple API call first
      try {
        await axios.get(`${getApiBasePath('read')}/patients`);
        console.log('Authentication test passed');
      } catch (authError) {
        console.error('Authentication test failed:', authError);
        if (authError.response?.status === 401) {
          setError('Session expired. Please log in again.');
          return;
        } else if (authError.response?.status === 403) {
          setError('Access denied. Please check your permissions.');
          return;
        }
      }

      // Load walk-in medical records
      const response = await axios.get(`${getApiBasePath('read')}/medical-records/walkin`, {
        params: { patient_name: name, contact_number: contact }
      });

      setRecords(response.data || []);

      // Load admissions for walk-in patients (independent of medical records)
      const apiBase = getApiBasePath('read');
      try {
        const admissionsResponse = await axios.get(`${apiBase}/admissions?patient_name=${encodeURIComponent(name)}&contact_number=${encodeURIComponent(contact)}`);
        setAdmissions(admissionsResponse.data || []);
      } catch (err) {
        console.error('Error loading admissions:', err);
        setAdmissions([]);
      }

      // Load additional data for walk-in patients using patient_name and contact_number
      const [b, l, p, po, f, s, pr, i] = await Promise.all([
        axios.get(`${apiBase}/walkin/babies`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading babies:', err);
          return { data: [] };
        }),
        axios.get(`${apiBase}/walkin/lab-results`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading lab results:', err);
          return { data: [] };
        }),
        axios.get(`${apiBase}/walkin/prenatal`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading prenatal visits:', err);
          return { data: [] };
        }),
        axios.get(`${apiBase}/walkin/postpartum`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading postpartum care:', err);
          return { data: [] };
        }),
        axios.get(`${apiBase}/walkin/family-planning`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading family planning:', err);
          return { data: [] };
        }),
        axios.get(`${apiBase}/walkin/screenings`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading screenings:', err);
          return { data: [] };
        }),
        axios.get(`${apiBase}/walkin/procedures`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading procedures:', err);
          return { data: [] };
        }),
        axios.get(`${apiBase}/walkin/immunizations`, {
          params: { patient_name: name, contact_number: contact }
        }).catch((err) => {
          console.error('Error loading immunizations:', err);
          return { data: [] };
        })
      ]);

      setBabies(b.data || []);
      setLabResults(l.data || []);
      setPrenatalVisits(p.data || []);
      setPostpartumCare(po.data || []);
      setFamilyPlanning(f.data || []);
      setScreenings(s.data || []);
      // Normalize procedure fields for consistent UI and edit/view modals
      setProcedures((pr.data || []).map(p => ({
        ...p,
        procedure_type: p.procedure_type || p.procedure_name || '',
        date_performed: p.date_performed || p.procedure_date || '',
        healthcare_provider: p.healthcare_provider || p.surgeon || '',
        next_appointment: p.next_appointment || p.follow_up_date || '',
      })));
      setImmunizations(i.data || []);
      setReferrals([]);
      setMedications([]);
      setBirthPlan(null);

      // Fetch patient profile to get LMP/EDD if available
      try {
        const profResp = await axios.get(`${apiBase}/walkin/patient-profile`, {
          params: { patient_name: name, contact_number: contact }
        });
        setWalkInProfile(profResp.data || {});
        const pid = profResp?.data?.id;
        if (pid) {
          const [refRes, medRes, bpRes] = await Promise.all([
            axios.get(`/api/clinic/referrals/${pid}`).catch((err) => {
              console.error('Error loading referrals:', err);
              return { data: [] };
            }),
            axios.get(`/api/clinic/medication-administration/${pid}`).catch((err) => {
              console.error('Error loading medications:', err);
              return { data: [] };
            }),
            axios.get(`/api/clinic/birth-plan/${pid}`).catch((err) => {
              console.error('Error loading birth plan:', err);
              return { data: null };
            }),
          ]);
          setReferrals(refRes.data || []);
          setMedications(medRes.data || []);
          setBirthPlan(bpRes.data || null);
        } else {
          setReferrals([]);
          setMedications([]);
          setBirthPlan(null);
        }
      } catch (profErr) {
        console.error('Error loading walk-in patient profile:', profErr);
        setWalkInProfile({});
      }

    } catch (error) {
      console.error('Error loading walk-in data:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else {
        setError('Failed to load patient data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);

    // Set selected items for edit/delete modals
    switch (type) {
      case 'edit-prenatal':
        setSelectedPrenatal(data);
        break;
      case 'delete-prenatal':
        setSelectedPrenatal(data);
        break;
      case 'edit-baby':
        setSelectedBaby(data);
        break;
      case 'delete-baby':
        setSelectedBaby(data);
        break;
      case 'edit-lab-result':
        setSelectedLabResult(data);
        break;
      case 'delete-lab-result':
        setSelectedLabResult(data);
        break;
      case 'edit-postpartum':
        setSelectedPostpartum(data);
        break;
      case 'delete-postpartum':
        setSelectedPostpartum(data);
        break;
      case 'edit-family-planning':
        setSelectedFamilyPlanning(data);
        break;
      case 'delete-family-planning':
        setSelectedFamilyPlanning(data);
        break;
      case 'edit-admission':
        setSelectedAdmission(data);
        break;
      case 'discharge-admission':
        setSelectedAdmission(data);
        break;
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setModalData({});
    // Reset selected items
    setSelectedPrenatal(null);
    setSelectedBaby(null);
    setSelectedLabResult(null);
    setSelectedPostpartum(null);
    setSelectedFamilyPlanning(null);
    setSelectedAdmission(null);
  };

  const handlePrintProcedure = async (procedure) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const patient = { name: name || '', contact: contact || '' };
      const dateStr = procedure?.date_performed ? new Date(procedure.date_performed).toLocaleDateString() : 'N/A';
      const status = (procedure?.status || '').toString().toUpperCase();
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Procedure Record</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class="header">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class="clinic">N.B. SEGOROYNE LYING-IN CLINIC</div><div class="sub">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class="sub">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class="title">MEDICAL PROCEDURE RECORD</div><table><tr><td style="width:50%"><span class="label">Patient</span> <span class="value">${patient.name || 'Walk-in Patient'}</span></td><td style="width:50%"><span class="label">Contact</span> <span class="value">${patient.contact || ''}</span></td></tr><tr><td><span class="label">Procedure Type</span> <span class="value">${procedure?.procedure_type || ''}</span></td><td><span class="label">Date</span> <span class="value">${dateStr}</span></td></tr><tr><td><span class="label">Provider</span> <span class="value">${procedure?.healthcare_provider || ''}</span></td><td><span class="label">Status</span> <span class="value">${status}</span></td></tr><tr><td colspan="2"><span class="label">Outcome</span> <span class="value">${procedure?.outcome || ''}</span></td></tr></table></body></html>`;
      const filename = `Procedure_${(patient.name || 'WalkIn').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };

  const retryLoad = () => {
    loadWalkInData();
  };

  // Print helpers for Baby modal (available in this component scope)
  const handlePrintDeliveryRecord = async (baby) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const admission = Array.isArray(admissions) && admissions.length ? admissions[0] : {};
      let dd = {};
      try {
        if (admission.notes) {
          const n = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
          dd = n && n.delivery_details ? n.delivery_details : {};
        }
      } catch { }
      const mother = {
        name: [walkInProfile?.first_name, walkInProfile?.middle_name, walkInProfile?.last_name].filter(Boolean).join(' '),
        age: walkInProfile?.age || '',
        address: walkInProfile?.address || '',
        gravida: dd.gravida || '',
        para: dd.para || ''
      };
      const html = generateDeliveryRoomRecordHTML(mother, baby, admission, logoUrl);
      const filename = `Delivery_Room_Record_${(baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error('Failed to generate Delivery Room Record:', e);
      alert('Failed to generate Delivery Room Record');
    }
  };

  const handlePrintScreening = async (screening) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const patient = { name: name || '', contact: contact || '' };
      const dateStr = screening.screening_date ? new Date(screening.screening_date).toLocaleString() : (screening.date_performed ? new Date(screening.date_performed).toLocaleString() : 'N/A');
      const statusUi = (() => { const s = screening.status; const v = (s === 'completed' ? 'normal' : (s || 'pending')).toUpperCase(); return v; })();
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Newborn Screening Report</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class=\"header\">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class=\"clinic\">N.B. SEGOROYNE LYING-IN CLINIC</div><div class=\"sub\">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class=\"sub\">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class=\"title\">NEWBORN SCREENING REPORT</div><table><tr><td style=\"width:50%\"><span class=\"label\">Patient</span> <span class=\"value\">${patient.name || 'Walk-in Patient'}</span></td><td style=\"width:50%\"><span class=\"label\">Contact</span> <span class=\"value\">${patient.contact || ''}</span></td></tr><tr><td><span class=\"label\">Test Type</span> <span class=\"value\">${screening.screening_type || screening.test_type || ''}</span></td><td><span class=\"label\">Date</span> <span class=\"value\">${dateStr}</span></td></tr><tr><td><span class=\"label\">Result</span> <span class=\"value\">${(screening.results ?? screening.result ?? '')}</span></td><td><span class=\"label\">Status</span> <span class=\"value\">${statusUi}</span></td></tr><tr><td colspan=\"2\"><span class=\"label\">Provider</span> <span class=\"value\">${screening.screened_by ?? screening.healthcare_provider ?? ''}</span></td></tr></table></body></html>`;
      const filename = `Screening_${(patient.name || 'WalkIn').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };

  const handlePrintImmunization = async (immunization) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const patient = { name: name || '', contact: contact || '' };
      const dateStr = immunization.date_given ? new Date(immunization.date_given).toLocaleDateString() : 'N/A';
      const nextDue = immunization.next_due_date ? new Date(immunization.next_due_date).toLocaleDateString() : 'N/A';
      const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><title>Immunization Record</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class=\"header\">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class=\"clinic\">N.B. SEGOROYNE LYING-IN CLINIC</div><div class=\"sub\">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class=\"sub\">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class=\"title\">IMMUNIZATION RECORD</div><table><tr><td style=\"width:50%\"><span class=\"label\">Patient</span> <span class=\"value\">${patient.name || 'Walk-in Patient'}</span></td><td style=\"width:50%\"><span class=\"label\">Contact</span> <span class=\"value\">${patient.contact || ''}</span></td></tr><tr><td><span class=\"label\">Vaccine Type</span> <span class=\"value\">${immunization.vaccine_type || ''}</span></td><td><span class=\"label\">Date Given</span> <span class=\"value\">${dateStr}</span></td></tr><tr><td><span class=\"label\">Dose Number</span> <span class=\"value\">${immunization.dose_number ?? ''}</span></td><td><span class=\"label\">Injection Site</span> <span class=\"value\">${immunization.injection_site || ''}</span></td></tr><tr><td><span class=\"label\">Provider</span> <span class=\"value\">${immunization.healthcare_provider || ''}</span></td><td><span class=\"label\">Next Due</span> <span class=\"value\">${nextDue}</span></td></tr></table></body></html>`;
      const filename = `Immunization_${(patient.name || 'WalkIn').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };

  const handlePrintSingleLabTest = async (test) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const patient = {
        first_name: walkInProfile?.first_name || '',
        middle_name: walkInProfile?.middle_name || '',
        last_name: walkInProfile?.last_name || '',
        age: walkInProfile?.age || '',
        gender: walkInProfile?.gender || 'female'
      };
      patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
      const html = generateSingleLabTestHTML(patient, test, logoUrl);
      const tName = (test.test_name || test.test_type || 'LabTest').replace(/\s+/g, '_');
      const pName = (patient.full_name || 'Patient').replace(/\s+/g, '_');
      const filename = `${tName}_${pName}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) { alert('Failed to generate Lab Test PDF'); }
  };

  const handlePrintNewbornAdmissionForm = async (baby) => {
    try {
      const logoUrl = await resolveLogoUrl();
      let newborn = {};
      try {
        const r = await axios.get(`/api/clinic/babies/${baby.id}/admissions`);
        const rows = r.data || [];
        newborn = rows[0] || {};
      } catch { }
      const mother = {
        name: [walkInProfile?.first_name, walkInProfile?.middle_name, walkInProfile?.last_name].filter(Boolean).join(' '),
        address: walkInProfile?.address || ''
      };
      const html = generateNewbornAdmissionFormHTML(mother, baby, newborn, logoUrl);
      const filename = `Newborn_Admission_${(baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error('Failed to generate Newborn Admission form:', e);
      alert('Failed to generate Newborn Admission form');
    }
  };

  const handlePrintNewbornDischargeSummary = async (baby) => {
    try {
      const logoUrl = await resolveLogoUrl();
      let admissionsRows = [];
      try {
        const r = await axios.get(`/api/clinic/babies/${baby.id}/admissions`);
        admissionsRows = r.data || [];
      } catch { }
      const discharged = admissionsRows.find((a) => a.status === 'discharged') || admissionsRows[0] || {};
      const mother = {
        gravida: walkInProfile?.gravida || '',
        para: walkInProfile?.para || ''
      };
      const html = generateNewbornDischargeSummaryHTML(mother, baby, discharged, {}, logoUrl);
      const filename = `Newborn_Discharge_${(baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error('Failed to generate Newborn Discharge summary:', e);
      alert('Failed to generate Newborn Discharge summary');
    }
  };

  if (loading) return <div className="p-6">Loading walk-in patient data...</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
          <button
            onClick={retryLoad}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'prenatal', label: 'Prenatal Care', icon: '🤱' },
    { id: 'babies', label: 'Babies', icon: '👶' },
    { id: 'lab-results', label: 'Lab Results', icon: '🧪', badge: labResults.length },
    { id: 'screenings', label: 'Newborn Screening', icon: '🧬', badge: screenings.length },
    { id: 'procedures', label: 'Medical Procedures', icon: '⚕️', badge: procedures.length },
    { id: 'immunizations', label: 'Immunizations', icon: '💉', badge: immunizations.length },
    { id: 'postpartum', label: 'Postpartum', icon: '🏥' },
    { id: 'cycles', label: 'Cycles', icon: '🔄', badge: (prenatalVisits?.length || 0) + (postpartumCare?.length || 0) },
    { id: 'admissions', label: 'Admissions', icon: '🏨' },
    { id: 'family-planning', label: 'Family Planning', icon: '💊' },
    { id: 'referrals', label: 'Referrals', icon: '📨', badge: referrals.length },
    { id: 'medications', label: 'Medications', icon: '💊', badge: medications.length },
    { id: 'birth-plan', label: 'Birth Plan', icon: '📝' }
  ];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header with Patient Info */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-bold truncate">{name}</h1>
              <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                WALK-IN PATIENT
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Contact: {contact}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
            <button
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs sm:text-sm whitespace-nowrap"
              onClick={() => openModal('add-medical-record')}
            >
              Add Medical Record
            </button>
            <button
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm whitespace-nowrap"
              onClick={() => openModal('edit-patient-info')}
            >
              Edit Patient Info
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2 ${activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              walkInData={{
                patient_name: name,
                contact_number: contact,
                lmp: walkInProfile.lmp || null,
                edd: walkInProfile.edd || null,
                gravida: walkInProfile.gravida || null,
                para: walkInProfile.para || null,
                visit_date: records.length > 0 ? records[0].visit_date : null,
                service_type: records.length > 0 ? records[0].service_type : 'Walk-in'
              }}
              profile={walkInProfile}
              medicalRecords={records}
              admissions={admissions}
              babies={babies}
              labResults={labResults}
              prenatalVisits={prenatalVisits}
              postpartumCare={postpartumCare}
              familyPlanning={familyPlanning}
              openModal={openModal}
            />
          )}
          {activeTab === 'prenatal' && <PrenatalTab visits={prenatalVisits} admissions={admissions} walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'babies' && <BabiesTab babies={babies} admissions={admissions} profile={walkInProfile} walkInId={`${name}_${contact}`} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'lab-results' && <LabResultsTab results={labResults} walkInId={`${name}_${contact}`} reload={loadWalkInData} openModal={openModal} onPrintSingleLabTest={handlePrintSingleLabTest} />}
          {activeTab === 'screenings' && <ScreeningsTab screenings={screenings} walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'procedures' && <ProceduresTab procedures={procedures} walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'immunizations' && <ImmunizationsTab immunizations={immunizations} walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'postpartum' && <PostpartumTab care={postpartumCare} admissions={admissions} walkInId={`${name}_${contact}`} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'cycles' && <CyclesTab prenatalVisits={prenatalVisits} postpartumCare={postpartumCare} admissions={admissions} babies={babies} openModal={openModal} onNavigateTo={(tabId) => setActiveTab(tabId)} />}
          {activeTab === 'admissions' && <AdmissionsTab admissions={admissions} walkInName={name} walkInContact={contact} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'family-planning' && <FamilyPlanningTab records={familyPlanning} walkInId={`${name}_${contact}`} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'referrals' && <ReferralsTab referrals={referrals} walkInName={name} walkInContact={contact} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'medications' && <MedicationsTab medications={medications} admissions={admissions} walkInName={name} walkInContact={contact} reload={loadWalkInData} openModal={openModal} />}
          {activeTab === 'birth-plan' && <BirthPlanTab birthPlan={birthPlan} profile={walkInProfile} prenatalVisits={prenatalVisits} reload={loadWalkInData} openModal={openModal} />}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto min-h-[200px]" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            {modalType === 'medical-record' && <MedicalRecordModal record={modalData} onClose={closeModal} />}
            {modalType === 'edit-patient-info' && <EditPatientInfoModal name={name} contact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-medical-record' && <AddMedicalRecordModal walkInName={name} walkInContact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-prenatal' && <AddPrenatalModal walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'edit-prenatal' && <EditPrenatalModal prenatal={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'delete-prenatal' && <DeleteConfirmModal type="prenatal visit" item={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-baby' && <AddBabyModal walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} prefill={modalData?.prefill} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'edit-baby' && <EditBabyModal baby={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'delete-baby' && <DeleteConfirmModal type="baby record" item={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-lab-result' && <SharedAddLabResultModal walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'edit-lab-result' && <EditLabResultModal labResult={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'delete-lab-result' && <DeleteConfirmModal type="lab result" item={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-screening' && <SharedAddScreeningModal walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'view-screening' && <ViewScreeningModal screening={modalData} onClose={closeModal} onPrint={() => handlePrintScreening(modalData)} />}
            {modalType === 'edit-screening' && <EditScreeningModal screening={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-procedure' && (
              <SharedAddProcedureModal
                walkInId={`${name}_${contact}`}
                walkInName={name}
                walkInContact={contact}
                onClose={closeModal}
                onSuccess={loadWalkInData}
              />
            )}
            {modalType === 'edit-procedure' && (
              modalData && Object.keys(modalData).length > 0 ? (
                <EditProcedureModal procedure={modalData} onClose={closeModal} onSuccess={loadWalkInData} />
              ) : (
                <div className="text-gray-700">No procedure data available.</div>
              )
            )}
            {modalType === 'procedure-record' && (
              modalData && Object.keys(modalData).length > 0 ? (
                <ViewProcedureModal procedure={modalData} onClose={closeModal} onPrint={() => handlePrintProcedure(modalData)} />
              ) : (
                <div className="text-gray-700">No procedure data available.</div>
              )
            )}
            {modalType === 'add-immunization' && <SharedAddImmunizationModal walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'view-immunization' && <ViewImmunizationModal immunization={modalData} onClose={closeModal} onPrint={() => handlePrintImmunization(modalData)} />}
            {modalType === 'edit-immunization' && <EditImmunizationModal immunization={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-postpartum' && <AddPostpartumModal walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} prenatalVisits={prenatalVisits} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'edit-postpartum' && <EditPostpartumModal postpartum={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'delete-postpartum' && <DeleteConfirmModal type="postpartum assessment" item={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-family-planning' && <AddFamilyPlanningModal walkInId={`${name}_${contact}`} walkInName={name} walkInContact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'edit-family-planning' && <EditFamilyPlanningModal familyPlanning={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'delete-family-planning' && <DeleteConfirmModal type="family planning record" item={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-admission' && <AddAdmissionModal walkInName={name} walkInContact={contact} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'edit-admission' && <EditAdmissionModal admission={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'discharge-admission' && <DischargeAdmissionModal admission={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'admission-view' && <ViewAdmissionModal admission={modalData} onClose={closeModal} onPrintForm={() => handlePrintAdmissionForm(modalData)} onPrintDischarge={() => handlePrintMotherDischargeSummary(modalData)} />}
            {modalType === 'prenatal-visit' && <ViewPrenatalModal prenatal={modalData} onClose={closeModal} />}
            {modalType === 'postpartum-assessment' && <ViewPostpartumModal postpartum={modalData} onClose={closeModal} />}
            {modalType === 'baby-record' && (
              <ViewBabyModal
                baby={modalData}
                onClose={closeModal}
                onPrintAdmissionForm={() => handlePrintNewbornAdmissionForm(modalData)}
                onPrintDischargePDF={() => handlePrintNewbornDischargeSummary(modalData)}
                onPrintDeliveryRecord={() => handlePrintDeliveryRecord(modalData)}
              />
            )}
            {modalType === 'admit-baby' && <AddBabyAdmissionModal baby={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'discharge-baby' && <DischargeBabyAdmissionModal baby={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'lab-result' && <ViewLabResultModal labResult={modalData} onClose={closeModal} onPrint={() => handlePrintSingleLabTest(modalData)} />}
            {modalType === 'family-planning-record' && <ViewFamilyPlanningModal familyPlanning={modalData} onClose={closeModal} />}
            {modalType === 'add-referral' && <AddWalkInReferralModal patientId={walkInProfile?.id} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-referral-return' && <AddReferralReturnModal referral={modalData} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-medication-admin' && <AddWalkInMedicationAdminModal patientId={walkInProfile?.id} admissions={admissions} prefillAdmissionId={modalData?.prefill_admission_id} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'add-birth-plan' && <AddWalkInBirthPlanModal patientId={walkInProfile?.id} onClose={closeModal} onSuccess={loadWalkInData} />}
            {modalType === 'order-prenatal-labs' && <OrderPrenatalLabsModalWalkIn patientId={walkInProfile?.id} onClose={closeModal} onSuccess={loadWalkInData} />}
          </div>
        </div>
      )}
    </div>
  );
};

// Modal Components for managing patient data

// Medical Record Modal Component
const MedicalRecordModal = ({ record, onClose }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Medical Record Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <p className="mt-1">{new Date(record.appointment_date).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <p className="mt-1">{record.time_slot}</p>
          </div>
        </div>

        {record.chief_complaint && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
            <p className="mt-1">{record.chief_complaint}</p>
          </div>
        )}

        {record.diagnosis && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
            <p className="mt-1">{record.diagnosis}</p>
          </div>
        )}

        {record.treatment && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Treatment</label>
            <p className="mt-1">{record.treatment}</p>
          </div>
        )}

        {record.vital_signs && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Vital Signs</label>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
              {record.vital_signs.blood_pressure && (<p>BP: {record.vital_signs.blood_pressure}</p>)}
              {record.vital_signs.temperature && (<p>Temp: {record.vital_signs.temperature}</p>)}
              {record.vital_signs.heart_rate && (<p>HR: {record.vital_signs.heart_rate}</p>)}
              {record.vital_signs.weight && (<p>Weight: {record.vital_signs.weight}</p>)}
              {record.vital_signs.height && (<p>Height: {record.vital_signs.height}</p>)}
              {(record.vital_signs.fundal_height || record.vital_signs.fundal_height_cm) && (
                <p>Fundal Height: {record.vital_signs.fundal_height ?? record.vital_signs.fundal_height_cm}</p>
              )}
              {record.vital_signs.fetal_heart_rate && (<p>Fetal Heart Rate: {record.vital_signs.fetal_heart_rate}</p>)}
              {record.vital_signs.gestational_age && (<p>Gestational Age: {record.vital_signs.gestational_age}</p>)}
              {(record.vital_signs.gravida || record.vital_signs.para) && (
                <p>Gravida/Para: {(record.vital_signs.gravida || 0)}/{(record.vital_signs.para || 0)}</p>
              )}
              {record.vital_signs.lmp && (
                <p>LMP: {(() => { try { const d = new Date(record.vital_signs.lmp); return d.toLocaleDateString(); } catch { return String(record.vital_signs.lmp); } })()}</p>
              )}
              {record.vital_signs.edd && (
                <p>EDD: {(() => { try { const d = new Date(record.vital_signs.edd); return d.toLocaleDateString(); } catch { return String(record.vital_signs.edd); } })()}</p>
              )}
              {record.vital_signs.fetal_movement && (<p>Fetal Movement: {record.vital_signs.fetal_movement}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Admission Modal Component
const AdmissionModal = ({ admission, onClose }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Admission Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Admission Date</label>
            <p className="mt-1">{new Date(admission.admission_date).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1">
              <span className={`px-3 py-1 rounded text-sm ${admission.status === 'discharged' ? 'bg-green-100 text-green-800' :
                admission.status === 'admitted' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                {admission.status}
              </span>
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Admission Reason</label>
          <p className="mt-1">{admission.admission_reason}</p>
        </div>

        {admission.room && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Room</label>
            <p className="mt-1">{admission.room}</p>
          </div>
        )}

        {admission.delivery_type && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery Type</label>
            <p className="mt-1">{admission.delivery_type}</p>
          </div>
        )}

        {admission.outcome && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Outcome</label>
            <p className="mt-1">{admission.outcome}</p>
          </div>
        )}

        {admission.discharge_date && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Discharge Date</label>
            <p className="mt-1">{new Date(admission.discharge_date).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Duplicate PrenatalTab component removed

// Screenings Tab Component
const ScreeningsTab = ({ screenings, walkInId, walkInName, walkInContact, reload, openModal }) => {
  const [selectedTest, setSelectedTest] = useState('__all__');
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const tests = Array.from(new Set((screenings || []).map(s => s.screening_type || s.test_type).filter(Boolean)));
  const statuses = Array.from(new Set((screenings || []).map(s => s.status).filter(Boolean)));
  const filteredScreenings = (screenings || []).filter(s => {
    const typeVal = s.screening_type || s.test_type;
    const typeOk = selectedTest === '__all__' ? true : String(typeVal) === String(selectedTest);
    const statusOk = selectedStatus === '__all__' ? true : String(s.status) === String(selectedStatus);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = s.screening_date || s.date_performed;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return typeOk && statusOk && monthOk;
  });
  const handleDeleteScreening = async (screeningId) => {
    if (window.confirm('Are you sure you want to delete this screening record?')) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const base = user.role === 'doctor' ? '/api/doctors' : '/api/admin';
        await axios.delete(`${base}/walkin/screenings/${screeningId}`);
        reload();
      } catch (error) {
        console.error('Error deleting screening:', error);
        alert('Failed to delete screening record');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Newborn Screening Records</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
            <option value="__all__">All tests</option>
            {tests.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            onClick={() => openModal('add-screening')}
          >
            Add Screening
          </button>
        </div>
      </div>

      {filteredScreenings.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No screening records found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScreenings.map((screening, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {screening.screening_type || screening.test_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {screening.screening_date ? new Date(screening.screening_date).toLocaleDateString() : (screening.date_performed ? new Date(screening.date_performed).toLocaleDateString() : 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {screening.results ?? screening.result ?? ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const s = screening.status;
                      const ui = (s === 'completed' ? 'normal' : (s || 'pending')).toLowerCase();
                      const cls = ui === 'normal' ? 'bg-green-100 text-green-800' : ui === 'abnormal' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
                      return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cls}`}>{ui}</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {screening.screened_by ?? screening.healthcare_provider ?? ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal('view-screening', screening)}
                      className="text-gray-700 hover:text-gray-900 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openModal('edit-screening', screening)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteScreening(screening.id)}
                      className="text-red-600 hover:text-red-900 ml-2"
                    >
                      Delete
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Procedures Tab Component
const ProceduresTab = ({ procedures, walkInId, walkInName, walkInContact, reload, openModal }) => {
  const [selectedType, setSelectedType] = useState('__all__');
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const types = Array.from(new Set((procedures || []).map(p => p.procedure_type).filter(Boolean)));
  const statuses = Array.from(new Set((procedures || []).map(p => p.status).filter(Boolean)));
  const filteredProcedures = (procedures || []).filter(p => {
    const typeOk = selectedType === '__all__' ? true : String(p.procedure_type) === String(selectedType);
    const statusOk = selectedStatus === '__all__' ? true : String(p.status) === String(selectedStatus);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = p.date_performed;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return typeOk && statusOk && monthOk;
  });
  const handleDeleteProcedure = async (procedureId) => {
    if (window.confirm('Are you sure you want to delete this procedure record?')) {
      try {
        await axios.delete(`${getApiBasePath('write')}/walkin/procedures/${procedureId}`);
        reload();
      } catch (error) {
        console.error('Error deleting procedure:', error);
        alert('Failed to delete procedure record');
      }
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Medical Procedures</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="__all__">All types</option>
            {types.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            onClick={() => openModal('add-procedure')}
          >
            Add Procedure
          </button>
        </div>
      </div>

      {filteredProcedures.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No procedure records found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcedures.map((procedure, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {procedure.procedure_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(procedure.date_performed).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${procedure.status === 'completed' ? 'bg-green-100 text-green-800' :
                      procedure.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {procedure.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {procedure.healthcare_provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {procedure.outcome || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal('procedure-record', procedure)}
                        className="text-green-600 hover:text-green-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openModal('edit-procedure', procedure)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProcedure(procedure.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Immunizations Tab Component
const ImmunizationsTab = ({ immunizations, walkInId, walkInName, walkInContact, reload, openModal }) => {
  const [selectedVaccine, setSelectedVaccine] = useState('__all__');
  const [dueFilter, setDueFilter] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const vaccines = Array.from(new Set((immunizations || []).map(i => i.vaccine_type).filter(Boolean)));
  const today = new Date();
  const filteredImmunizations = (immunizations || []).filter(im => {
    const vaccineOk = selectedVaccine === '__all__' ? true : String(im.vaccine_type) === String(selectedVaccine);
    let dueOk = true;
    const nd = im.next_due_date ? new Date(im.next_due_date) : null;
    if (dueFilter !== '__all__') {
      if (dueFilter === 'none') dueOk = !nd;
      else if (dueFilter === 'overdue') dueOk = nd && nd < today;
      else if (dueFilter === 'upcoming') dueOk = nd && nd >= today;
    }
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = im.date_given;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return vaccineOk && dueOk && monthOk;
  });
  const handleDeleteImmunization = async (immunizationId) => {
    if (window.confirm('Are you sure you want to delete this immunization record?')) {
      try {
        await axios.delete(`${getApiBasePath('write')}/walkin/immunizations/${immunizationId}`);
        reload();
      } catch (error) {
        console.error('Error deleting immunization:', error);
        alert('Failed to delete immunization record');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Immunizations</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedVaccine} onChange={(e) => setSelectedVaccine(e.target.value)}>
            <option value="__all__">All vaccines</option>
            {vaccines.map(v => (<option key={v} value={v}>{v}</option>))}
          </select>
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
            <option value="__all__">All due states</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
            <option value="none">No schedule</option>
          </select>
          <input type="month" className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            onClick={() => openModal('add-immunization')}
          >
            Add Immunization
          </button>
        </div>
      </div>

      {filteredImmunizations.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No immunization records found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Given</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredImmunizations.map((immunization, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {immunization.vaccine_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(immunization.date_given).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {immunization.dose_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {immunization.injection_site || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {immunization.healthcare_provider || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {immunization.next_due_date ? new Date(immunization.next_due_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal('view-immunization', immunization)}
                        className="text-green-600 hover:text-green-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openModal('edit-immunization', immunization)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteImmunization(immunization.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Babies Tab Component
const BabiesTab = ({ babies, admissions = [], profile = {}, walkInId, reload, openModal }) => {
  const [selectedGender, setSelectedGender] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [search, setSearch] = useState('');
  const genders = Array.from(new Set((babies || []).map(b => b.gender).filter(Boolean)));
  const filteredBabies = (babies || []).filter(b => {
    const genderOk = selectedGender === '__all__' ? true : String(b.gender) === String(selectedGender);
    const term = (search || '').trim().toLowerCase();
    const name = (b.baby_name || b.full_name || '').toLowerCase();
    const searchOk = term === '' ? true : name.includes(term);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = b.birth_date;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return genderOk && searchOk && monthOk;
  });
  const handlePrintDeliveryRecord = async (baby, e) => {
    if (e) e.stopPropagation();
    const logoUrl = await resolveLogoUrl();
    const admission = Array.isArray(admissions) && admissions.length ? admissions[0] : {};
    let dd = {};
    try {
      if (admission.notes) {
        const n = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
        dd = n && n.delivery_details ? n.delivery_details : {};
      }
    } catch { }
    const mother = {
      name: [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' '),
      age: profile?.age || '',
      address: profile?.address || '',
      gravida: dd.gravida || '',
      para: dd.para || ''
    };
    const html = generateDeliveryRoomRecordHTML(mother, baby, admission, logoUrl);
    const filename = `Delivery_Room_Record_${(baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
    downloadHTMLAsPDF(html, filename);
  };
  const handlePrintNewbornAdmissionForm = async (baby, e) => {
    if (e) e.stopPropagation();
    const logoUrl = await resolveLogoUrl();
    let newborn = {};
    try {
      const r = await axios.get(`/api/clinic/babies/${baby.id}/admissions`);
      const rows = r.data || [];
      newborn = rows[0] || {};
    } catch { }
    const mother = {
      name: [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' '),
      address: profile?.address || ''
    };
    const html = generateNewbornAdmissionFormHTML(mother, baby, newborn, logoUrl);
    const filename = `Newborn_Admission_${(baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
    downloadHTMLAsPDF(html, filename);
  };
  const handlePrintNewbornDischargeSummary = async (baby, e) => {
    if (e) e.stopPropagation();
    const logoUrl = await resolveLogoUrl();
    let admissionsRows = [];
    try {
      const r = await axios.get(`/api/clinic/babies/${baby.id}/admissions`);
      admissionsRows = r.data || [];
    } catch { }
    const discharged = admissionsRows.find((a) => a.status === 'discharged') || admissionsRows[0] || {};
    const mother = {
      gravida: profile?.gravida || '',
      para: profile?.para || ''
    };
    const html = generateNewbornDischargeSummaryHTML(mother, baby, discharged, {}, logoUrl);
    const filename = `Newborn_Discharge_${(baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
    downloadHTMLAsPDF(html, filename);
  };
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Baby Records</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)}>
            <option value="__all__">All genders</option>
            {genders.map(g => (<option key={g} value={g}>{g}</option>))}
          </select>
          <input type="month" className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <input className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            onClick={() => openModal('add-baby')}
          >
            Add Baby Record
          </button>
        </div>
      </div>
      {filteredBabies.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No baby records found</div>
      ) : (
        <div className="space-y-3">
          {filteredBabies.map((baby, index) => (
            <div key={index} className="p-4 border rounded hover:bg-gray-50">
              <div className="flex justify-between">
                <div className="cursor-pointer flex-1" onClick={() => openModal('baby-record', baby)}>
                  <div className="font-semibold">{baby.baby_name || `Baby ${index + 1}`}</div>
                  <div className="text-sm text-gray-600">Birth Date: {new Date(baby.birth_date).toLocaleDateString()}</div>
                  <div className="text-sm">Gender: {baby.gender}</div>
                  {baby.birth_weight && <div className="text-sm">Birth Weight: {baby.birth_weight} kg</div>}
                  {baby.birth_length && <div className="text-sm">Birth Length: {baby.birth_length} cm</div>}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{baby.apgar_score && `APGAR: ${baby.apgar_score}`}</div>
                    <div className="text-sm text-gray-500">{baby.delivery_type}</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); openModal('baby-record', baby); }} className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">View</button>
                    <button onClick={(e) => { e.stopPropagation(); openModal('edit-baby', baby); }} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); openModal('delete-baby', baby); }} className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Delete</button>

                    <button onClick={(e) => { e.stopPropagation(); openModal('admit-baby', baby); }} className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600">Admit</button>
                    <button onClick={(e) => { e.stopPropagation(); openModal('discharge-baby', baby); }} className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Discharge</button>
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

const AddBabyAdmissionModal = ({ baby, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date_admitted: new Date().toISOString().slice(0, 19).replace('T', ' '),
    admitting_diagnosis: 'Full term baby via NSD',
    notes: '',
    iron_supplement_date: '',
    vitamin_a_date: '',
    foul_smell_discharge: false,
    family_planning_method: ''
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/clinic/babies/admissions', {
        baby_id: baby.id,
        date_admitted: formData.date_admitted,
        admitting_diagnosis: formData.admitting_diagnosis || null,
        notes: formData.notes || null
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to admit newborn');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Admit Newborn</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date Admitted</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={formData.date_admitted.replace(' ', 'T')} onChange={(e) => setFormData({ ...formData, date_admitted: e.target.value.replace('T', ' ') })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Admitting Diagnosis</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.admitting_diagnosis} onChange={(e) => setFormData({ ...formData, admitting_diagnosis: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Admit'}</button>
        </div>
      </form>
    </div>
  );
};

const DischargeBabyAdmissionModal = ({ baby, onClose, onSuccess }) => {
  const [admission, setAdmission] = useState(null);
  const [formData, setFormData] = useState({
    date_discharge: new Date().toISOString().slice(0, 19).replace('T', ' '),
    home_medication: 'Multivitamins 0.5 mL OD',
    follow_up: '',
    screening_date: '',
    screening_filter_card_no: '',
    vitamin_k_date: '',
    bcg_date: '',
    hepb_date: '',
    discharged_by: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`/api/clinic/babies/${baby.id}/admissions`).then((res) => {
      const current = (res.data || []).find((a) => a.status === 'admitted');
      setAdmission(current || null);
    }).catch(() => setAdmission(null));
  }, [baby.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!admission) {
      alert('No active admission for this baby');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        date_discharge: formData.date_discharge,
        home_medication: formData.home_medication || null,
        follow_up: formData.follow_up || null,
        screening_date: formData.screening_date || null,
        screening_filter_card_no: formData.screening_filter_card_no || null,
        vitamin_k_date: formData.vitamin_k_date || null,
        bcg_date: formData.bcg_date || null,
        hepb_date: formData.hepb_date || null,
        discharged_by: formData.discharged_by || null,
      };
      await axios.put(`/api/clinic/babies/admissions/${admission.id}/discharge`, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to discharge newborn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Newborn Discharge Summary</h2>
      {!admission && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 mb-3">No active admission found for this baby.</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date Discharge</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={formData.date_discharge.replace(' ', 'T')} onChange={(e) => setFormData({ ...formData, date_discharge: e.target.value.replace('T', ' ') })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Admitting Diagnosis</label>
            <input type="text" disabled className="w-full border rounded px-3 py-2" value={admission?.admitting_diagnosis || ''} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Home Medication / Follow-up</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.home_medication} onChange={(e) => setFormData({ ...formData, home_medication: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Follow-up Check-up</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.follow_up} onChange={(e) => setFormData({ ...formData, follow_up: e.target.value })} placeholder="e.g., pediatric consult date" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Newborn Screening — Date/Time</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={formData.screening_date ? formData.screening_date.replace(' ', 'T') : ''} onChange={(e) => setFormData({ ...formData, screening_date: e.target.value.replace('T', ' ') })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter Card No.</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.screening_filter_card_no} onChange={(e) => setFormData({ ...formData, screening_filter_card_no: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vitamin K Date</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={formData.vitamin_k_date} onChange={(e) => setFormData({ ...formData, vitamin_k_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">BCG Date</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={formData.bcg_date} onChange={(e) => setFormData({ ...formData, bcg_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hepatitis B Date</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={formData.hepb_date} onChange={(e) => setFormData({ ...formData, hepb_date: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Signature / Discharged By</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={formData.discharged_by} onChange={(e) => setFormData({ ...formData, discharged_by: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading || !admission} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Discharge'}</button>
        </div>
      </form>
    </div>
  );
};

// Lab Results Tab Component
const LabResultsTab = ({ results, walkInId, reload, openModal, onPrintSingleLabTest }) => {
  const [selectedCategory, setSelectedCategory] = useState('__all__');
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [search, setSearch] = useState('');
  const categories = Array.from(new Set((results || []).map(r => r.test_category).filter(Boolean)));
  const statuses = Array.from(new Set((results || []).map(r => r.status).filter(Boolean)));
  const filteredResults = (results || []).filter(r => {
    const catOk = selectedCategory === '__all__' ? true : String(r.test_category) === String(selectedCategory);
    const statusOk = selectedStatus === '__all__' ? true : String(r.status) === String(selectedStatus);
    const term = (search || '').trim().toLowerCase();
    const searchOk = term === '' ? true : ((r.test_name || r.test_type || '').toLowerCase().includes(term));
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = r.test_date;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return catOk && statusOk && searchOk && monthOk;
  });
  const cervicalScreeningResults = filteredResults.filter(result =>
    result.test_category === 'cervical_screening' ||
    ['Pap Smear', 'HPV Test', 'Colposcopy', 'Cervical Biopsy', 'LEEP', 'Cone Biopsy'].includes(result.test_name)
  );


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Lab Results</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            onClick={() => openModal('add-lab-result')}
          >
            Add Lab Result
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={async () => {
              try {
                const logoUrl = await resolveLogoUrl();
                let patient = {};
                try { const p = await axios.get(`/api/admin/patient-profile/${walkInId}`); const prof = p.data || {}; patient = { first_name: prof.first_name || '', middle_name: prof.middle_name || '', last_name: prof.last_name || '', age: prof.age || '', gender: prof.gender || 'female' }; patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' '); } catch { }
                const ultrasound = filteredResults.filter(r => (r.test_category === 'imaging' || r.test_category === 'ultrasound') && /ultra/i.test((r.test_name || r.test_type || '')));
                const urinalysis = filteredResults.filter(r => (r.test_category === 'urine') || /urinalysis|urine/i.test((r.test_name || r.test_type || '')));
                const cbc = filteredResults.filter(r => (r.test_category === 'blood') && /cbc/i.test((r.test_name || r.test_type || '')));
                const bloodTyping = filteredResults.filter(r => /blood\s*type|typing/i.test((r.test_name || r.test_type || '')));
                const vdrl = filteredResults.filter(r => /vdrl|rpr/i.test((r.test_name || r.test_type || '')));
                const hepaB = filteredResults.filter(r => /hbsag|hepa\s*b|hepatitis\s*b/i.test((r.test_name || r.test_type || '')));
                const sections = { ultrasound, urinalysis, cbc, blood_typing: bloodTyping, vdrl, hepa_b: hepaB };
                const html = generateClinicalLabReportsHTML(patient, sections, logoUrl);
                const filename = `Clinical_Lab_Reports_${(patient.full_name || 'Patient').replace(/\s+/g, '_')}`;
                downloadHTMLAsPDF(html, filename);
              } catch (e) { console.error(e); alert('Failed to generate Clinical and Laboratory Reports'); }
            }}
            title="Print Clinical & Laboratory Reports"
          >
            Lab Reports PDF
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="px-3 py-2 border rounded" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="__all__">All categories</option>
          {categories.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="__all__">All statuses</option>
          {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
        </select>
        <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        <input className="px-3 py-2 border rounded" placeholder="Search test name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filteredResults.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No lab results found</div>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((result, index) => {
            const isCervicalScreening = result.test_category === 'cervical_screening' ||
              ['Pap Smear', 'HPV Test', 'Colposcopy', 'Cervical Biopsy', 'LEEP', 'Cone Biopsy'].includes(result.test_name);

            return (
              <div
                key={index}
                className={`p-4 border rounded hover:bg-gray-50 ${isCervicalScreening ? 'bg-pink-50 border-pink-200' : ''
                  }`}
              >
                <div className="flex justify-between">
                  <div className="cursor-pointer flex-1" onClick={() => openModal('lab-result', result)}>
                    <div className="flex items-center gap-2">
                      {isCervicalScreening && (
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      )}
                      <div className="font-semibold">{result.test_name}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Category: {result.test_category === 'cervical_screening' ? 'Cervical Screening' : result.test_category || 'General'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Date: {new Date(result.test_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm">Result: {result.result_value} {result.unit}</div>
                    {result.reference_range && <div className="text-sm">Reference: {result.reference_range}</div>}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${result.status === 'Normal' ? 'text-green-600' :
                        result.status === 'Abnormal' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                        {result.status || 'Pending'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.lab_name}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onPrintSingleLabTest(result); }}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        title="Print Test PDF"
                      >
                        Print PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('lab-result', result);
                        }}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('edit-lab-result', result);
                        }}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('delete-lab-result', result);
                        }}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Duplicate PostpartumTab component removed - using the one defined earlier in the file

// Family Planning Tab Component
const FamilyPlanningTab = ({ records, walkInId, reload, openModal }) => {
  const [selectedMethod, setSelectedMethod] = useState('__all__');
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const methods = Array.from(new Set((records || []).map(r => r.contraceptive_method || r.method_chosen).filter(Boolean)));
  const statuses = Array.from(new Set((records || []).map(r => r.status).filter(Boolean)));
  const filteredRecords = (records || []).filter(r => {
    const methodVal = r.contraceptive_method ?? r.method_chosen;
    const methodOk = selectedMethod === '__all__' ? true : String(methodVal) === String(selectedMethod);
    const statusOk = selectedStatus === '__all__' ? true : String(r.status) === String(selectedStatus);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = r.consultation_date || r.method_started_date;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return methodOk && statusOk && monthOk;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold">Family Planning Records</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
            <option value="__all__">All methods</option>
            {methods.map(m => (<option key={m} value={m}>{m}</option>))}
          </select>
          <select className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            onClick={() => openModal('add-family-planning')}
          >
            Add Record
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No family planning records found</div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record, index) => (
            <div key={index} className="p-4 border rounded hover:bg-gray-50">
              <div className="flex justify-between">
                <div className="cursor-pointer flex-1" onClick={() => openModal('family-planning-record', record)}>
                  <div className="font-semibold">{record.service_type || 'Family Planning Consultation'}</div>
                  <div className="text-sm text-gray-600">
                    Date: {new Date(record.consultation_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm">Method: {record.contraceptive_method || record.method_chosen}</div>
                  {record.counseling_provided && <div className="text-sm">Counseling: {record.counseling_provided}</div>}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {record.follow_up_date && `Follow-up: ${new Date(record.follow_up_date).toLocaleDateString()}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.provider_name}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('family-planning-record', record);
                      }}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('edit-family-planning', record);
                      }}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('delete-family-planning', record);
                      }}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
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

// Modal Components for managing patient data
const EditPatientInfoModal = ({ name, contact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient_name: name,
    contact_number: contact,
    age: '',
    gender: 'female',
    blood_type: '',
    address: '',
    civil_status: '',
    religion: '',
    occupation: '',
    partner_name: '',
    partner_age: '',
    partner_occupation: '',
    partner_religion: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    lmp: '',
    edd: '',
    gravida: '',
    para: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: undefined,
        middle_name: undefined,
        last_name: undefined,
        phone: formData.contact_number,
        age: formData.age,
        gender: formData.gender,
        blood_type: formData.blood_type,
        address: formData.address,
        civil_status: formData.civil_status || null,
        religion: formData.religion || null,
        occupation: formData.occupation || null,
        partner_name: formData.partner_name || null,
        partner_age: formData.partner_age || null,
        partner_occupation: formData.partner_occupation || null,
        partner_religion: formData.partner_religion || null,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        allergies: formData.allergies,
        notes: formData.medical_history,
        lmp: formData.lmp || null,
        edd: formData.edd || null,
        gravida: formData.gravida || null,
        para: formData.para || null
      };
      await axios.put(`/api/admin/walkin-patients/${encodeURIComponent(name)}_${encodeURIComponent(contact)}`, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating patient info:', error);
      alert('Error updating patient information. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Walk-in Patient Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient Name *</label>
            <input
              type="text"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Number *</label>
            <input
              type="text"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blood Type</label>
            <select
              value={formData.blood_type}
              onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">LMP (Last Menstrual Period)</label>
            <input type="date" value={formData.lmp} onChange={(e) => setFormData({ ...formData, lmp: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">EDD (Expected Delivery Date) 👶</label>
            <input type="date" value={formData.edd} onChange={(e) => setFormData({ ...formData, edd: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gravida (# Pregnancies)</label>
            <input type="number" value={formData.gravida} onChange={(e) => setFormData({ ...formData, gravida: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Para (# Births)</label>
            <input type="number" value={formData.para} onChange={(e) => setFormData({ ...formData, para: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Partner Name</label>
            <input type="text" value={formData.partner_name} onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partner Age</label>
            <input type="number" value={formData.partner_age} onChange={(e) => setFormData({ ...formData, partner_age: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partner Occupation</label>
            <input type="text" value={formData.partner_occupation} onChange={(e) => setFormData({ ...formData, partner_occupation: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partner Religion</label>
            <input type="text" value={formData.partner_religion} onChange={(e) => setFormData({ ...formData, partner_religion: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Civil Status</label>
            <select
              value={formData.civil_status}
              onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Religion</label>
            <input
              type="text"
              value={formData.religion}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Roman Catholic"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Occupation</label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Housewife"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
            <input
              type="text"
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Emergency Contact Phone</label>
            <input
              type="text"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Relationship</label>
            <input
              type="text"
              value={formData.emergency_contact_relationship}
              onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Medical History</label>
          <textarea
            value={formData.medical_history}
            onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="3"
            placeholder="Previous surgeries, chronic conditions, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Allergies</label>
          <textarea
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="2"
            placeholder="Drug allergies, food allergies, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Current Medications</label>
          <textarea
            value={formData.current_medications}
            onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="2"
            placeholder="Current medications and dosages"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Patient Info
          </button>
        </div>
      </form>
    </div>
  );
};

const AddMedicalRecordModal = ({ walkInName, walkInContact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    service_type: 'General Consultation',
    chief_complaint: '',
    diagnosis: '',
    treatment: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/medical-records/walkin', {
        patient_name: walkInName,
        contact_number: walkInContact,
        ...formData
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding medical record:', error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Add Medical Record</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Type</label>
          <select
            value={formData.service_type}
            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="General Consultation">General Consultation</option>
            <option value="Prenatal Checkup">Prenatal Checkup</option>
            <option value="Postpartum Care">Postpartum Care</option>
            <option value="Family Planning">Family Planning</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Chief Complaint</label>
          <textarea
            value={formData.chief_complaint}
            onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Diagnosis</label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Treatment</label>
          <textarea
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="3"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Record
          </button>
        </div>
      </form>
    </div>
  );
};

// Placeholder modal components for the new tabs
const AddPrenatalModal = ({ walkInId, walkInName, walkInContact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    gestational_age: '',
    weight: '',
    blood_pressure: '',
    fundal_height: '',
    fetal_heart_rate: '',
    temperature_c: '',
    heart_rate: '',
    respiratory_rate: '',
    notes: '',
    cycle_choice: 'auto'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use appropriate endpoint based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/prenatal'  // Doctor endpoint
        : '/api/admin/walkin/prenatal';   // Admin/Staff endpoint

      await axios.post(endpoint, {
        patient_name: walkInName,
        contact_number: walkInContact,
        ...formData
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding prenatal visit:', error);
      alert(error.response?.data?.error || 'Error adding prenatal visit. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Schedule Prenatal Visit</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visit Date</label>
            <input
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pregnancy Cycle</label>
            <select
              value={formData.cycle_choice}
              onChange={(e) => setFormData({ ...formData, cycle_choice: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="auto">Automatic (based on records)</option>
              <option value="current">Current cycle</option>
              <option value="new">Start new cycle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gestational Age (weeks)</label>
            <input
              type="number"
              value={formData.gestational_age}
              onChange={(e) => setFormData({ ...formData, gestational_age: e.target.value })}
              className="w-full p-2 border rounded"
              min="1"
              max="42"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blood Pressure</label>
            <input
              type="text"
              value={formData.blood_pressure}
              onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="120/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fundal Height (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.fundal_height}
              onChange={(e) => setFormData({ ...formData, fundal_height: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fetal Heart Rate (bpm)</label>
            <input
              type="number"
              value={formData.fetal_heart_rate}
              onChange={(e) => setFormData({ ...formData, fetal_heart_rate: e.target.value })}
              className="w-full p-2 border rounded"
              min="110"
              max="180"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature_c}
              onChange={(e) => setFormData({ ...formData, temperature_c: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Maternal Heart Rate</label>
            <input
              type="number"
              value={formData.heart_rate}
              onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Respiratory Rate</label>
            <input
              type="number"
              value={formData.respiratory_rate}
              onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Visit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddBabyModal = ({ walkInId, walkInName, walkInContact, prefill = {}, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    baby_name: prefill.baby_name || '',
    birth_date: prefill.birth_date || new Date().toISOString().split('T')[0],
    birth_time: prefill.birth_time || '',
    gender: prefill.gender || '',
    birth_weight: prefill.birth_weight || '',
    birth_length: prefill.birth_length || '',
    head_circumference: prefill.head_circumference || '',
    apgar_score: prefill.apgar_score || '',
    delivery_type: prefill.delivery_type || '',
    complications: prefill.complications || '',
    notes: prefill.notes || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Use appropriate endpoint based on user role
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/babies'  // Doctor endpoint
        : '/api/admin/walkin/babies';   // Admin/Staff endpoint

      // Use walkInName and walkInContact directly
      await axios.post(endpoint, {
        patient_name: walkInName,
        contact_number: walkInContact,
        ...formData
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding baby record:', error);
      alert('Error adding baby record. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Baby Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Baby Name</label>
            <input
              type="text"
              value={formData.baby_name}
              onChange={(e) => setFormData({ ...formData, baby_name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Birth Date</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Birth Time</label>
            <input
              type="time"
              value={formData.birth_time}
              onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Birth Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.birth_weight}
              onChange={(e) => setFormData({ ...formData, birth_weight: e.target.value })}
              className="w-full p-2 border rounded"
              min="0.5"
              max="6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Birth Length (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.birth_length}
              onChange={(e) => setFormData({ ...formData, birth_length: e.target.value })}
              className="w-full p-2 border rounded"
              min="30"
              max="70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Head Circumference (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.head_circumference}
              onChange={(e) => setFormData({ ...formData, head_circumference: e.target.value })}
              className="w-full p-2 border rounded"
              min="25"
              max="45"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">APGAR Score</label>
            <input
              type="number"
              value={formData.apgar_score}
              onChange={(e) => setFormData({ ...formData, apgar_score: e.target.value })}
              className="w-full p-2 border rounded"
              min="0"
              max="10"
              placeholder="0-10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery Type</label>
            <select
              value={formData.delivery_type}
              onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Delivery Type</option>
              <option value="Normal Vaginal Delivery">Normal Vaginal Delivery</option>
              <option value="Cesarean Section">Cesarean Section</option>
              <option value="Assisted Vaginal Delivery">Assisted Vaginal Delivery</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Complications</label>
            <textarea
              value={formData.complications}
              onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
              className="w-full p-2 border rounded"
              rows="2"
              placeholder="Any birth complications"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows="2"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Record
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddLabResultModal = ({ walkInId, walkInName, walkInContact, initialData = {}, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    test_name: initialData.test_name || '',
    test_category: initialData.test_category || 'blood',
    custom_category: '',
    test_date: new Date().toISOString().split('T')[0],
    result_value: '',
    unit: '',
    reference_range: '',
    status: '',
    lab_name: '',
    ordered_by: '',
    notes: ''
  });

  const handleCategoryChange = (category) => {
    setFormData({
      ...formData,
      test_category: category,
      test_name: '' // Clear test name when category changes
    });
  };

  const renderTestNameField = () => {
    if (formData.test_category === 'cervical_screening') {
      return (
        <select
          value={formData.test_name}
          onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Test Type</option>
          <option value="Pap Smear">Pap Smear</option>
          <option value="HPV Test">HPV Test</option>
          <option value="Colposcopy">Colposcopy</option>
          <option value="Cervical Biopsy">Cervical Biopsy</option>
          <option value="LEEP">LEEP</option>
          <option value="Cone Biopsy">Cone Biopsy</option>
        </select>
      );
    }

    return (
      <input
        type="text"
        value={formData.test_name}
        onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
        className="w-full p-2 border rounded"
        required
        placeholder="e.g., Complete Blood Count, Glucose"
      />
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Choose endpoint based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/lab-results'
        : '/api/admin/walkin/lab-results';

      const categoryToSubmit = formData.test_category === 'other' ? formData.custom_category : formData.test_category;
      await axios.post(endpoint, {
        patient_name: walkInName,
        contact_number: walkInContact,
        ...formData,
        test_category: categoryToSubmit
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding lab result:', error);
      alert('Error adding lab result. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Add New Lab Result</h2>
        <p className="text-sm text-gray-600 mb-4 italic">
          Enter detailed laboratory test data to add to the patient's medical record.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.test_category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="blood">Blood Test</option>
              <option value="urine">Urine Test</option>
              <option value="imaging">Imaging</option>
              <option value="cervical_screening">Cervical Screening</option>
              <option value="pregnancy">Pregnancy Test</option>
              <option value="other">Other</option>
            </select>
            {formData.test_category === 'other' && (
              <input
                type="text"
                value={formData.custom_category}
                onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                className="w-full p-2 border rounded mt-2"
                placeholder="Specify category..."
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Test Name</label>
            {renderTestNameField()}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Test Date</label>
            <input
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Result Value</label>
            <input
              type="text"
              value={formData.result_value}
              onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
              className="w-full p-2 border rounded"
              required
              placeholder="e.g., 120, 5.5, Positive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="e.g., mg/dL, mmol/L, %"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reference Range</label>
            <input
              type="text"
              value={formData.reference_range}
              onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="e.g., 70-100 mg/dL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Status</option>
              <option value="Normal">Normal</option>
              <option value="Abnormal">Abnormal</option>
              <option value="Critical">Critical</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Laboratory</label>
            <input
              type="text"
              value={formData.lab_name}
              onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Laboratory name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ordered By</label>
            <input
              type="text"
              value={formData.ordered_by}
              onChange={(e) => setFormData({ ...formData, ordered_by: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Doctor/Provider name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Additional notes or interpretation"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Save Result
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddPostpartumModal = ({ walkInId, walkInName, walkInContact, prenatalVisits = [], onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    days_postpartum: '',
    breastfeeding_status: 'yes',
    notes: '',
    iron_supplement_date: '',
    vitamin_a_date: '',
    foul_smell_discharge: false,
    family_planning_method: '',
    fever: false,
    vaginal_bleeding: false,
    visit_window: '',
    pregnancy_id: ''
  });
  const prenatalCycleIds = Array.from(new Set((prenatalVisits || []).map(v => v.pregnancy_id).filter(id => id !== null && id !== undefined)));
  const [selectedPrenatalCycleId, setSelectedPrenatalCycleId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.days_postpartum) {
        alert('Please select a visit window');
        return;
      }
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Use appropriate endpoint based on user role
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/postpartum'  // Doctor endpoint
        : '/api/admin/walkin/postpartum';   // Admin/Staff endpoint

      const payload = {
        patient_name: walkInName,
        contact_number: walkInContact,
        assessment_date: formData.assessment_date,
        days_postpartum: formData.days_postpartum,
        pregnancy_id: formData.pregnancy_id === '' ? null : Number(formData.pregnancy_id),
        breastfeeding_status: formData.breastfeeding_status,
        notes: formData.notes || '',
        iron_supplement_date: formData.iron_supplement_date || null,
        vitamin_a_date: formData.vitamin_a_date || null,
        foul_smell_discharge: !!formData.foul_smell_discharge,
        family_planning_method: formData.family_planning_method || null,
        fever: !!formData.fever,
        vaginal_bleeding: !!formData.vaginal_bleeding,
        // legacy fields to satisfy backend insert signature
        bleeding_status: '',
        pain_level: '',
        mood_assessment: '',
        temperature: '',
        blood_pressure: '',
        fundal_height: '',
        lochia_color: '',
        episiotomy_healing: ''
      };
      await axios.post(endpoint, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding postpartum assessment:', error);
      alert('Error adding postpartum assessment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Postpartum Assessment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pregnancy Cycle</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedPrenatalCycleId}
              onChange={(e) => {
                setSelectedPrenatalCycleId(e.target.value);
                setFormData({ ...formData, pregnancy_id: e.target.value });
              }}
            >
              <option value="">Unassigned</option>
              {prenatalCycleIds.map((id) => (
                <option key={id} value={id}>Cycle {id}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Visit Window *</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="visit_window" required checked={formData.visit_window === '24h'} onChange={() => setFormData({ ...formData, visit_window: '24h', days_postpartum: 1 })} />
                  <span>Within 24 hours</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="visit_window" required checked={formData.visit_window === '7d'} onChange={() => setFormData({ ...formData, visit_window: '7d', days_postpartum: 7 })} />
                  <span>Within 7 days</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assessment Date *</label>
              <input type="date" className="w-full p-2 border rounded" value={formData.assessment_date} onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.breastfeeding_status === 'yes'} onChange={(e) => setFormData({ ...formData, breastfeeding_status: e.target.checked ? 'yes' : 'no' })} />
              <span className="text-sm">Currently breastfeeding</span>
            </label>
            <div>
              <label className="block text-sm">Family Planning To Be Used</label>
              <input className="mt-1 w-full border rounded px-3 py-2" value={formData.family_planning_method} onChange={(e) => setFormData({ ...formData, family_planning_method: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.fever} onChange={(e) => setFormData({ ...formData, fever: e.target.checked })} />
              <span className="text-sm">Fever</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.vaginal_bleeding} onChange={(e) => setFormData({ ...formData, vaginal_bleeding: e.target.checked })} />
              <span className="text-sm">Vaginal bleeding</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.foul_smell_discharge} onChange={(e) => setFormData({ ...formData, foul_smell_discharge: e.target.checked })} />
              <span className="text-sm">Foul-smelling vaginal discharge</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Vitamin A Date</label>
              <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={formData.vitamin_a_date} onChange={(e) => setFormData({ ...formData, vitamin_a_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm">Iron Supplement Date</label>
              <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={formData.iron_supplement_date} onChange={(e) => setFormData({ ...formData, iron_supplement_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm">Notes</label>
            <textarea className="mt-1 w-full border rounded px-3 py-2" rows="3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save Assessment</button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddFamilyPlanningModal = ({ walkInId, walkInName, walkInContact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    consultation_date: new Date().toISOString().split('T')[0],
    method_chosen: '',
    method_started_date: '',
    method_category: 'Natural',
    counseling_done: false,
    side_effects: '',
    follow_up_date: '',
    notes: '',
    counseled_by: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Use appropriate endpoint based on user role
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/family-planning'  // Doctor endpoint
        : '/api/admin/walkin/family-planning';   // Admin/Staff endpoint

      const payload = {
        patient_name: walkInName,
        contact_number: walkInContact,
        ...formData
      };

      await axios.post(endpoint, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding family planning record:', error);
      alert('Error adding family planning record. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Family Planning Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Consultation Date *</label>
              <input
                type="date"
                value={formData.consultation_date}
                onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Method Category</label>
              <select
                value={formData.method_category}
                onChange={(e) => setFormData({ ...formData, method_category: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="Natural">Natural</option>
                <option value="Barrier">Barrier</option>
                <option value="Hormonal">Hormonal</option>
                <option value="Long-acting">Long-acting</option>
                <option value="Permanent">Permanent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Method Chosen</label>
            <input
              type="text"
              value={formData.method_chosen}
              onChange={(e) => setFormData({ ...formData, method_chosen: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="e.g., Pills, IUD, Condoms, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Method Started Date</label>
              <input
                type="date"
                value={formData.method_started_date}
                onChange={(e) => setFormData({ ...formData, method_started_date: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Date</label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Side Effects/Concerns</label>
            <textarea
              value={formData.side_effects}
              onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Any side effects or concerns discussed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Additional notes about the consultation"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.counseling_done}
                onChange={(e) => setFormData({ ...formData, counseling_done: e.target.checked })}
                className="mr-2"
              />
              Counseling Done
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Modal Components
const EditPrenatalModal = ({ prenatal, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    visit_date: prenatal.visit_date ? new Date(prenatal.visit_date).toISOString().split('T')[0] : '',
    gestational_age: prenatal.gestational_age || '',
    weight: prenatal.weight || '',
    blood_pressure: prenatal.blood_pressure || '',
    fundal_height: prenatal.fundal_height || '',
    fetal_heart_rate: prenatal.fetal_heart_rate || '',
    notes: prenatal.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/admin/walkin/prenatal/${prenatal.id}`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating prenatal visit:', error);
      alert('Failed to update prenatal visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Prenatal Visit</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visit Date</label>
            <input
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gestational Age (weeks)</label>
            <input
              type="number"
              value={formData.gestational_age}
              onChange={(e) => setFormData({ ...formData, gestational_age: e.target.value })}
              className="w-full p-2 border rounded"
              min="0"
              max="42"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blood Pressure</label>
            <input
              type="text"
              value={formData.blood_pressure}
              onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="e.g., 120/80"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fundal Height (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.fundal_height}
              onChange={(e) => setFormData({ ...formData, fundal_height: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fetal Heart Rate (bpm)</label>
            <input
              type="number"
              value={formData.fetal_heart_rate}
              onChange={(e) => setFormData({ ...formData, fetal_heart_rate: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Visit'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const EditBabyModal = ({ baby, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    baby_name: baby.baby_name || '',
    birth_date: baby.birth_date ? new Date(baby.birth_date).toISOString().split('T')[0] : '',
    gender: baby.gender || 'male',
    birth_weight: baby.birth_weight || '',
    birth_length: baby.birth_length || '',
    apgar_score: baby.apgar_score || '',
    delivery_type: baby.delivery_type || 'normal',
    notes: baby.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/admin/walkin/babies/${baby.id}`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating baby record:', error);
      alert('Failed to update baby record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Baby Record</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Baby Name</label>
            <input
              type="text"
              value={formData.baby_name}
              onChange={(e) => setFormData({ ...formData, baby_name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Birth Date</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Birth Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.birth_weight}
              onChange={(e) => setFormData({ ...formData, birth_weight: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Birth Length (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.birth_length}
              onChange={(e) => setFormData({ ...formData, birth_length: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">APGAR Score</label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.apgar_score}
              onChange={(e) => setFormData({ ...formData, apgar_score: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Delivery Type</label>
          <select
            value={formData.delivery_type}
            onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="normal">Normal Delivery</option>
            <option value="cesarean">Cesarean Section</option>
            <option value="assisted">Assisted Delivery</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Record'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const EditLabResultModal = ({ labResult, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    test_name: labResult.test_name || '',
    test_date: labResult.test_date ? new Date(labResult.test_date).toISOString().split('T')[0] : '',
    result_value: labResult.result_value || '',
    unit: labResult.unit || '',
    reference_range: labResult.reference_range || '',
    status: labResult.status || 'normal',
    notes: labResult.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/admin/walkin/lab-results/${labResult.id}`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating lab result:', error);
      alert('Failed to update lab result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Lab Result</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Test Name</label>
            <input
              type="text"
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Test Date</label>
            <input
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Result Value</label>
            <input
              type="text"
              value={formData.result_value}
              onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="abnormal">Abnormal</option>
              <option value="critical">Critical</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reference Range</label>
          <input
            type="text"
            value={formData.reference_range}
            onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="e.g., 70-100 mg/dL"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Result'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const EditPostpartumModal = ({ postpartum, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assessment_date: postpartum.assessment_date ? new Date(postpartum.assessment_date).toISOString().split('T')[0] : '',
    days_postpartum: postpartum.days_postpartum || '',
    bleeding_status: postpartum.bleeding_status || 'normal',
    pain_level: postpartum.pain_level || '0',
    breast_condition: postpartum.breast_condition || 'normal',
    mood_assessment: postpartum.mood_assessment || 'stable',
    notes: postpartum.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/admin/walkin/postpartum/${postpartum.id}`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating postpartum assessment:', error);
      alert('Failed to update postpartum assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Postpartum Assessment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assessment Date</label>
            <input
              type="date"
              value={formData.assessment_date}
              onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Days Postpartum</label>
            <input
              type="number"
              value={formData.days_postpartum}
              onChange={(e) => setFormData({ ...formData, days_postpartum: e.target.value })}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bleeding Status</label>
            <select
              value={formData.bleeding_status}
              onChange={(e) => setFormData({ ...formData, bleeding_status: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="heavy">Heavy</option>
              <option value="light">Light</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pain Level (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.pain_level}
              onChange={(e) => setFormData({ ...formData, pain_level: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Breast Condition</label>
            <select
              value={formData.breast_condition}
              onChange={(e) => setFormData({ ...formData, breast_condition: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="engorged">Engorged</option>
              <option value="cracked">Cracked</option>
              <option value="infected">Infected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mood Assessment</label>
            <select
              value={formData.mood_assessment}
              onChange={(e) => setFormData({ ...formData, mood_assessment: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="stable">Stable</option>
              <option value="anxious">Anxious</option>
              <option value="depressed">Depressed</option>
              <option value="euphoric">Euphoric</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Assessment'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const EditFamilyPlanningModal = ({ familyPlanning, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    consultation_date: familyPlanning.consultation_date ? new Date(familyPlanning.consultation_date).toISOString().split('T')[0] : '',
    method_chosen: familyPlanning.method_chosen || '',
    method_started_date: familyPlanning.method_started_date ? new Date(familyPlanning.method_started_date).toISOString().split('T')[0] : '',
    method_category: familyPlanning.method_category || 'Natural',
    counseling_done: familyPlanning.counseling_done || false,
    side_effects: familyPlanning.side_effects || '',
    follow_up_date: familyPlanning.follow_up_date ? new Date(familyPlanning.follow_up_date).toISOString().split('T')[0] : '',
    notes: familyPlanning.notes || '',
    counseled_by: familyPlanning.counseled_by || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/api/admin/walkin/family-planning/${familyPlanning.id}`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating family planning record:', error);
      alert('Failed to update family planning record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Family Planning Record</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Consultation Date *</label>
            <input
              type="date"
              value={formData.consultation_date}
              onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Method Category</label>
            <select
              value={formData.method_category}
              onChange={(e) => setFormData({ ...formData, method_category: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="Natural">Natural</option>
              <option value="Barrier">Barrier</option>
              <option value="Hormonal">Hormonal</option>
              <option value="IUD">IUD</option>
              <option value="Permanent">Permanent</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Method Chosen</label>
          <input
            type="text"
            value={formData.method_chosen}
            onChange={(e) => setFormData({ ...formData, method_chosen: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="e.g., Pills, IUD, Condoms, etc."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Method Started Date</label>
            <input
              type="date"
              value={formData.method_started_date}
              onChange={(e) => setFormData({ ...formData, method_started_date: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Follow-up Date</label>
            <input
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Side Effects/Concerns</label>
          <textarea
            value={formData.side_effects}
            onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
            className="w-full p-2 border rounded"
            rows="2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Counseled By</label>
          <input
            type="text"
            value={formData.counseled_by}
            onChange={(e) => setFormData({ ...formData, counseled_by: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Healthcare provider name"
          />
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.counseling_done}
              onChange={(e) => setFormData({ ...formData, counseling_done: e.target.checked })}
              className="mr-2"
            />
            Counseling Done
          </label>
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Record'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ type, item, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (type) {
        case 'prenatal visit':
          endpoint = `/api/admin/walkin/prenatal/${item.id}`;
          break;
        case 'baby record':
          endpoint = `/api/admin/walkin/babies/${item.id}`;
          break;
        case 'lab result':
          endpoint = `/api/admin/walkin/lab-results/${item.id}`;
          break;
        case 'postpartum assessment':
          endpoint = `/api/admin/walkin/postpartum/${item.id}`;
          break;
        case 'family planning record':
          endpoint = `/api/admin/walkin/family-planning/${item.id}`;
          break;
        default:
          throw new Error('Unknown item type');
      }

      await axios.delete(endpoint);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Delete {type}</h2>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this {type}? This action cannot be undone.
      </p>

      {/* Show some identifying information about the item */}
      <div className="bg-gray-50 p-4 rounded mb-6">
        {type === 'prenatal visit' && (
          <div>
            <p><strong>Visit Date:</strong> {item.visit_date ? new Date(item.visit_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gestational Age:</strong> {item.gestational_age || 'N/A'} weeks</p>
          </div>
        )}
        {type === 'baby record' && (
          <div>
            <p><strong>Baby Name:</strong> {item.baby_name || 'N/A'}</p>
            <p><strong>Birth Date:</strong> {item.birth_date ? new Date(item.birth_date).toLocaleDateString() : 'N/A'}</p>
          </div>
        )}
        {type === 'lab result' && (
          <div>
            <p><strong>Test Name:</strong> {item.test_name || 'N/A'}</p>
            <p><strong>Test Date:</strong> {item.test_date ? new Date(item.test_date).toLocaleDateString() : 'N/A'}</p>
          </div>
        )}
        {type === 'postpartum assessment' && (
          <div>
            <p><strong>Assessment Date:</strong> {item.assessment_date ? new Date(item.assessment_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Days Postpartum:</strong> {item.days_postpartum || 'N/A'}</p>
          </div>
        )}
        {type === 'family planning record' && (
          <div>
            <p><strong>Service Type:</strong> {item.service_type || 'N/A'}</p>
            <p><strong>Consultation Date:</strong> {item.consultation_date ? new Date(item.consultation_date).toLocaleDateString() : 'N/A'}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Admission Modal Components for Walk-in Patients
const AddAdmissionModal = ({ walkInName, walkInContact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient_name: walkInName || '',
    contact_number: walkInContact || '',
    admission_reason: 'In labor',
    pregnancy_cycle: '',
    room: '',
    status: 'admitted',
    delivery_type: '',
    outcome: '',
    baby_weight_kg: '',
    apgar1: '',
    apgar5: '',
    complications: '',
    disposition: ''
  });
  const [loading, setLoading] = useState(false);
  const [cycleOptions, setCycleOptions] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);

  useEffect(() => {
    const loadCycles = async () => {
      try {
        setLoadingCycles(true);
        const name = (walkInName || '').trim();
        const contact = (walkInContact || '').trim();
        if (!name || !contact) { setCycleOptions([]); return; }
        const res = await axios.get('/api/admin/walkin/prenatal', { params: { patient_name: name, contact_number: contact } });
        const records = res.data || [];
        const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(v => v !== null && v !== undefined))).sort((a, b) => a - b);
        const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
        setCycleOptions(opts);
        setFormData(prev => ({ ...prev, pregnancy_cycle: opts.find(o => o.value === prev.pregnancy_cycle) ? prev.pregnancy_cycle : '' }));
      } catch (e) {
        setCycleOptions([]);
      } finally {
        setLoadingCycles(false);
      }
    };
    loadCycles();
  }, [walkInName, walkInContact]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/admin/admissions', {
        ...formData,
        patient_type: 'walk-in'
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating admission:', error);
      alert(error.response?.data?.error || 'Failed to create admission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Add New Admission</h2>

      {/* Patient Info Display */}
      <div className="mb-4 p-3 bg-orange-50 rounded">
        <div className="text-sm text-orange-800">
          <div><strong>Walk-in Patient</strong></div>
          <div><strong>Name:</strong> {walkInName}</div>
          <div><strong>Contact:</strong> {walkInContact}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Information */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient Name *</label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number *</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
        </div>

        {/* Admission Details */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Admission Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Admission Reason *</label>
              <select
                value={formData.admission_reason}
                onChange={(e) => setFormData({ ...formData, admission_reason: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select reason</option>
                <option value="In labor">In labor</option>
                <option value="Delivery">Delivery</option>
                <option value="Giving birth">Giving birth</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">Lying-in clinic admits birth-related cases only.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Room number or name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cycle</label>
              <select
                className="w-full p-2 border rounded"
                value={formData.pregnancy_cycle}
                onChange={(e) => setFormData({ ...formData, pregnancy_cycle: e.target.value })}
              >
                <option value="">Select cycle (from prenatal)</option>
                {loadingCycles ? <option value="" disabled>Loading…</option> : null}
                {!loadingCycles && cycleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="admitted">Admitted</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical Information (for lying-in clinic) */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Medical Information (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Type</label>
              <select
                value={formData.delivery_type}
                onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select delivery type</option>
                <option value="Normal Spontaneous Delivery">Normal Spontaneous Delivery</option>
                <option value="Cesarean Section">Cesarean Section</option>
                <option value="Assisted Delivery">Assisted Delivery</option>
                <option value="VBAC">VBAC (Vaginal Birth After Cesarean)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Outcome</label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select outcome</option>
                <option value="Live Birth">Live Birth</option>
                <option value="Stillbirth">Stillbirth</option>
                <option value="Miscarriage">Miscarriage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Baby Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.baby_weight_kg}
                onChange={(e) => setFormData({ ...formData, baby_weight_kg: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., 3.2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">APGAR 1 min</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.apgar1}
                onChange={(e) => setFormData({ ...formData, apgar1: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="0-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">APGAR 5 min</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.apgar5}
                onChange={(e) => setFormData({ ...formData, apgar5: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="0-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Complications</label>
              <input
                type="text"
                value={formData.complications}
                onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Any complications during delivery"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Admission'}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditAdmissionModal = ({ admission, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient_name: admission.patient_name || '',
    contact_number: admission.contact_number || '',
    admission_reason: admission.admission_reason || '',
    pregnancy_cycle: admission.pregnancy_cycle || '',
    gravida: (() => { const m = String(admission.pregnancy_cycle || '').match(/G(\d+)/); return m ? m[1] : ''; })(),
    para: (() => { const m = String(admission.pregnancy_cycle || '').match(/P(\d+)/); return m ? m[1] : ''; })(),
    room: admission.room || '',
    status: admission.status || 'admitted',
    delivery_type: admission.delivery_type || '',
    outcome: admission.outcome || '',
    baby_weight_kg: admission.baby_weight_kg || '',
    apgar1: admission.apgar1 || '',
    apgar5: admission.apgar5 || '',
    complications: admission.complications || '',
    disposition: admission.disposition || ''
  });
  const [loading, setLoading] = useState(false);
  const [cycleOptions, setCycleOptions] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`/api/admin/admissions/${admission.id}`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating admission:', error);
      alert(error.response?.data?.error || 'Failed to update admission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Edit Admission #{admission.id}</h2>

      {/* Patient Info Display */}
      <div className="mb-4 p-3 bg-orange-50 rounded">
        <div className="text-sm text-orange-800">
          <div><strong>Walk-in Patient</strong></div>
          <div><strong>Admitted:</strong> {admission.admission_date && new Date(admission.admission_date).toLocaleString()}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient Name *</label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number *</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
        </div>

        {/* Admission Details */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Admission Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Admission Reason *</label>
              <select
                value={formData.admission_reason}
                onChange={(e) => setFormData({ ...formData, admission_reason: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select reason</option>
                <option value="In labor">In labor</option>
                <option value="Delivery">Delivery</option>
                <option value="Giving birth">Giving birth</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">Lying-in clinic admits birth-related cases only.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Room number or name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cycle</label>
              <select
                className="w-full p-2 border rounded"
                value={formData.pregnancy_cycle}
                onChange={(e) => setFormData({ ...formData, pregnancy_cycle: e.target.value })}
              >
                <option value="">Select cycle (from prenatal)</option>
                {loadingCycles ? <option value="" disabled>Loading…</option> : null}
                {!loadingCycles && cycleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cycle of Pregnancy</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="w-full p-2 border rounded"
                  value={formData.gravida}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gravida: e.target.value,
                    pregnancy_cycle: `G${e.target.value || 0}P${prev.para || 0}`
                  }))}
                >
                  <option value="">Gravida (G)</option>
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <option key={`g-${n}`} value={String(n)}>G{n}</option>
                  ))}
                </select>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.para}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    para: e.target.value,
                    pregnancy_cycle: `G${prev.gravida || 0}P${e.target.value || 0}`
                  }))}
                >
                  <option value="">Para (P)</option>
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <option key={`p-${n}`} value={String(n)}>P{n}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="admitted">Admitted</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Medical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Type</label>
              <select
                value={formData.delivery_type}
                onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select delivery type</option>
                <option value="Normal Spontaneous Delivery">Normal Spontaneous Delivery</option>
                <option value="Cesarean Section">Cesarean Section</option>
                <option value="Assisted Delivery">Assisted Delivery</option>
                <option value="VBAC">VBAC (Vaginal Birth After Cesarean)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Outcome</label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select outcome</option>
                <option value="Live Birth">Live Birth</option>
                <option value="Stillbirth">Stillbirth</option>
                <option value="Miscarriage">Miscarriage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Baby Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.baby_weight_kg}
                onChange={(e) => setFormData({ ...formData, baby_weight_kg: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., 3.2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">APGAR 1 min</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.apgar1}
                onChange={(e) => setFormData({ ...formData, apgar1: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="0-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">APGAR 5 min</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.apgar5}
                onChange={(e) => setFormData({ ...formData, apgar5: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="0-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Complications</label>
              <input
                type="text"
                value={formData.complications}
                onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Any complications"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Admission'}
          </button>
        </div>
      </form>
    </div>
  );
};

const DischargeAdmissionModal = ({ admission, onClose, onSuccess }) => {
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`/api/admin/admissions/${admission.id}/discharge`, {
        discharge_notes: dischargeNotes
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error discharging patient:', error);
      alert(error.response?.data?.error || 'Failed to discharge patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Discharge Patient</h2>
      <div className="mb-4 p-3 bg-orange-50 rounded">
        <p><strong>Walk-in Patient:</strong> {admission.patient_name}</p>
        <p><strong>Admission ID:</strong> #{admission.id}</p>
        <p><strong>Room:</strong> {admission.room || 'Not assigned'}</p>
        <p><strong>Admitted:</strong> {admission.admission_date && new Date(admission.admission_date).toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Discharge Notes</label>
          <textarea
            value={dischargeNotes}
            onChange={(e) => setDischargeNotes(e.target.value)}
            className="w-full p-2 border rounded"
            rows="4"
            placeholder="Enter discharge notes, instructions, or follow-up care..."
            required
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Discharging...' : 'Discharge Patient'}
          </button>
        </div>
      </form>
    </div>
  );
};

// View Modal Components
const ViewAdmissionModal = ({ admission, onClose }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Admission Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Admission ID:</span> #{admission.id}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs ${admission.status === 'discharged' ? 'bg-green-100 text-green-800' :
            admission.status === 'admitted' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>{admission.status}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Admission Date:</span> {admission.admission_date ? new Date(admission.admission_date).toLocaleString() : 'Not specified'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Room:</span> {admission.room || 'Not assigned'}</div>
          {admission.pregnancy_cycle && (
            <div className="font-medium"><span className="text-sm text-gray-600">Pregnancy Cycle:</span> {admission.pregnancy_cycle}</div>
          )}
        </div>

        <div className="font-medium"><span className="text-sm text-gray-600">Admission Reason:</span> {admission.admission_reason}</div>

        {(admission.delivery_type || admission.outcome) && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Medical Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {admission.delivery_type && (
                <div className="font-medium"><span className="text-sm text-gray-600">Delivery Type:</span> {admission.delivery_type}</div>
              )}
              {admission.outcome && (
                <div className="font-medium"><span className="text-sm text-gray-600">Outcome:</span> {admission.outcome}</div>
              )}
            </div>
          </div>
        )}

        {(admission.baby_weight_kg || admission.apgar1 || admission.apgar5) && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Baby Information</h3>
            <div className="grid grid-cols-3 gap-4">
              {admission.baby_weight_kg && (
                <div className="font-medium"><span className="text-sm text-gray-600">Baby Weight:</span> {admission.baby_weight_kg} kg</div>
              )}
              {admission.apgar1 && (
                <div className="font-medium"><span className="text-sm text-gray-600">APGAR 1 min:</span> {admission.apgar1}</div>
              )}
              {admission.apgar5 && (
                <div className="font-medium"><span className="text-sm text-gray-600">APGAR 5 min:</span> {admission.apgar5}</div>
              )}
            </div>
          </div>
        )}

        {admission.complications && (
          <div className="font-medium"><span className="text-sm text-gray-600">Complications:</span> {admission.complications}</div>
        )}

        {admission.disposition && (
          <div className="font-medium"><span className="text-sm text-gray-600">Disposition:</span> {admission.disposition}</div>
        )}

        {admission.discharge_date && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Discharge Information</h3>
            <div className="font-medium"><span className="text-sm text-gray-600">Discharge Date:</span> {new Date(admission.discharge_date).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const ViewPrenatalModal = ({ prenatal, onClose }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Prenatal Visit Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Visit Date:</span> {new Date(prenatal.visit_date).toLocaleDateString()}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Gestational Age:</span> {prenatal.gestational_age} weeks</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Weight:</span> {prenatal.weight} kg</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Blood Pressure:</span> {prenatal.blood_pressure}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Fundal Height:</span> {prenatal.fundal_height} cm</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Fetal Heart Rate:</span> {prenatal.fetal_heart_rate} bpm</div>
        </div>

        {prenatal.notes && (
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {prenatal.notes}</div>
        )}
      </div>
    </div>
  );
};

const ViewPostpartumModal = ({ postpartum, onClose }) => {
  const yn = (v) => (v === 1 || v === '1' || v === true ? 'Yes' : v === 0 || v === '0' || v === false ? 'No' : 'N/A');
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Postpartum Assessment Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="space-y-4">
        <div className="font-medium"><span className="text-sm text-gray-600">Pregnancy Cycle:</span> {postpartum.pregnancy_id ?? 'Unassigned'}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Assessment Date:</span> {postpartum.assessment_date ? new Date(postpartum.assessment_date).toLocaleDateString() : 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Day Postpartum:</span> {postpartum.day_postpartum ?? postpartum.days_postpartum ?? 'N/A'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Breastfeeding:</span> {(postpartum.breastfeeding_status || '').toString().toLowerCase() === 'yes' ? 'Yes' : ((postpartum.breastfeeding_status || '').toString().toLowerCase() === 'no' ? 'No' : (postpartum.breastfeeding_status || 'N/A'))}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Fever:</span> {yn(postpartum.fever)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Vaginal Bleeding:</span> {yn(postpartum.vaginal_bleeding)}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Foul Smelling Vaginal Discharge:</span> {yn(postpartum.foul_smell_discharge)}</div>
        </div>
        <div className="font-medium"><span className="text-sm text-gray-600">Family Planning To Be Used:</span> {postpartum.family_planning_method || 'N/A'}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Vitamin A Date:</span> {postpartum.vitamin_a_date ? new Date(postpartum.vitamin_a_date).toLocaleDateString() : 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Iron Supplement Date:</span> {postpartum.iron_supplement_date ? new Date(postpartum.iron_supplement_date).toLocaleDateString() : 'N/A'}</div>
        </div>
        {postpartum.notes && (
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {postpartum.notes}</div>
        )}
      </div>
    </div>
  );
};

// ViewBabyModal is now imported from ./modals/BabyViewModal

const ViewLabResultModal = ({ labResult, onClose, onPrint }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Lab Result Details</h2>
        <div className="flex items-center gap-2">
          {onPrint && (<button onClick={onPrint} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Print PDF</button>)}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Test Date:</span> {new Date(labResult.test_date).toLocaleDateString()}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Test Type:</span> {labResult.test_type}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Test Name:</span> {labResult.test_name}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Result Value:</span> {labResult.result_value} {labResult.unit}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Normal Range:</span> {labResult.normal_range}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs ${labResult.status === 'normal' ? 'bg-green-100 text-green-800' :
            labResult.status === 'abnormal' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>{labResult.status}</span></div>
        </div>

        {labResult.interpretation && (
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Interpretation:</span> {labResult.interpretation}</div>
        )}

        {labResult.notes && (
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {labResult.notes}</div>
        )}
      </div>
    </div>
  );
};

const ViewFamilyPlanningModal = ({ familyPlanning, onClose }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Family Planning Record Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Consultation Date:</span> {new Date(familyPlanning.consultation_date).toLocaleDateString()}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Method:</span> {familyPlanning.method}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Method Category:</span> {familyPlanning.method_category}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Method Started:</span> {familyPlanning.method_started_date ? new Date(familyPlanning.method_started_date).toLocaleDateString() : 'Not started'}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Counseling Done:</span> {familyPlanning.counseling_done ? 'Yes' : 'No'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Date:</span> {familyPlanning.follow_up_date ? new Date(familyPlanning.follow_up_date).toLocaleDateString() : 'Not scheduled'}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs ${familyPlanning.status === 'active' ? 'bg-green-100 text-green-800' :
            familyPlanning.status === 'discontinued' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>{familyPlanning.status}</span></div>
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Side Effects:</span> {familyPlanning.side_effects || 'None reported'}</div>
        </div>

        {familyPlanning.notes && (
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {familyPlanning.notes}</div>
        )}
      </div>
    </div>
  );
};

// View Immunization Modal Component
const ViewImmunizationModal = ({ immunization, onClose, onPrint }) => {
  if (!immunization) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Immunization Details</h2>
        <div className="flex items-center gap-2">
          {onPrint && (<button onClick={onPrint} className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600">Print PDF</button>)}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="font-medium"><span className="text-sm text-gray-600">Vaccine Type:</span> {immunization.vaccine_type || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Date Given:</span> {immunization.date_given ? new Date(immunization.date_given).toLocaleDateString() : 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Dose Number:</span> {immunization.dose_number || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Injection Site:</span> {immunization.injection_site || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Healthcare Provider:</span> {immunization.healthcare_provider || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Batch Number:</span> {immunization.batch_number || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Manufacturer:</span> {immunization.manufacturer || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Next Due Date:</span> {immunization.next_due_date ? new Date(immunization.next_due_date).toLocaleDateString() : 'N/A'}</div>
        <div className="md:col-span-2 font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {immunization.notes || 'None'}</div>
        <div className="md:col-span-2 font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Adverse Reactions:</span> {immunization.adverse_reactions || 'None reported'}</div>
      </div>
    </div>
  );
};

// Edit Immunization Modal Component
const EditImmunizationModal = ({ immunization, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    vaccine_type: immunization?.vaccine_type || '',
    date_given: immunization?.date_given ? new Date(immunization.date_given).toISOString().split('T')[0] : '',
    dose_number: immunization?.dose_number || '',
    injection_site: immunization?.injection_site || '',
    healthcare_provider: immunization?.healthcare_provider || '',
    batch_number: immunization?.batch_number || '',
    manufacturer: immunization?.manufacturer || '',
    next_due_date: immunization?.next_due_date ? new Date(immunization.next_due_date).toISOString().split('T')[0] : '',
    notes: immunization?.notes || '',
    adverse_reactions: immunization?.adverse_reactions || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const base = getApiBasePath('write');
      await axios.put(`${base}/walkin/immunizations/${immunization.id}`, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating immunization:', error);
      alert(error.response?.data?.error || 'Failed to update immunization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Immunization Record</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700">Vaccine Type</label>
          <input name="vaccine_type" value={formData.vaccine_type} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Date Given</label>
          <input type="date" name="date_given" value={formData.date_given} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Dose Number</label>
          <input name="dose_number" value={formData.dose_number} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Injection Site</label>
          <input name="injection_site" value={formData.injection_site} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Healthcare Provider</label>
          <input name="healthcare_provider" value={formData.healthcare_provider} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Batch Number</label>
          <input name="batch_number" value={formData.batch_number} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Manufacturer</label>
          <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Next Due Date</label>
          <input type="date" name="next_due_date" value={formData.next_due_date} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700">Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700">Adverse Reactions</label>
          <textarea name="adverse_reactions" value={formData.adverse_reactions} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
        </div>

        <div className="md:col-span-2 flex justify-end mt-2 gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Add Screening Modal Component
// View Screening Modal Component
const ViewScreeningModal = ({ screening, onClose, onPrint }) => {
  if (!screening) return null;

  const testType = screening.screening_type || screening.test_type || 'N/A';
  const dateVal = screening.screening_date || screening.date_performed;
  const dateText = dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
  const resultText = (screening.results ?? screening.result) || 'N/A';
  const rawStatus = screening.status || 'pending';
  const uiStatus = (rawStatus === 'completed' ? 'normal' : rawStatus).toLowerCase();
  const statusClass = uiStatus === 'normal'
    ? 'bg-green-100 text-green-800'
    : uiStatus === 'abnormal'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';

  const provider = screening.screened_by ?? screening.healthcare_provider ?? 'N/A';
  const labName = screening.lab_name || 'N/A';
  const followUp = (screening.follow_up_required ?? screening.follow_up) ? 'Yes' : 'No';
  const followUpDate = screening.follow_up_date ? new Date(screening.follow_up_date).toLocaleDateString() : 'N/A';
  const equipment = screening.equipment_used || 'N/A';
  const location = screening.test_location || screening.location || 'N/A';
  const notes = screening.notes || 'None';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Screening Details</h2>
        <div className="flex items-center gap-2">
          {onPrint && (<button onClick={onPrint} className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600">Print PDF</button>)}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="font-medium"><span className="text-sm text-gray-600">Test Type:</span> {testType}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Date Performed:</span> {dateText}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Result:</span> {resultText}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>{uiStatus}</span></div>
        <div className="font-medium"><span className="text-sm text-gray-600">Healthcare Provider:</span> {provider}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Lab Name:</span> {labName}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Required:</span> {followUp}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Date:</span> {followUpDate}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Equipment Used:</span> {equipment}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Test Location:</span> {location}</div>
        <div className="md:col-span-2 font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {notes}</div>
      </div>
    </div>
  );
};

const AddScreeningModal = ({ walkInId, walkInName, walkInContact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    test_type: '',
    date_performed: '',
    result: '',
    status: 'pending',
    healthcare_provider: '',
    notes: '',
    equipment_used: '',
    test_location: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const screeningData = {
        ...formData,
        patient_name: walkInName,
        contact_number: walkInContact
      };

      // Choose endpoint based on user role (doctor vs admin/staff)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/screenings'
        : '/api/admin/walkin/screenings';

      await axios.post(endpoint, screeningData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding screening:', error);
      alert(error.response?.data?.error || 'Failed to add screening record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Add New Screening Record</h2>
        <p className="text-sm text-gray-600 mb-4 italic">
          Document screening test results and findings to maintain comprehensive health records.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Type</label>
              <select
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Test Type</option>
                <option value="Newborn Screening Test">Newborn Screening Test</option>
                <option value="Newborn Hearing Test">Newborn Hearing Test</option>
                <option value="Hearing Test">Hearing Test</option>
                <option value="Blood Spot Test">Blood Spot Test</option>
                <option value="Heart Defect Screening">Heart Defect Screening</option>
                <option value="Eye Examination">Eye Examination</option>
                <option value="Hip Examination">Hip Examination</option>
                <option value="Metabolic Screening">Metabolic Screening</option>
                <option value="Genetic Screening">Genetic Screening</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date Performed</label>
              <input
                type="date"
                value={formData.date_performed}
                onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Result</label>
              <input
                type="text"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter test result"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="pending">Pending</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="requires_followup">Requires Follow-up</option>
                <option value="inconclusive">Inconclusive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Healthcare Provider</label>
              <input
                type="text"
                value={formData.healthcare_provider}
                onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Provider name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Equipment Used</label>
              <input
                type="text"
                value={formData.equipment_used}
                onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Equipment/device used"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Test Location</label>
            <input
              type="text"
              value={formData.test_location}
              onChange={(e) => setFormData({ ...formData, test_location: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Where the test was performed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows="3"
              placeholder="Additional notes or observations"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Screening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Screening Modal Component
const EditScreeningModal = ({ screening, onClose, onSuccess }) => {
  const toDateInput = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const [formData, setFormData] = useState({
    test_type: screening.screening_type || screening.test_type || '',
    date_performed: toDateInput(screening.screening_date || screening.date_performed),
    result: screening.results ?? screening.result ?? '',
    status: (screening.status === 'completed' ? 'normal' : (screening.status || 'pending')),
    healthcare_provider: screening.screened_by ?? screening.healthcare_provider ?? '',
    notes: screening.notes ?? '',
    follow_up_required: !!screening.follow_up_required,
    follow_up_date: toDateInput(screening.follow_up_date),
    equipment_used: screening.equipment_used ?? '',
    test_location: screening.test_location ?? ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        test_type: formData.test_type,
        date_performed: formData.date_performed,
        result: formData.result,
        status: formData.status,
        healthcare_provider: formData.healthcare_provider,
        notes: formData.notes,
        follow_up_required: formData.follow_up_required,
        follow_up_date: formData.follow_up_date
      };

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const base = user.role === 'doctor' ? '/api/doctors' : '/api/admin';
      await axios.put(`${base}/walkin/screenings/${screening.id}`, updateData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating screening:', error);
      alert(error.response?.data?.error || 'Failed to update screening record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Edit Screening Record</h2>
        <p className="text-sm text-gray-600 mb-4 italic">
          Update screening test details and results.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Type</label>
              <select
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Test Type</option>
                <option value="Newborn Screening Test">Newborn Screening Test</option>
                <option value="Newborn Hearing Test">Newborn Hearing Test</option>
                <option value="Hearing Test">Hearing Test</option>
                <option value="Blood Spot Test">Blood Spot Test</option>
                <option value="Heart Defect Screening">Heart Defect Screening</option>
                <option value="Eye Examination">Eye Examination</option>
                <option value="Hip Examination">Hip Examination</option>
                <option value="Metabolic Screening">Metabolic Screening</option>
                <option value="Genetic Screening">Genetic Screening</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date Performed</label>
              <input
                type="date"
                value={formData.date_performed}
                onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Result</label>
              <input
                type="text"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter test result"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="pending">Pending</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="requires_followup">Requires Follow-up</option>
                <option value="inconclusive">Inconclusive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Healthcare Provider</label>
              <input
                type="text"
                value={formData.healthcare_provider}
                onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Provider name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Equipment Used</label>
              <input
                type="text"
                value={formData.equipment_used}
                onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Equipment/device used"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Test Location</label>
            <input
              type="text"
              value={formData.test_location}
              onChange={(e) => setFormData({ ...formData, test_location: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Where the test was performed"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.follow_up_required}
              onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Follow-up Required</label>
          </div>

          {formData.follow_up_required && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows="3"
              placeholder="Additional notes or observations"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Screening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Add Procedure Modal Component
const AddProcedureModal = ({ walkInId, walkInName, walkInContact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    procedure_type: '',
    date_performed: '',
    status: 'scheduled',
    healthcare_provider: '',
    location: '',
    duration_minutes: '',
    anesthesia_type: '',
    complications: '',
    outcome: '',
    notes: '',
    cost: '',
    insurance_covered: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const procedureData = {
        patient_name: walkInName,
        contact_number: walkInContact,
        procedure_type: formData.procedure_type,
        date_performed: formData.date_performed,
        status: formData.status,
        surgeon: formData.healthcare_provider || null,
        location: formData.location || null,
        duration_minutes: formData.duration_minutes || null,
        anesthesia_type: formData.anesthesia_type || null,
        complications: formData.complications || null,
        outcome: formData.outcome || null,
        notes: formData.notes || null,
        cost: formData.cost || null,
        insurance_covered: formData.insurance_covered
      };

      // Choose endpoint based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/procedures'
        : '/api/admin/walkin/procedures';
      await axios.post(endpoint, procedureData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding procedure:', error);
      alert('Failed to add procedure record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Medical Procedure</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Procedure Type</label>
              <select
                value={formData.procedure_type}
                onChange={(e) => setFormData({ ...formData, procedure_type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Procedure Type</option>
                <option value="IUD Insertion">IUD Insertion</option>
                <option value="IUD Removal">IUD Removal</option>
                <option value="Injectable (DMPA)">Injectable (DMPA)</option>
                <option value="Contraceptive Implant">Contraceptive Implant</option>
                <option value="Implant Insertion">Implant Insertion</option>
                <option value="Implant Removal">Implant Removal</option>
                <option value="Tubal Ligation">Tubal Ligation</option>
                <option value="Vasectomy">Vasectomy</option>
                <option value="Cervical Biopsy">Cervical Biopsy</option>
                <option value="Endometrial Biopsy">Endometrial Biopsy</option>
                <option value="LEEP Procedure">LEEP Procedure</option>
                <option value="Cone Biopsy">Cone Biopsy</option>
                <option value="Colposcopy">Colposcopy</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date Performed</label>
              <input
                type="date"
                value={formData.date_performed}
                onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Healthcare Provider</label>
              <input
                type="text"
                value={formData.healthcare_provider}
                onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Provider name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Procedure location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Duration in minutes"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Anesthesia Type</label>
              <select
                value={formData.anesthesia_type}
                onChange={(e) => setFormData({ ...formData, anesthesia_type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Anesthesia</option>
                <option value="None">None</option>
                <option value="Local">Local</option>
                <option value="Regional">Regional</option>
                <option value="General">General</option>
                <option value="Sedation">Sedation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cost</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Procedure cost"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Outcome</label>
            <input
              type="text"
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Procedure outcome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Complications</label>
            <textarea
              value={formData.complications}
              onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows="2"
              placeholder="Any complications during procedure"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.insurance_covered}
              onChange={(e) => setFormData({ ...formData, insurance_covered: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Insurance Covered</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows="3"
              placeholder="Additional notes or observations"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Procedure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Immunization Modal Component
const AddImmunizationModal = ({ walkInId, walkInName, walkInContact, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    vaccine_type: '',
    date_given: '',
    dose_number: '',
    injection_site: '',
    healthcare_provider: '',
    batch_number: '',
    manufacturer: '',
    next_due_date: '',
    notes: '',
    adverse_reactions: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Use appropriate endpoint based on user role
      const endpoint = user.role === 'doctor'
        ? '/api/doctors/walkin/immunizations'  // Doctor endpoint
        : '/api/admin/walkin/immunizations';   // Admin/Staff endpoint

      const immunizationData = {
        ...formData,
        patient_name: walkInName,
        contact_number: walkInContact
      };

      await axios.post(endpoint, immunizationData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding immunization:', error);
      alert('Failed to add immunization record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Add New Immunization Record</h2>
        <p className="text-sm text-gray-600 mb-4 italic">
          Record detailed vaccination information to maintain accurate immunization history.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vaccine Type *</label>
              <select
                value={formData.vaccine_type}
                onChange={(e) => setFormData({ ...formData, vaccine_type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Vaccine</option>
                <option value="Tetanus Toxoid">Tetanus Toxoid</option>
                <option value="BCG Vaccine">BCG Vaccine</option>
                <option value="Hepatitis B">Hepatitis B</option>
                <option value="DPT">DPT (Diphtheria, Pertussis, Tetanus)</option>
                <option value="Polio">Polio</option>
                <option value="MMR">MMR (Measles, Mumps, Rubella)</option>
                <option value="Influenza">Influenza</option>
                <option value="COVID-19">COVID-19</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Given *</label>
              <input
                type="date"
                value={formData.date_given}
                onChange={(e) => setFormData({ ...formData, date_given: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dose Number</label>
              <input
                type="text"
                value={formData.dose_number}
                onChange={(e) => setFormData({ ...formData, dose_number: e.target.value })}
                placeholder="e.g., 1st dose, 2nd dose, Booster"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Injection Site</label>
              <select
                value={formData.injection_site}
                onChange={(e) => setFormData({ ...formData, injection_site: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Site</option>
                <option value="Left Arm">Left Arm</option>
                <option value="Right Arm">Right Arm</option>
                <option value="Left Thigh">Left Thigh</option>
                <option value="Right Thigh">Right Thigh</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Healthcare Provider</label>
              <input
                type="text"
                value={formData.healthcare_provider}
                onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Batch Number</label>
              <input
                type="text"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Next Due Date</label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Adverse Reactions</label>
            <textarea
              value={formData.adverse_reactions}
              onChange={(e) => setFormData({ ...formData, adverse_reactions: e.target.value })}
              rows="2"
              placeholder="Any adverse reactions or side effects"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Immunization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkInPatientEnhanced;

const ReferralsTab = ({ referrals, walkInName, walkInContact, reload, openModal }) => {
  const [selectedFacility, setSelectedFacility] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const facilities = Array.from(new Set((referrals || []).map(r => r.referral_to).filter(Boolean)));
  const filteredReferrals = (referrals || []).filter(r => {
    const facilityOk = selectedFacility === '__all__' ? true : String(r.referral_to) === String(selectedFacility);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = r.referral_datetime;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return facilityOk && monthOk;
  });
  const handlePrintReferral = async (referral) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      const patient = { name: walkInName || '', contact: walkInContact || '' };
      const dateStr = referral.referral_datetime ? new Date(referral.referral_datetime).toLocaleString() : 'N/A';
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Referral Slip</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class="header">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class="clinic">N.B. SEGOROYNE LYING-IN CLINIC</div><div class="sub">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class="sub">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class="title">REFERRAL SLIP</div><table><tr><td style="width:50%"><span class="label">Patient</span> <span class="value">${patient.name || 'Walk-in Patient'}</span></td><td style="width:50%"><span class="label">Contact</span> <span class="value">${patient.contact || ''}</span></td></tr><tr><td><span class="label">Referred To</span> <span class="value">${referral.referral_to || ''}</span></td><td><span class="label">Datetime</span> <span class="value">${dateStr}</span></td></tr><tr><td><span class="label">Reason</span> <span class="value">${referral.referral_reason || ''}</span></td><td></td></tr><tr><td><span class="label">Diagnosis</span> <span class="value">${referral.diagnosis || ''}</span></td><td><span class="label">Treatment Given</span> <span class="value">${referral.treatment_given || ''}</span></td></tr><tr><td colspan="2"><span class="label">Referred By</span> <span class="value">${referral.referred_by || ''}</span></td></tr></table></body></html>`;
      const filename = `Referral_${(patient.name || 'WalkIn').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Referrals</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1 border rounded" value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)}>
            <option value="__all__">All facilities</option>
            {facilities.map(f => (<option key={f} value={f}>{f}</option>))}
          </select>
          <input type="month" className="px-3 py-1 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button onClick={() => openModal('add-referral')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add Referral</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="p-3">Referred To</th>
              <th className="p-3">Reason</th>

              <th className="p-3">Datetime</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filteredReferrals || []).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.referral_to}</td>
                <td className="p-3">{r.referral_reason || '-'}</td>

                <td className="p-3">{r.referral_datetime ? new Date(r.referral_datetime).toLocaleString() : '-'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openModal('add-referral-return', r)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Return Slip</button>
                    <button onClick={() => handlePrintReferral(r)} className="px-3 py-1 bg-gray-700 text-white rounded text-xs">Print PDF</button>
                  </div>
                </td>
              </tr>
            ))}
            {(!filteredReferrals || filteredReferrals.length === 0) && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>No referrals recorded</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MedicationsTab = ({ medications, admissions, walkInName, walkInContact, reload, openModal }) => {
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const groups = {};
  (medications || []).forEach((row) => {
    const key = row.id;
    if (!groups[key]) groups[key] = { header: row, entries: [] };
    if (row.entry_id) groups[key].entries.push(row);
  });
  const list = Object.values(groups);
  const admissionIds = Array.from(new Set(list.map(g => g.header.admission_id).filter(id => id !== null)));
  const filteredList = list.filter(({ header }) => {
    const admissionOk = selectedAdmissionId === '__all__' ? true : (selectedAdmissionId === '__none__' ? header.admission_id == null : String(header.admission_id) === String(selectedAdmissionId));
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = header.administration_date;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return admissionOk && monthOk;
  });
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Medication Administration</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1 border rounded" value={selectedAdmissionId} onChange={(e) => setSelectedAdmissionId(e.target.value)}>
            <option value="__all__">All admissions</option>
            <option value="__none__">Unassigned</option>
            {admissionIds.map(id => {
              const adm = (admissions || []).find(a => String(a.id) === String(id));
              const label = adm && adm.admitted_at ? `Admission ${id} (${new Date(adm.admitted_at).toLocaleDateString()})` : `Admission ${id}`;
              return <option key={id} value={id}>{label}</option>;
            })}
          </select>
          <input type="month" className="px-3 py-1 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button onClick={() => openModal('add-medication-admin')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add Administration</button>
        </div>
      </div>
      <div className="space-y-3">
        {filteredList.map(({ header, entries }) => (
          <div key={header.id} className="bg-white rounded shadow p-3">
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {header.administration_date} {header.admission_id ? `(Admission #${header.admission_id})` : ''}
              </div>
              <button onClick={() => {
                const base = window.location.origin;
                (async () => {
                  const logoUrl = await resolveLogoUrl();
                  const patient = { name: walkInName || '', contact: walkInContact || '' };
                  const rows = entries || [];
                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Medication Administration</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} th,td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class=\"header\">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class=\"clinic\">N.B. SEGOROYNE LYING-IN CLINIC</div><div class=\"sub\">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class=\"sub\">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class=\"title\">MEDICATION ADMINISTRATION</div><table><tr><td style=\"width:50%\"><span class=\"label\">Patient</span> <span class=\"value\">${patient.name || 'Walk-in Patient'}</span></td><td style=\"width:50%\"><span class=\"label\">Contact</span> <span class=\"value\">${patient.contact || ''}</span></td></tr><tr><td><span class=\"label\">Administration Date</span> <span class=\"value\">${header.administration_date || ''}</span></td><td><span class=\"label\">Admission ID</span> <span class=\"value\">${header.admission_id || ''}</span></td></tr></table><table><thead><tr><th>Time</th><th>Medication</th><th>Dose</th><th>Route</th><th>Administered By</th><th>Notes</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.time_administered || ''}</td><td>${r.medication_name || ''}</td><td>${r.dose || ''}</td><td>${r.route || ''}</td><td>${r.administered_by || ''}</td><td>${r.notes || ''}</td></tr>`).join('')}</tbody></table></body></html>`;
                  const filename = `Medication_${(patient.name || 'WalkIn').replace(/\s+/g, '_')}_${header.id}`;
                  downloadHTMLAsPDF(html, filename);
                })();
              }} className="px-3 py-1 bg-gray-700 text-white rounded text-xs">Print PDF</button>
            </div>
            <table className="min-w-full mt-2">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="p-2">Time</th>
                  <th className="p-2">Medication</th>
                  <th className="p-2">Dose</th>
                  <th className="p-2">Route</th>
                  <th className="p-2">By</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.entry_id} className="border-t">
                    <td className="p-2">{e.time_administered || '-'}</td>
                    <td className="p-2">{e.medication_name}</td>
                    <td className="p-2">{e.dose || '-'}</td>
                    <td className="p-2">{e.route || '-'}</td>
                    <td className="p-2">{e.administered_by || '-'}</td>
                    <td className="p-2">{e.notes || '-'}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={6}>No entries</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-gray-500">No medication administrations</div>
        )}
      </div>
    </div>
  );
};

const BirthPlanTab = ({ birthPlan, profile, prenatalVisits = [], reload, openModal }) => {
  const handlePrint = async () => {
    const logoUrl = await resolveLogoUrl();
    const patientData = {
      name: [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' '),
      first_name: profile?.first_name,
      middle_name: profile?.middle_name,
      last_name: profile?.last_name,
      age: profile?.age,
      phone: profile?.phone,
      partner_age: profile?.partner_age
    };
    const latestPrenatal = (prenatalVisits || []).slice().sort((x, y) => new Date(y.scheduled_date || y.visit_date || 0) - new Date(x.scheduled_date || x.visit_date || 0))[0] || null;
    const prenatalData = latestPrenatal ? {
      gestational_age: latestPrenatal.gestational_age,
      gravida: latestPrenatal.gravida,
      para: latestPrenatal.para
    } : {
      gravida: profile?.gravida,
      para: profile?.para
    };
    const html = generateBirthPlanHTML(birthPlan || {}, patientData, prenatalData, logoUrl);
    const filename = `Birth_Plan_${(patientData.name || 'WalkIn').replace(/\s+/g, '_')}`;
    downloadHTMLAsPDF(html, filename);
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Birth Plan</h3>
        <div className="flex gap-2">
          <button onClick={() => openModal('add-birth-plan')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add/Update</button>
          {birthPlan && <button onClick={handlePrint} className="px-3 py-1 bg-gray-700 text-white rounded text-sm">Print</button>}
        </div>
      </div>
      {!birthPlan && <div className="text-gray-500">No birth plan recorded</div>}
      {birthPlan && (
        <div className="bg-white rounded shadow p-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-gray-600 text-sm">Partner</div>
              <div className="font-medium">{birthPlan.partner_name || '-'} {birthPlan.partner_phone ? `(${birthPlan.partner_phone})` : ''}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Transport Mode</div>
              <div className="font-medium">{birthPlan.transport_mode || '-'}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Blood Donor</div>
              <div className="font-medium">{birthPlan.donor_name || '-'} {birthPlan.donor_phone ? `(${birthPlan.donor_phone})` : ''}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">PhilHealth</div>
              <div className="font-medium">{birthPlan.philhealth_status || '-'}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">Married: {birthPlan.married === null ? '-' : birthPlan.married ? 'Yes' : 'No'}</div>
          <div className="text-sm text-gray-600">Consent Signed: {birthPlan.consent_signed === null ? '-' : birthPlan.consent_signed ? 'Yes' : 'No'}</div>
          {birthPlan.signed_at && <div className="text-sm text-gray-600">Signed At: {new Date(birthPlan.signed_at).toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
};

const OrderPrenatalLabsModalWalkIn = ({ patientId, onClose, onSuccess }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selected, setSelected] = useState({ cbc: true, blood_typing: true, vdrl: true, hepa_b: true, urine: true });
  const [loading, setLoading] = useState(false);

  const tests = [
    { key: 'cbc', label: 'CBC', type: 'Complete Blood Count' },
    { key: 'blood_typing', label: 'Blood Typing', type: 'Blood Type' },
    { key: 'vdrl', label: 'VDRL', type: 'Syphilis (VDRL)' },
    { key: 'hepa_b', label: 'Hepatitis B', type: 'Hepatitis B' },
    { key: 'urine', label: 'Urinalysis', type: 'Urinalysis' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payloads = tests.filter(t => selected[t.key]).map(t => ({
        patient_id: patientId,
        test_type: t.type,
        test_category: t.key,
        test_date: date,
        status: 'ordered'
      }));
      await Promise.all(payloads.map(p => axios.post('/api/clinic/lab-results', p)));
      onSuccess();
      onClose();
    } catch (e) {
      alert('Failed to order labs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Order Prenatal Labs</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test Date</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tests.map(t => (
            <label key={t.key} className="flex items-center gap-2">
              <input type="checkbox" checked={!!selected[t.key]} onChange={(e) => setSelected({ ...selected, [t.key]: e.target.checked })} />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400">{loading ? 'Ordering...' : 'Order Labs'}</button>
        </div>
      </form>
    </div>
  );
};

const CyclesTab = ({ admissions = [], babies = [], prenatalVisits = [], postpartumCare = [], openModal, onNavigateTo }) => {
  const groups = React.useMemo(() => {
    const admList = (admissions || []).map(a => ({ id: a.id, pivot: a.baby_birth_date || a.delivered_at || a.admitted_at || a.admission_date || a.appointment_date || null }))
      .filter(a => !!a.pivot)
      .sort((x, y) => new Date(x.pivot) - new Date(y.pivot));
    const map = new Map();
    (prenatalVisits || []).forEach((v) => {
      const id = v.pregnancy_id == null ? '__none__' : String(v.pregnancy_id);
      if (!map.has(id)) map.set(id, { id, items: [], first: null, latest: null });
      const dt = v.scheduled_date || v.visit_date;
      const g = map.get(id);
      g.items.push(v);
      if (dt && (!g.first || new Date(dt) < new Date(g.first))) g.first = dt;
      if (dt && (!g.latest || new Date(dt) > new Date(g.latest))) g.latest = dt;
    });
    const list = [];
    Array.from(map.values()).forEach(g => {
      const resolveAdm = () => {
        const after = admList.filter(a => new Date(a.pivot) >= new Date(g.latest || g.first || 0));
        return after.length ? after[0] : null;
      };
      const adm = resolveAdm();
      const bb = adm ? (babies || []).filter(b => String(b.admission_id || '') === String(adm.id)) : [];
      const pp = adm ? (postpartumCare || []).filter(c => String(c.admission_id || '') === String(adm.id)) : [];
      const label = g.id === '__none__'
        ? 'Unassigned Cycle'
        : `Cycle ${g.id}${g.first ? ` (${new Date(g.first).toLocaleDateString()}${g.latest ? ' → ' + new Date(g.latest).toLocaleDateString() : ''})` : ''}`;
      list.push({
        key: `cycle:${g.id}`,
        admissionId: adm ? adm.id : null,
        label,
        pivotDate: adm ? adm.pivot : (g.latest || g.first),
        prenatal: g.items,
        babies: bb,
        postpartum: pp
      });
    });
    const usedAdmIds = new Set(list.map(x => x.admissionId).filter(id => id != null).map(id => String(id)));
    (admissions || []).forEach((a) => {
      const aid = String(a.id);
      if (usedAdmIds.has(aid)) return;
      const pivot = a.baby_birth_date || a.delivered_at || a.admitted_at || a.admission_date || a.appointment_date || null;
      const pren = (prenatalVisits || []).filter(v => {
        const dt = v.scheduled_date || v.visit_date;
        if (!dt || !pivot) return false;
        return new Date(dt) <= new Date(pivot);
      });
      const bb = (babies || []).filter(b => String(b.admission_id || '') === aid);
      const pp = (postpartumCare || []).filter(c => String(c.admission_id || '') === aid);
      list.push({
        key: `adm:${aid}`,
        admissionId: a.id,
        label: a.admitted_at ? `Admission ${a.id} (${new Date(a.admitted_at).toLocaleDateString()})` : `Admission ${a.id}`,
        pivotDate: pivot,
        prenatal: pren,
        babies: bb,
        postpartum: pp
      });
    });
    const unassignedBabies = (babies || []).filter(b => !b.admission_id);
    const unassignedPostpartum = (postpartumCare || []).filter(c => c.admission_id == null);
    if (unassignedBabies.length || unassignedPostpartum.length) {
      const latestBaby = unassignedBabies.map(b => b.birth_date).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
      const latestPP = unassignedPostpartum.map(c => c.assessment_date).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
      const pivot = [latestBaby, latestPP].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
      list.push({
        key: 'none',
        admissionId: null,
        label: 'Unassigned',
        pivotDate: pivot,
        prenatal: [],
        babies: unassignedBabies,
        postpartum: unassignedPostpartum
      });
    }
    return list.sort((a, b) => new Date(b.pivotDate || 0) - new Date(a.pivotDate || 0));
  }, [admissions, babies, prenatalVisits, postpartumCare]);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="px-3 py-1 bg-pink-600 text-white rounded" onClick={() => openModal('add-admission')}>Add Admission</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.key} className="border rounded p-4 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">{g.label}</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={() => openModal('add-baby', { prefill: { admission_id: g.admissionId } })}
                >
                  Add Baby
                </button>
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => openModal('add-postpartum', { admissionId: g.admissionId })}
                >
                  Add Postpartum
                </button>
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => onNavigateTo && onNavigateTo('prenatal', g.admissionId)}
                  title="View Prenatal tab"
                >
                  View Prenatal
                </button>
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => onNavigateTo && onNavigateTo('babies', g.admissionId)}
                  title="View Babies tab"
                >
                  View Babies
                </button>
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => onNavigateTo && onNavigateTo('postpartum', g.admissionId)}
                  title="View Postpartum tab"
                >
                  View Postpartum
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Prenatal Visits ({g.prenatal.length})</div>
                {g.prenatal.length === 0 ? (
                  <div className="text-gray-500 text-sm">None</div>
                ) : (
                  <ul className="text-sm space-y-1">
                    {g.prenatal.slice(0, 6).map((v) => (
                      <li key={v.id} className="flex justify-between">
                        <span>{v.visit_number ? `Visit #${v.visit_number} • ` : ''}{new Date(v.scheduled_date || v.visit_date).toLocaleDateString()}</span>
                        <button className="text-blue-600" onClick={() => openModal('prenatal-visit', v)}>View</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Babies ({g.babies.length})</div>
                {g.babies.length === 0 ? (
                  <div className="text-gray-500 text-sm">None</div>
                ) : (
                  <ul className="text-sm space-y-1">
                    {g.babies.slice(0, 6).map((b) => (
                      <li key={b.id} className="flex justify-between">
                        <span>{b.full_name || 'Baby'} • {b.birth_date ? new Date(b.birth_date).toLocaleDateString() : ''}</span>
                        <button className="text-blue-600" onClick={() => openModal('baby-record', b)}>View</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Postpartum ({g.postpartum.length})</div>
                {g.postpartum.length === 0 ? (
                  <div className="text-gray-500 text-sm">None</div>
                ) : (
                  <ul className="text-sm space-y-1">
                    {g.postpartum.slice(0, 6).map((c) => (
                      <li key={c.id} className="flex justify-between">
                        <span>Day {c.day_postpartum} • {c.assessment_date ? new Date(c.assessment_date).toLocaleDateString() : ''}</span>
                        <button className="text-blue-600" onClick={() => openModal('postpartum-assessment', c)}>View</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddWalkInReferralModal = ({ patientId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    referral_to: '',
    referral_reason: '',
    diagnosis: '',
    treatment_given: '',
    referred_by: '',
    referral_datetime: new Date().toISOString().slice(0, 16),
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = '/api/clinic/referrals';
      const payload = {
        patient_id: patientId,
        referral_to: formData.referral_to,
        referral_reason: formData.referral_reason || null,
        diagnosis: formData.diagnosis || null,
        treatment_given: formData.treatment_given || null,
        referred_by: formData.referred_by || null,
        referral_datetime: formData.referral_datetime ? new Date(formData.referral_datetime).toISOString().slice(0, 19).replace('T', ' ') : null,
        notes: formData.notes || null
      };
      await axios.post(endpoint, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add referral');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Referral</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Referral To</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.referral_to} onChange={(e) => setFormData({ ...formData, referral_to: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select className="w-full border rounded px-3 py-2" value={formData.referral_reason} onChange={(e) => setFormData({ ...formData, referral_reason: e.target.value })}>
              <option value="">Select</option>
              <option value="further_evaluation">Further evaluation</option>
              <option value="management">Management</option>
              <option value="work_up">Work-up</option>
              <option value="no_doctor">No doctor</option>
              <option value="patient_request">Patient request</option>
              <option value="medico_legal">Medico-legal</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Referral Datetime</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={formData.referral_datetime} onChange={(e) => setFormData({ ...formData, referral_datetime: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Diagnosis/Impression</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Treatment Given</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.treatment_given} onChange={(e) => setFormData({ ...formData, treatment_given: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Referred By</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.referred_by} onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading || !patientId} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Add Referral'}</button>
        </div>
      </form>
    </div>
  );
};

const AddReferralReturnModal = ({ referral, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    return_to: '',
    return_datetime: new Date().toISOString().slice(0, 16),
    diagnosis: '',
    actions_taken: '',
    recommendations: '',
    signed_by: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = `/api/clinic/referrals/${referral.id}/return`;
      const payload = {
        return_to: formData.return_to || null,
        return_datetime: formData.return_datetime ? new Date(formData.return_datetime).toISOString().slice(0, 19).replace('T', ' ') : null,
        diagnosis: formData.diagnosis || null,
        actions_taken: formData.actions_taken || null,
        recommendations: formData.recommendations || null,
        signed_by: formData.signed_by || null,
        notes: formData.notes || null
      };
      await axios.post(url, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add return slip');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Return Slip</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Return To</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.return_to} onChange={(e) => setFormData({ ...formData, return_to: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Return Datetime</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={formData.return_datetime} onChange={(e) => setFormData({ ...formData, return_datetime: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Diagnosis/Impression</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Actions Taken</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.actions_taken} onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recommendations</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.recommendations} onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Signed By</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.signed_by} onChange={(e) => setFormData({ ...formData, signed_by: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Add Return'}</button>
        </div>
      </form>
    </div>
  );
};

const AddWalkInMedicationAdminModal = ({ patientId, admissions = [], prefillAdmissionId, onClose, onSuccess }) => {
  const [adminDate, setAdminDate] = useState(new Date().toISOString().slice(0, 10));
  const [admissionId, setAdmissionId] = useState(prefillAdmissionId ? String(prefillAdmissionId) : '');
  const [entries, setEntries] = useState([
    { time_administered: '', medication_name: '', dose: '', route: '', administered_by: '', notes: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const addRow = () => setEntries([...entries, { time_administered: '', medication_name: '', dose: '', route: '', administered_by: '', notes: '' }]);
  const updateRow = (i, key, val) => {
    const copy = entries.slice();
    copy[i][key] = val;
    setEntries(copy);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = '/api/clinic/medication-administration';
      const payload = {
        patient_id: patientId,
        admission_id: admissionId || null,
        administration_date: adminDate,
        entries
      };
      await axios.post(endpoint, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add administration');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Medication Administration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={adminDate} onChange={(e) => setAdminDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link to Admission</label>
            <select className="w-full border rounded px-3 py-2" value={admissionId} onChange={(e) => setAdmissionId(e.target.value)}>
              <option value="">None</option>
              {admissions.filter(a => a.status === 'admitted').map(a => (
                <option key={a.id} value={a.id}>Admission #{a.id}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white rounded border">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="p-2">Time</th>
                <th className="p-2">Medication</th>
                <th className="p-2">Dose</th>
                <th className="p-2">Route</th>
                <th className="p-2">By</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2"><input type="time" className="w-full border rounded px-2 py-1" value={e.time_administered} onChange={(ev) => updateRow(i, 'time_administered', ev.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.medication_name} onChange={(ev) => updateRow(i, 'medication_name', ev.target.value)} required /></td>
                  <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.dose} onChange={(ev) => updateRow(i, 'dose', ev.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.route} onChange={(ev) => updateRow(i, 'route', ev.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.administered_by} onChange={(ev) => updateRow(i, 'administered_by', ev.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.notes} onChange={(ev) => updateRow(i, 'notes', ev.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3">
            <button type="button" onClick={addRow} className="px-3 py-1 bg-gray-100 rounded">Add Row</button>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading || !patientId} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Add Administration'}</button>
        </div>
      </form>
    </div>
  );
};

const AddWalkInBirthPlanModal = ({ patientId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    partner_name: '',
    partner_phone: '',
    transport_mode: '',
    emergency_facility: '',
    donor_name: '',
    donor_phone: '',
    philhealth_status: '',
    married: '',
    consent_signed: '',
    signed_at: new Date().toISOString().slice(0, 16),
    checklist_mother: '',
    checklist_baby: ''
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = '/api/clinic/birth-plan';
      const payload = {
        patient_id: patientId,
        partner_name: formData.partner_name || null,
        partner_phone: formData.partner_phone || null,
        transport_mode: formData.transport_mode || null,
        emergency_facility: formData.emergency_facility || null,
        donor_name: formData.donor_name || null,
        donor_phone: formData.donor_phone || null,
        philhealth_status: formData.philhealth_status || null,
        married: formData.married === '' ? null : formData.married === 'yes',
        consent_signed: formData.consent_signed === '' ? null : formData.consent_signed === 'yes',
        signed_at: formData.signed_at ? new Date(formData.signed_at).toISOString().slice(0, 19).replace('T', ' ') : null,
        checklist_mother: formData.checklist_mother || null,
        checklist_baby: formData.checklist_baby || null
      };
      await axios.post(endpoint, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save birth plan');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Birth Plan</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Partner Name</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.partner_name} onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partner Phone</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.partner_phone} onChange={(e) => setFormData({ ...formData, partner_phone: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Transport Mode</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.transport_mode} onChange={(e) => setFormData({ ...formData, transport_mode: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Emergency Facility</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.emergency_facility} onChange={(e) => setFormData({ ...formData, emergency_facility: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">PhilHealth Status</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.philhealth_status} onChange={(e) => setFormData({ ...formData, philhealth_status: e.target.value })} />
          </div>
          <div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Blood Donor Name</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.donor_name} onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blood Donor Phone</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.donor_phone} onChange={(e) => setFormData({ ...formData, donor_phone: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Married</label>
            <select className="w-full border rounded px-3 py-2" value={formData.married} onChange={(e) => setFormData({ ...formData, married: e.target.value })}>
              <option value="">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Consent Signed</label>
            <select className="w-full border rounded px-3 py-2" value={formData.consent_signed} onChange={(e) => setFormData({ ...formData, consent_signed: e.target.value })}>
              <option value="">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Signed At</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" value={formData.signed_at} onChange={(e) => setFormData({ ...formData, signed_at: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mother Checklist (JSON)</label>
          <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.checklist_mother} onChange={(e) => setFormData({ ...formData, checklist_mother: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Baby Checklist (JSON)</label>
          <textarea className="w-full border rounded px-3 py-2" rows={3} value={formData.checklist_baby} onChange={(e) => setFormData({ ...formData, checklist_baby: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading || !patientId} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Plan'}</button>
        </div>
      </form>
    </div>
  );
};
