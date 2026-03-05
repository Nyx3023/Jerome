import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import { downloadHTMLAsPDF, generatePrenatalBookletHTML, generateAdmissionFormHTML, generateBirthPlanHTML, generateDeliveryRoomRecordHTML, generateNewbornAdmissionFormHTML, generateNewbornDischargeSummaryHTML, generateMotherDischargeSummaryHTML, generatePostpartumRecordHTML, generateClinicalLabReportsHTML, generateSingleLabTestHTML, generateSinglePostpartumAssessmentHTML } from '../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../utils/logoUtils';
import { ViewBabyModal } from './modals/BabyViewModal';
import { FaBaby, FaExclamationTriangle, FaFlask, FaCalendarCheck, FaHeartbeat, FaFileAlt, FaVenus } from 'react-icons/fa';
import { ViewProcedureModal } from './modals/ProcedureViewModal';
import { ViewAdmissionModal } from './modals/AdmissionViewModal';
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

function PatientRecordEnhanced({ userId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [babies, setBabies] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [prenatalVisits, setPrenatalVisits] = useState([]);
  const [postpartumCare, setPostpartumCare] = useState([]);
  const [familyPlanning, setFamilyPlanning] = useState([]);
  const [immunizations, setImmunizations] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [birthPlan, setBirthPlan] = useState(null);
  const [birthPlans, setBirthPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSelectedAdmissionId, setGlobalSelectedAdmissionId] = useState('__all__');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState({});

  useEffect(() => {
    loadPatientData();
  }, [userId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const p = await axios.get(`/api/admin/patient-profile/${userId}`);
      setProfile(p.data);
      const patientId = p.data?.id;

      if (patientId) {
        // Load all data in parallel with proper error handling
        const [h, a, aByPatient, b, l, pn, pc, fp, im, sc, pr, rf, md, bp, bps] = await Promise.all([
          axios.get(`/api/admin/medical-records/patient/${patientId}`)
            .catch((err) => {
              console.error('Error loading medical records:', err);
              return { data: { medical_records: [] } };
            }),
          axios.get(`/api/admin/admissions?user_id=${p.data?.user_id || userId}`)
            .catch((err) => {
              console.error('Error loading admissions:', err);
              return { data: [] };
            }),
          axios.get(`/api/admin/admissions/patient/${patientId}`)
            .catch((err) => {
              console.error('Error loading admissions by patient:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/babies/mother/${patientId}`)
            .catch((err) => {
              console.error('Error loading babies:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/lab-results/${patientId}`)
            .catch((err) => {
              console.error('Error loading lab results:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/prenatal-schedule/${patientId}`)
            .catch((err) => {
              console.error('Error loading prenatal schedule:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/postpartum-care/${patientId}`)
            .catch((err) => {
              console.error('Error loading postpartum care:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/family-planning/${patientId}`)
            .catch((err) => {
              console.error('Error loading family planning:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/immunizations/${patientId}`)
            .catch((err) => {
              console.error('Error loading immunizations:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/screenings/${patientId}`)
            .catch((err) => {
              console.error('Error loading screenings:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/procedures/${patientId}`)
            .catch((err) => {
              console.error('Error loading procedures:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/referrals/${patientId}`)
            .catch((err) => {
              console.error('Error loading referrals:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/medication-administration/${patientId}`)
            .catch((err) => {
              console.error('Error loading medication administrations:', err);
              return { data: [] };
            }),
          axios.get(`/api/clinic/birth-plan/${patientId}`)
            .catch((err) => {
              console.error('Error loading birth plan:', err);
              return { data: null };
            }),
          axios.get(`/api/clinic/birth-plans/${patientId}`)
            .catch((err) => {
              console.error('Error loading birth plans:', err);
              return { data: [] };
            })
        ]);

        setHistory(h.data?.medical_records || []);
        const admissionsMerged = Array.isArray(a.data) && a.data.length ? a.data : (aByPatient.data || []);
        setAdmissions(admissionsMerged);
        setBabies(b.data || []);
        setLabResults(l.data || []);
        setPrenatalVisits(pn.data || []);
        setPostpartumCare(pc.data || []);
        setFamilyPlanning(fp.data || []);
        setImmunizations(im.data || []);
        setScreenings(sc.data || []);
        setProcedures(pr.data || []);
        setReferrals(rf.data || []);
        setMedications(md.data || []);
        setBirthPlan(bp.data || null);
        setBirthPlans(bps.data || []);
      }
    } catch (e) {
      console.error('Error loading patient data:', e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
    setShowModal(true);
  };

  const findAdmissionForBaby = (baby) => {
    const byId = (admissions || []).find(a => String(a.id) === String(baby?.admission_id || ''));
    if (byId) return byId;
    const list = (admissions || [])
      .map(a => ({ ...a, _dt: a.delivered_at || a.admitted_at || a.admission_date || a.appointment_date || '' }))
      .filter(a => a._dt)
      .sort((x, y) => new Date(y._dt) - new Date(x._dt));
    return list[0] || null;
  };

  const getLatestPrenatal = () => {
    const v = (prenatalVisits || []).slice().sort((x, y) => new Date(y.scheduled_date || y.visit_date || 0) - new Date(x.scheduled_date || x.visit_date || 0));
    return v[0] || null;
  };

  const printAdmissionForm = async (admission) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const patientData = {
        first_name: profile.first_name || '',
        middle_name: profile.middle_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        age: profile.age || '',
        address: profile.address || '',
        gender: profile.gender || '',
        civil_status: profile.civil_status || '',
        religion: profile.religion || '',
        occupation: profile.occupation || '',
        place_of_birth: profile.place_of_birth || '',
        date_of_birth: profile.date_of_birth || '',
        partner_name: profile.partner_name || '',
        partner_age: profile.partner_age || '',
        partner_occupation: profile.partner_occupation || '',
        partner_religion: profile.partner_religion || '',
        gravida: profile.gravida,
        para: profile.para
      };
      const latestPrenatal = getLatestPrenatal();
      const prenatalData = latestPrenatal ? {
        aog: latestPrenatal.gestational_age,
        gestational_age: latestPrenatal.gestational_age,
        gravida: latestPrenatal.gravida,
        para: latestPrenatal.para
      } : {};
      const html = generateAdmissionFormHTML(admission, patientData, prenatalData, logoUrl);
      const filename = `Admission_Form_${(admission.display_patient_name || admission.patient_name || 'Patient').replace(/\s+/g, '_')}_${admission.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate admission form');
    }
  };

  const printMotherDischarge = async (admission) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const patientData = {
        first_name: profile.first_name || '',
        middle_name: profile.middle_name || '',
        last_name: profile.last_name || '',
        age: profile.age || '',
        gender: profile.gender || '',
        address: profile.address || ''
      };
      const latestPrenatal = getLatestPrenatal();
      const prenatalData = latestPrenatal ? {
        aog: latestPrenatal.gestational_age,
        gravida: latestPrenatal.gravida,
        para: latestPrenatal.para
      } : {};
      const html = generateMotherDischargeSummaryHTML(patientData, admission, prenatalData, logoUrl);
      const filename = `Mother_Discharge_${(admission.display_patient_name || admission.patient_name || 'Patient').replace(/\s+/g, '_')}_${admission.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate discharge summary');
    }
  };

  const printNewbornAdmission = async (baby) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const mother = {
        name: [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' '),
        age: profile.age || '',
        address: profile.address || '',
        gravida: profile.gravida,
        para: profile.para
      };
      const admission = findAdmissionForBaby(baby) || {};
      const html = generateNewbornAdmissionFormHTML(mother, baby, admission, logoUrl);
      const filename = `Newborn_Admission_${(baby.first_name || 'Baby')}_${baby.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate newborn admission form');
    }
  };

  const printNewbornDischarge = async (baby) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const mother = {
        gravida: profile.gravida,
        para: profile.para,
        name: [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' '),
        age: profile.age || '',
        address: profile.address || ''
      };
      const admissionRaw = findAdmissionForBaby(baby) || {};
      let dd = {};
      try {
        if (admissionRaw.notes) {
          const n = typeof admissionRaw.notes === 'string' ? JSON.parse(admissionRaw.notes) : admissionRaw.notes;
          dd = n?.delivery_details || {};
        }
      } catch { dd = {}; }
      const latestPrenatal = getLatestPrenatal();
      const maternal = {
        delivery_type: admissionRaw?.delivery_type || '',
        aog: latestPrenatal?.gestational_age || ''
      };
      const dAd = admissionRaw.admitted_at ? new Date(admissionRaw.admitted_at) : null;
      const dDc = admissionRaw.discharged_at ? new Date(admissionRaw.discharged_at) : null;
      const nbAdmission = {
        date_admitted: dAd ? `${dAd.toLocaleDateString()} ${dAd.toLocaleTimeString()}` : '',
        date_discharge: dDc ? `${dDc.toLocaleDateString()} ${dDc.toLocaleTimeString()}` : (admissionRaw.date_discharge || ''),
        admitting_diagnosis: admissionRaw.admission_reason || admissionRaw.admitting_diagnosis || '',
        screening_date: dd.screening_date || '',
        screening_filter_card_no: dd.screening_filter_card_no || '',
        vitamin_k_date: dd.vitamin_k_date || '',
        bcg_date: dd.bcg_date || '',
        hepb_date: dd.hepb_date || '',
        home_medication: dd.home_medication || '',
        follow_up: dd.follow_up || '',
        discharged_by: admissionRaw.discharged_by || ''
      };
      const html = generateNewbornDischargeSummaryHTML(mother, baby, nbAdmission, maternal, logoUrl);
      const filename = `Newborn_Discharge_${(baby.first_name || 'Baby')}_${baby.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate newborn discharge summary');
    }
  };

  const printDeliveryRoomRecord = async (baby) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const mother = {
        name: [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' '),
        age: profile.age || '',
        address: profile.address || '',
        gravida: profile.gravida,
        para: profile.para
      };
      const admission = findAdmissionForBaby(baby) || {};
      const html = generateDeliveryRoomRecordHTML(mother, baby, admission, logoUrl);
      const filename = `Delivery_Room_Record_${(baby.first_name || 'Baby')}_${baby.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate delivery room record');
    }
  };

  if (loading) return <div className="p-6">Loading patient data...</div>;
  if (!profile) return <div className="p-6">Patient not found</div>;

  const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ');
  const isHighRisk = profile.is_high_risk;

  const medAdminCount = Array.isArray(medications) ? new Set(medications.map(m => m.id)).size : 0;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'prenatal', label: 'Prenatal Care', icon: '🤰' },
    { id: 'cycles', label: 'Cycles', icon: '🔁' },
    { id: 'babies', label: 'Babies', icon: '👶', badge: babies.length },
    { id: 'lab', label: 'Lab Results', icon: '🔬', badge: labResults.length },
    { id: 'immunizations', label: 'Immunizations', icon: '💉', badge: immunizations.length },
    { id: 'screenings', label: 'Newborn Screening', icon: '🔍', badge: screenings.length },
    { id: 'procedures', label: 'Medical Procedures', icon: '⚕️', badge: procedures.length },
    { id: 'postpartum', label: 'Postpartum', icon: '💚' },
    { id: 'admissions', label: 'Admissions', icon: '🏥', badge: admissions.length },
    { id: 'family-planning', label: 'Family Planning', icon: '👨‍👩‍👧‍👦' },
    { id: 'referrals', label: 'Referrals', icon: '📨', badge: referrals.length },
    { id: 'medications', label: 'Medications', icon: '💊', badge: medAdminCount },
    { id: 'birth-plan', label: 'Birth Plan', icon: '📝' }
  ];

  return (
    <div className="patient-record p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{fullName}</h1>
              {isHighRisk && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold flex items-center gap-1">
                  <FaExclamationTriangle /> HIGH RISK
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Patient ID: {profile.id} | User ID: {profile.user_id}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={() => openModal('edit-patient-info')}
            >
              Edit Patient Info
            </button>
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              onClick={() => openModal('prenatal-schedule')}
            >
              Schedule Prenatal
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              onClick={() => {
                const gid = globalSelectedAdmissionId;
                const resolved = (gid === '__all__' || gid === '__none__')
                  ? (() => {
                    const items = (admissions || [])
                      .map(a => ({ id: a.id, d: a.admitted_at || a.appointment_date || a.admission_date || a.delivered_at || null }))
                      .filter(x => !!x.d)
                      .sort((x, y) => new Date(y.d) - new Date(x.d));
                    return items[0]?.id || null;
                  })()
                  : gid;
                openModal('add-baby', { admissionId: resolved });
              }}
            >
              Add Baby Record
            </button>

          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab profile={profile} openModal={openModal} />}
          {activeTab === 'prenatal' && (
            <PrenatalTab
              visits={prenatalVisits}
              admissions={admissions}
              selectedAdmissionIdProp={globalSelectedAdmissionId}
              patientId={profile.id}
              reload={loadPatientData}
              openModal={openModal}
            />
          )}
          {activeTab === 'cycles' && (
            <PrenatalTab
              visits={prenatalVisits}
              admissions={admissions}
              selectedAdmissionIdProp={globalSelectedAdmissionId}
              patientId={profile.id}
              reload={loadPatientData}
              openModal={openModal}
            />
          )}
          {activeTab === 'babies' && (
            <BabiesTab
              babies={babies}
              admissions={admissions}
              selectedAdmissionIdProp={globalSelectedAdmissionId}
              patientId={profile.id}
              reload={loadPatientData}
              openModal={openModal}
            />
          )}
          {activeTab === 'lab' && <LabResultsTab results={labResults} patientId={profile.id} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'immunizations' && <ImmunizationsTab immunizations={immunizations} patientId={profile.id} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'screenings' && <ScreeningsTab screenings={screenings} patientId={profile.id} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'procedures' && <ProceduresTab procedures={procedures} patientId={profile.id} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'postpartum' && (
            <PostpartumTab
              care={postpartumCare}
              admissions={admissions}
              prenatalVisits={prenatalVisits}
              selectedAdmissionIdProp={globalSelectedAdmissionId}
              patientId={profile.id}
              reload={loadPatientData}
              openModal={openModal}
            />
          )}
          {activeTab === 'admissions' && <AdmissionsTab admissions={admissions} userId={userId} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'family-planning' && <FamilyPlanningTab records={familyPlanning} patientId={profile.id} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'referrals' && <ReferralsTab referrals={referrals} patientId={profile.id} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'medications' && <MedicationsTab medications={medications} admissions={admissions} patientId={profile.id} reload={loadPatientData} openModal={openModal} />}
          {activeTab === 'birth-plan' && <BirthPlanTab birthPlans={birthPlans} patientId={profile.id} profile={profile} prenatalVisits={prenatalVisits} reload={loadPatientData} openModal={openModal} />}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto min-h-[200px]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {modalType === 'prenatal-schedule' && (
              <PrenatalScheduleModal patientId={profile.id} profile={profile} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'order-prenatal-labs' && (
              <OrderPrenatalLabsModal patientId={profile.id} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'edit-patient-info' && (
              <EditPatientInfoModal profile={profile} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-baby' && (
              <AddBabyModal patientId={profile.id} admissions={admissions} prefill={modalData?.prefill || {}} admissionId={modalData?.admissionId || ''} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-baby' && (
              <ViewBabyModal
                baby={modalData}
                onClose={() => setShowModal(false)}
                onPrintAdmissionForm={() => printNewbornAdmission(modalData)}
                onPrintDischargePDF={() => printNewbornDischarge(modalData)}
                onPrintDeliveryRecord={() => printDeliveryRoomRecord(modalData)}
              />
            )}
            {modalType === 'edit-baby' && (
              <EditBabyModal baby={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'add-baby-vitals' && (
              <AddBabyVitalsModal baby={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'admit-baby' && (
              <AddBabyAdmissionModal baby={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'discharge-baby' && (
              <DischargeBabyAdmissionModal baby={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-lab' && (
              <SharedAddLabResultModal
                patientId={profile.id}
                patientName={[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')}
                contactNumber={profile.phone || ''}
                initialData={modalData}
                onClose={() => setShowModal(false)}
                onSuccess={loadPatientData}
              />
            )}
            {modalType === 'view-lab-result' && (
              <ViewLabResultModal result={modalData} onClose={() => setShowModal(false)} onPrint={() => handlePrintSingleLabTest(modalData)} />
            )}
            {modalType === 'edit-lab-result' && (
              <EditLabResultModal result={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'view-prenatal' && (
              <ViewPrenatalModal visit={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'edit-prenatal' && (
              <EditPrenatalModal visit={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-immunization' && (
              <SharedAddImmunizationModal patientId={profile.id} patientName={[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')} contactNumber={profile.phone || ''} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-immunization' && (
              <ViewImmunizationModal immunization={modalData} onClose={() => setShowModal(false)} onPrint={() => handlePrintImmunization(modalData)} />
            )}
            {modalType === 'edit-immunization' && (
              <EditImmunizationModal immunization={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'add-screening' && (
              <SharedAddScreeningModal patientId={profile.id} patientName={[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')} contactNumber={profile.phone || ''} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-screening' && (
              <ViewScreeningModal screening={modalData} onClose={() => setShowModal(false)} onPrint={() => handlePrintScreening(modalData)} />
            )}
            {modalType === 'edit-screening' && (
              <EditScreeningModal screening={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-procedure' && (
              <SharedAddProcedureModal patientId={profile.id} patientName={[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')} contactNumber={profile.phone || ''} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-procedure' && (
              <ViewProcedureModal procedure={modalData} onClose={() => setShowModal(false)} onPrint={() => handlePrintProcedure(modalData)} />
            )}
            {modalType === 'edit-procedure' && (
              <EditProcedureModal procedure={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'add-postpartum' && (
              <AddPostpartumModal patientId={profile.id} admissions={admissions} prenatalVisits={prenatalVisits} prefill={modalData?.prefill || {}} admissionId={modalData?.admissionId || ''} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-postpartum' && (
              <ViewPostpartumModal postpartum={modalData} onClose={() => setShowModal(false)} onPrint={() => handlePrintSinglePostpartum(modalData)} />
            )}
            {modalType === 'edit-postpartum' && (
              <EditPostpartumModal postpartum={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'add-family-planning' && (
              <AddFamilyPlanningModal patientId={profile.id} profile={profile} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-family-planning' && (
              <ViewFamilyPlanningModal familyPlanning={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'edit-family-planning' && (
              <EditFamilyPlanningModal familyPlanning={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-admission' && (
              <AddAdmissionModal patientId={profile.id} profile={profile} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-admission' && (
              <ViewAdmissionModal
                admission={modalData}
                onClose={() => setShowModal(false)}
                onPrintForm={() => printAdmissionForm(modalData)}
                onPrintDischarge={() => printMotherDischarge(modalData)}
              />
            )}
            {modalType === 'update-delivery' && (
              <UpdateDeliveryModal admission={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'edit-admission' && (
              <EditAdmissionModal admission={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'discharge-admission' && (
              <DischargeAdmissionModal admission={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-referral' && (
              <AddReferralModal patientId={profile.id} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-medication-admin' && (
              <AddMedicationAdminModal patientId={profile.id} admissions={admissions} prefillAdmissionId={modalData?.prefill_admission_id} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'add-birth-plan' && (
              <AddBirthPlanModal patientId={profile.id} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
            {modalType === 'view-birth-plan' && (
              <ViewBirthPlanModal plan={modalData} onClose={() => setShowModal(false)} />
            )}
            {modalType === 'edit-birth-plan' && (
              <EditBirthPlanModal plan={modalData} onClose={() => setShowModal(false)} onSuccess={loadPatientData} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ profile, openModal }) {
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 text-sm">Age:</span>
                <p className="font-medium">{profile.age || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Gender:</span>
                <p className="font-medium capitalize">{profile.gender || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Date of Birth:</span>
              <p className="font-medium">{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Place of Birth:</span>
              <p className="font-medium">{profile.place_of_birth || 'Not provided'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 text-sm">Civil Status:</span>
                <p className="font-medium capitalize">{profile.civil_status || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Religion:</span>
                <p className="font-medium">{profile.religion || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Occupation:</span>
              <p className="font-medium">{profile.occupation || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Email:</span>
              <p className="font-medium">{profile.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Phone:</span>
              <p className="font-medium">{profile.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Address:</span>
              <p className="font-medium">{profile.address || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Obstetric History - Highlighted Section */}
      {(profile.gravida || profile.para || profile.lmp || profile.edd) && (
        <div className="bg-pink-50 p-6 rounded-lg shadow border-2 border-pink-200">
          <h3 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
            🤰 Current Pregnancy & Obstetric History
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.gravida && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Gravida</div>
                <div className="text-2xl font-bold text-pink-600">G{profile.gravida}</div>
              </div>
            )}
            {profile.para && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Para</div>
                <div className="text-2xl font-bold text-pink-600">P{profile.para}</div>
              </div>
            )}
            {profile.lmp && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">LMP</div>
                <div className="font-semibold text-pink-800">{new Date(profile.lmp).toLocaleDateString()}</div>
              </div>
            )}
            {profile.edd && (
              <div className="bg-white p-3 rounded-lg">
                <div className="text-gray-600 text-sm">EDD</div>
                <div className="font-semibold text-pink-800">{new Date(profile.edd).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partner/Husband Information */}
      {(profile.partner_name || profile.partner_age || profile.partner_occupation || profile.partner_religion) && (
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
              <p className="font-bold text-red-900 text-lg">{profile.blood_type || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-700 text-sm font-medium">Allergies:</span>
              <p className="font-medium text-red-900">{profile.allergies || 'None reported'}</p>
            </div>
            {profile.is_high_risk && (
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
              <p className="font-medium">{profile.emergency_contact_name || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Phone:</span>
              <p className="font-medium">{profile.emergency_contact_phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Relationship:</span>
              <p className="font-medium">{profile.emergency_contact_relationship || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: Other tab components (PrenatalTab, FindingsTab, etc.) will be in separate files
// For now, here are placeholder components

const PrenatalTab = ({ visits, admissions = [], selectedAdmissionIdProp = '__all__', patientId, reload, openModal }) => {
  const admissionFilteredVisits = (visits || []).filter(v => {
    if (!selectedAdmissionIdProp || selectedAdmissionIdProp === '__all__') return true;
    if (selectedAdmissionIdProp === '__none__') return true;
    const adm = (admissions || []).find(a => String(a.id) === String(selectedAdmissionIdProp)) || {};
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
  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm('Are you sure you want to delete this prenatal visit?')) return;

    try {
      await axios.delete(`/api/clinic/prenatal-schedule/${visitId}`);
      reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete prenatal visit');
    }
  };

  const handlePrintBooklet = async () => {
    try {
      const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
      const patient = p.data || {};
      const name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
      const patientData = {
        name,
        phone: patient.phone || '',
        lmp: patient.lmp || null,
        edd: patient.edd || null,
        gravida: patient.gravida,
        para: patient.para
      };
      const logoUrl = await resolveLogoUrl();
      const html = generatePrenatalBookletHTML(patientData, visits || [], logoUrl);
      downloadHTMLAsPDF(html, `Prenatal_Booklet_${name || 'Patient'}`);
    } catch (e) {
      alert('Failed to generate booklet');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Prenatal Visit Schedule</h3>
        <div className="flex gap-2 items-center">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              const ids = Array.from(new Set((visits || []).map(v => v.pregnancy_id).filter(id => id != null))).map(Number).filter(n => !Number.isNaN(n));
              const nextId = (ids.length ? Math.max(...ids) : 0) + 1;
              openModal('prenatal-schedule', { pregnancy_id: nextId });
            }}
          >
            Start New Cycle
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={() => openModal('order-prenatal-labs')}
          >
            Order Prenatal Labs
          </button>
          <button
            className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
            onClick={handlePrintBooklet}
          >
            Print Prenatal Booklet
          </button>
        </div>
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
                onClick={() => openModal('prenatal-schedule', { pregnancy_id: groups[0].id === '__none__' ? null : groups[0].id })}
              >
                Schedule Visit
              </button>
            </div>
            <div className="space-y-3">
              {groups[0].items.map((visit) => (
                <div key={visit.id} className="p-4 border rounded hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">Visit #{visit.visit_number} - Trimester {visit.trimester}</div>
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
                      {visit.assessment && (
                        <div className="text-sm">Assessment: {visit.assessment}</div>
                      )}
                      {visit.plan && (
                        <div className="text-sm">Plan: {visit.plan}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded text-sm ${visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                        visit.status === 'missed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {visit.status}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal('view-prenatal', visit)}
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
                          onClick={() => handleDeleteVisit(visit.id)}
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
                        onClick={() => openModal('prenatal-schedule', { pregnancy_id: g.id === '__none__' ? null : g.id })}
                      >
                        Schedule Visit
                      </button>
                    </div>
                    <div className="space-y-3">
                      {g.items.map((visit) => (
                        <div key={visit.id} className="p-4 border rounded hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold">Visit #{visit.visit_number} - Trimester {visit.trimester}</div>
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
                              {visit.assessment && (
                                <div className="text-sm">Assessment: {visit.assessment}</div>
                              )}
                              {visit.plan && (
                                <div className="text-sm">Plan: {visit.plan}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded text-sm ${visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                                visit.status === 'missed' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                {visit.status}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openModal('view-prenatal', visit)}
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
                                  onClick={() => handleDeleteVisit(visit.id)}
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

const BabiesTab = ({ babies, admissions = [], selectedAdmissionIdProp = '__all__', patientId, reload, openModal }) => {
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [search, setSearch] = useState('');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('__all__');
  useEffect(() => { try { if (typeof selectedAdmissionIdProp !== 'undefined') setSelectedAdmissionId(selectedAdmissionIdProp); } catch { } }, [selectedAdmissionIdProp]);
  const statuses = Array.from(new Set((babies || []).map(b => b.status).filter(Boolean)));
  const filteredBabies = (babies || []).filter(b => {
    const statusOk = selectedStatus === '__all__' ? true : String(b.status) === String(selectedStatus);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = b.birth_date;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    const searchOk = search.trim() === '' ? true : ((b.full_name || b.baby_name || '').toLowerCase().includes(search.trim().toLowerCase()));
    const admissionOk = (() => {
      if (selectedAdmissionId === '__all__') return true;
      if (selectedAdmissionId === '__none__') return !b.admission_id;
      return String(b.admission_id || '') === String(selectedAdmissionId);
    })();
    return statusOk && monthOk && searchOk && admissionOk;
  });
  const handlePrintDeliveryRecord = async (baby) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let admissions = [];
      try {
        const resp = await axios.get(`/api/admin/admissions/patient/${patientId}`);
        admissions = resp.data || [];
      } catch { }
      const admission = Array.isArray(admissions) && admissions.length ? admissions[0] : {};
      const mother = {
        name: admission.display_patient_name || '',
        age: admission.patient_age || '',
        address: admission.patient_address || '',
        gravida: '',
        para: ''
      };
      const html = generateDeliveryRoomRecordHTML(mother, baby, admission, logoUrl);
      const filename = `Delivery_Room_Record_${(baby.full_name || baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate Delivery Room Record');
    }
  };
  const handlePrintNewbornAdmissionForm = async (baby) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let admissions = [];
      try {
        const resp = await axios.get(`/api/admin/admissions/patient/${patientId}`);
        admissions = resp.data || [];
      } catch { }
      const maternal = Array.isArray(admissions) && admissions.length ? admissions[0] : {};
      let newborn = {};
      try {
        const r = await axios.get(`/api/clinic/babies/${baby.id}/admissions`);
        const rows = r.data || [];
        newborn = rows[0] || {};
      } catch { }
      const mother = {
        name: maternal.display_patient_name || '',
        address: maternal.patient_address || ''
      };
      const mergedAdmission = { ...newborn, attending_midwife: maternal.attending_midwife || '' };
      const html = generateNewbornAdmissionFormHTML(mother, baby, mergedAdmission, logoUrl);
      const filename = `Newborn_Admission_${(baby.full_name || baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate Newborn Admission form');
    }
  };
  const handlePrintNewbornDischargeSummary = async (baby) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let maternal = {};
      try {
        const resp = await axios.get(`/api/admin/admissions/patient/${patientId}`);
        maternal = (resp.data || [])[0] || {};
      } catch { }
      let admissionsRows = [];
      try {
        const r = await axios.get(`/api/clinic/babies/${baby.id}/admissions`);
        admissionsRows = r.data || [];
      } catch { }
      const discharged = admissionsRows.find((a) => a.status === 'discharged') || admissionsRows[0] || {};
      const mother = {
        gravida: maternal.gravida || '',
        para: maternal.para || ''
      };
      const html = generateNewbornDischargeSummaryHTML(mother, baby, discharged, maternal, logoUrl);
      const filename = `Newborn_Discharge_${(baby.full_name || baby.baby_name || 'Baby').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch {
      alert('Failed to generate Newborn Discharge summary');
    }
  };
  const handleDeleteBaby = async (babyId) => {
    alert('Deleting registered baby records is not available yet on the backend.');
    return;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Baby Records</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={selectedAdmissionId}
            onChange={(e) => setSelectedAdmissionId(e.target.value)}
            title="Filter by admission"
          >
            <option value="__all__">All admissions</option>
            <option value="__none__">Unassigned</option>
            {Array.from(new Set((babies || []).map(b => b.admission_id).filter(id => id !== null))).map((id) => {
              const adm = (admissions || []).find(a => String(a.id) === String(id));
              const label = adm && adm.admitted_at ? `Admission ${id} (${new Date(adm.admitted_at).toLocaleDateString()})` : `Admission ${id}`;
              return <option key={id} value={id}>{label}</option>;
            })}
          </select>
          <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <input className="px-3 py-2 border rounded" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              const sel = selectedAdmissionId;
              const resolved = (sel === '__all__' || sel === '__none__')
                ? (() => {
                  const items = (admissions || [])
                    .map(a => ({ id: a.id, d: a.admitted_at || a.appointment_date || a.admission_date || a.delivered_at || null }))
                    .filter(x => !!x.d)
                    .sort((x, y) => new Date(y.d) - new Date(x.d));
                  return items[0]?.id || null;
                })()
                : sel;
              openModal('add-baby', { admissionId: resolved });
            }}
          >
            Add Baby
          </button>

        </div>
      </div>
      {filteredBabies.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No baby records found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBabies.map((baby) => (
            <div key={baby.id} className="p-4 border rounded hover:shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{baby.full_name || 'Baby'}</div>
                  <div className="text-sm text-gray-600">
                    Born: {new Date(baby.birth_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm mt-2">
                    Weight: {baby.birth_weight_kg} kg | Length: {baby.birth_length_cm} cm
                  </div>
                  <div className="text-sm">
                    APGAR: {baby.apgar_1min} / {baby.apgar_5min}
                  </div>
                  {baby.complications && (
                    <div className="text-sm text-red-600 mt-1">
                      Complications: {baby.complications}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${baby.status === 'active' ? 'bg-green-100 text-green-800' :
                    baby.status === 'discharged' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {baby.status}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal('view-baby', baby)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openModal('admit-baby', baby)}
                      className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                      title="Admit Baby"
                    >
                      Admit
                    </button>
                    <button
                      onClick={() => openModal('add-baby-vitals', baby)}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      title="Add Baby Vitals"
                    >
                      Vitals
                    </button>
                    <button
                      onClick={() => openModal('discharge-baby', baby)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title="Discharge Summary"
                    >
                      Discharge
                    </button>
                    <button
                      onClick={() => openModal('edit-baby', baby)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title="Edit Baby"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBaby(baby.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="Delete Baby"
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

const CyclesTab = ({ admissions = [], babies = [], prenatalVisits = [], postpartumCare = [], patientId, openModal, onNavigateTo }) => {
  const groups = React.useMemo(() => {
    const admList = (admissions || []).map(a => ({ id: a.id, pivot: a.baby_birth_date || a.delivered_at || a.admitted_at || a.admission_date || a.appointment_date || null }))
      .filter(a => !!a.pivot)
      .sort((x, y) => new Date(x.pivot) - new Date(y.pivot));
    const map = new Map();
    (prenatalVisits || []).forEach((v) => {
      const id = v.pregnancy_id == null ? '__none__' : String(v.pregnancy_id);
      if (!map.has(id)) map.set(id, { id, items: [], first: null, latest: null });
      const g = map.get(id);
      const dt = v.scheduled_date || v.visit_date;
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.key} className="border rounded p-4 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">{g.label}</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={() => openModal('add-baby', { admissionId: g.admissionId })}
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
                        <span>Visit #{v.visit_number} • {new Date(v.scheduled_date || v.visit_date).toLocaleDateString()}</span>
                        <button className="text-blue-600" onClick={() => openModal('view-prenatal', v)}>View</button>
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
                        <span>{b.full_name || 'Baby'} • {new Date(b.birth_date).toLocaleDateString()}</span>
                        <button className="text-blue-600" onClick={() => openModal('view-baby', b)}>View</button>
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
                        <span>Day {c.day_postpartum} • {new Date(c.assessment_date).toLocaleDateString()}</span>
                        <button className="text-blue-600" onClick={() => openModal('view-postpartum', c)}>View</button>
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

const ReferralsTab = ({ referrals, patientId, reload, openModal }) => {
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
      let patient = { name: '', contact: '' };
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient.name = [prof.first_name, prof.middle_name, prof.last_name].filter(Boolean).join(' ');
        patient.contact = prof.phone || '';
      } catch { }
      const dateStr = referral.referral_datetime ? new Date(referral.referral_datetime).toLocaleString() : 'N/A';
      const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><title>Referral Slip</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class=\"header\">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class=\"clinic\">N.B. SEGOROYNE LYING-IN CLINIC</div><div class=\"sub\">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class=\"sub\">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class=\"title\">REFERRAL SLIP</div><table><tr><td style=\"width:50%\"><span class=\"label\">Patient</span> <span class=\"value\">${patient.name || 'Patient'}</span></td><td style=\"width:50%\"><span class=\"label\">Contact</span> <span class=\"value\">${patient.contact || ''}</span></td></tr><tr><td><span class=\"label\">Referred To</span> <span class=\"value\">${referral.referral_to || ''}</span></td><td><span class=\"label\">Datetime</span> <span class=\"value\">${dateStr}</span></td></tr><tr><td><span class=\"label\">Reason</span> <span class=\"value\">${referral.referral_reason || ''}</span></td><td></td></tr><tr><td><span class=\"label\">Diagnosis</span> <span class=\"value\">${referral.diagnosis || ''}</span></td><td><span class=\"label\">Treatment Given</span> <span class=\"value\">${referral.treatment_given || ''}</span></td></tr><tr><td colspan=\"2\"><span class=\"label\">Notes</span> <span class=\"value\">${referral.notes || ''}</span></td></tr></table></body></html>`;
      const filename = `Referral_${(patient.name || 'Patient').replace(/\s+/g, '_')}`;
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
      <div className="bg-white rounded shadow">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th className="p-3">To</th>
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

const MedicationsTab = ({ medications, admissions, patientId, reload, openModal }) => {
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
  const handlePrintMedicationGroup = async (header, entries) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = { name: '', contact: '' };
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient.name = [prof.first_name, prof.middle_name, prof.last_name].filter(Boolean).join(' ');
        patient.contact = prof.phone || '';
      } catch { }
      const rows = entries || [];
      const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><title>Medication Administration</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} th,td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class=\"header\">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class=\"clinic\">N.B. SEGOROYNE LYING-IN CLINIC</div><div class=\"sub\">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class=\"sub\">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class=\"title\">MEDICATION ADMINISTRATION</div><table><tr><td style=\"width:50%\"><span class=\"label\">Patient</span> <span class=\"value\">${patient.name || 'Patient'}</span></td><td style=\"width:50%\"><span class=\"label\">Contact</span> <span class=\"value\">${patient.contact || ''}</span></td></tr><tr><td><span class=\"label\">Administration Date</span> <span class=\"value\">${header.administration_date || ''}</span></td><td><span class=\"label\">Admission ID</span> <span class=\"value\">${header.admission_id || ''}</span></td></tr></table><table><thead><tr><th>Time</th><th>Medication</th><th>Dose</th><th>Route</th><th>Administered By</th><th>Notes</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.time_administered || ''}</td><td>${r.medication_name || ''}</td><td>${r.dose || ''}</td><td>${r.route || ''}</td><td>${r.administered_by || ''}</td><td>${r.notes || ''}</td></tr>`).join('')}</tbody></table></body></html>`;
      const filename = `Medication_${(patient.name || 'Patient').replace(/\s+/g, '_')}_${header.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };
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
              <button onClick={() => handlePrintMedicationGroup(header, entries)} className="px-3 py-1 bg-gray-700 text-white rounded text-xs">Print PDF</button>
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

const BirthPlanTab = ({ birthPlans, patientId, profile, prenatalVisits = [], reload, openModal }) => {
  const latest = (birthPlans && birthPlans.length > 0) ? birthPlans[0] : null;
  const handlePrint = async () => {
    const base = window.location.origin;
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
    const html = generateBirthPlanHTML(latest || {}, patientData, prenatalData, logoUrl);
    const filename = `Birth_Plan_${(patientData.name || 'Patient').replace(/\s+/g, '_')}`;
    downloadHTMLAsPDF(html, filename);
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Birth Plan</h3>
        <div className="flex gap-2">
          <button onClick={() => openModal('add-birth-plan')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add/Update</button>
          {latest && <button onClick={handlePrint} className="px-3 py-1 bg-gray-700 text-white rounded text-sm">Print Latest</button>}
        </div>
      </div>
      {!latest && <div className="text-gray-500">No birth plan recorded</div>}
      {latest && (
        <div className="bg-white rounded shadow p-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-gray-600 text-sm">Partner</div>
              <div className="font-medium">{latest.partner_name || '-'} {latest.partner_phone ? `(${latest.partner_phone})` : ''}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Transport Mode</div>
              <div className="font-medium">{latest.transport_mode || '-'}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Blood Donor</div>
              <div className="font-medium">{latest.donor_name || '-'} {latest.donor_phone ? `(${latest.donor_phone})` : ''}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">PhilHealth</div>
              <div className="font-medium">{latest.philhealth_status || '-'}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">Married: {latest.married === null ? '-' : latest.married ? 'Yes' : 'No'}</div>
          <div className="text-sm text-gray-600">Consent Signed: {latest.consent_signed === null ? '-' : latest.consent_signed ? 'Yes' : 'No'}</div>
          {latest.signed_at && <div className="text-sm text-gray-600">Signed At: {new Date(latest.signed_at).toLocaleString()}</div>}
        </div>
      )}
      {birthPlans && birthPlans.length > 0 && (
        <div className="bg-white rounded shadow">
          <div className="border-b px-4 py-2 font-medium">History</div>
          <div className="overflow-x-auto p-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Recorded</th>
                  <th className="py-2 pr-4">Signed</th>
                  <th className="py-2 pr-4">Partner</th>
                  <th className="py-2 pr-4">Transport</th>
                  <th className="py-2 pr-4">PhilHealth</th>
                  <th className="py-2 pr-4">Married</th>
                  <th className="py-2 pr-4">Consent</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {birthPlans.map((bp) => (
                  <tr key={bp.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">{bp.created_at ? new Date(bp.created_at).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-4">{bp.signed_at ? new Date(bp.signed_at).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-4">{bp.partner_name || '-'}</td>
                    <td className="py-2 pr-4">{bp.transport_mode || '-'}</td>
                    <td className="py-2 pr-4">{bp.philhealth_status || '-'}</td>
                    <td className="py-2 pr-4">{bp.married === null ? '-' : bp.married ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-4">{bp.consent_signed === null ? '-' : bp.consent_signed ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => openModal('view-birth-plan', bp)}>View</button>
                        <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => openModal('edit-birth-plan', bp)}>Edit</button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={async () => { if (!window.confirm('Delete this birth plan?')) return; try { await axios.delete(`/api/clinic/birth-plan/${bp.id}`); reload(); } catch (e) { alert(e.response?.data?.error || 'Failed to delete birth plan'); } }}>Delete</button>
                        <button className="px-2 py-1 bg-gray-700 text-white rounded" onClick={async () => { const logoUrl = await resolveLogoUrl(); const patientData = { name: [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' '), first_name: profile?.first_name, middle_name: profile?.middle_name, last_name: profile?.last_name, age: profile?.age, phone: profile?.phone, partner_age: profile?.partner_age }; const latestPrenatal = (prenatalVisits || []).slice().sort((x, y) => new Date(y.scheduled_date || y.visit_date || 0) - new Date(x.scheduled_date || x.visit_date || 0))[0] || null; const prenatalData = latestPrenatal ? { gestational_age: latestPrenatal.gestational_age, gravida: latestPrenatal.gravida, para: latestPrenatal.para } : { gravida: profile?.gravida, para: profile?.para }; const html = generateBirthPlanHTML(bp || {}, patientData, prenatalData, logoUrl); const filename = `Birth_Plan_${(patientData.name || 'Patient').replace(/\s+/g, '_')}_${bp.id}`; downloadHTMLAsPDF(html, filename); }}>Print</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AddBirthPlanModal = ({ patientId, onClose, onSuccess }) => {
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

  // No cycle selection needed for birth plan; form uses patientId prop directly
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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
      await axios.post('/api/clinic/birth-plan', payload);
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
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Plan'}</button>
        </div>
      </form>
    </div>
  );
};

const ViewBirthPlanModal = ({ plan, onClose }) => {
  if (!plan) return null;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Birth Plan</h2>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Partner:</span> {plan.partner_name || '-'} {plan.partner_phone ? `(${plan.partner_phone})` : ''}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Transport Mode:</span> {plan.transport_mode || '-'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Emergency Facility:</span> {plan.emergency_facility || '-'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Blood Donor:</span> {plan.donor_name || '-'} {plan.donor_phone ? `(${plan.donor_phone})` : ''}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">PhilHealth:</span> {plan.philhealth_status || '-'}</div>
        </div>
        <div className="font-medium"><span className="text-sm text-gray-600">Married:</span> {plan.married === null ? '-' : plan.married ? 'Yes' : 'No'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Consent Signed:</span> {plan.consent_signed === null ? '-' : plan.consent_signed ? 'Yes' : 'No'}</div>
        {plan.signed_at && <div className="font-medium"><span className="text-sm text-gray-600">Signed At:</span> {new Date(plan.signed_at).toLocaleString()}</div>}
        <div>
          <div className="text-sm text-gray-600">Mother Checklist</div>
          <div className="font-mono text-xs bg-gray-50 border rounded p-2 whitespace-pre-wrap">{plan.checklist_mother || '-'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Baby Checklist</div>
          <div className="font-mono text-xs bg-gray-50 border rounded p-2 whitespace-pre-wrap">{plan.checklist_baby || '-'}</div>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded">Close</button>
        </div>
      </div>
    </div>
  );
};

const EditBirthPlanModal = ({ plan, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    partner_name: plan?.partner_name || '',
    partner_phone: plan?.partner_phone || '',
    transport_mode: plan?.transport_mode || '',
    emergency_facility: plan?.emergency_facility || '',
    donor_name: plan?.donor_name || '',
    donor_phone: plan?.donor_phone || '',
    philhealth_status: plan?.philhealth_status || '',
    married: plan?.married === null ? '' : plan?.married ? 'yes' : 'no',
    consent_signed: plan?.consent_signed === null ? '' : plan?.consent_signed ? 'yes' : 'no',
    signed_at: plan?.signed_at ? new Date(plan.signed_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    checklist_mother: plan?.checklist_mother || '',
    checklist_baby: plan?.checklist_baby || ''
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
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
      await axios.put(`/api/clinic/birth-plan/${plan.id}`, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update birth plan');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Edit Birth Plan</h2>
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
          <div>
            <label className="block text-sm font-medium mb-1">PhilHealth Status</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={formData.philhealth_status} onChange={(e) => setFormData({ ...formData, philhealth_status: e.target.value })} />
          </div>
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
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

const LabResultsTab = ({ results, patientId, reload, openModal }) => {
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
    return catOk && statusOk && monthOk && searchOk;
  });
  const handleDeleteLabResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this lab result?')) return;

    try {
      await axios.delete(`/api/clinic/lab-results/${resultId}`);
      reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete lab result');
    }
  };

  const handlePrintClinicalLabReports = async () => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = {};
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient = { first_name: prof.first_name || '', middle_name: prof.middle_name || '', last_name: prof.last_name || '', age: prof.age || '', gender: prof.gender || 'female' };
        patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
      } catch { }
      const ultrasound = filteredResults.filter(r => (r.test_category === 'imaging' || r.test_category === 'ultrasound') && /ultra/i.test((r.test_name || r.test_type || '')));
      const urinalysis = filteredResults.filter(r => (r.test_category === 'urine') || /urinalysis|urine/i.test((r.test_name || r.test_type || '')));
      const cbc = filteredResults.filter(r => (r.test_category === 'blood') && /cbc/i.test((r.test_name || r.test_type || '')));
      const bloodTyping = filteredResults.filter(r => /blood\s*type|typing/i.test((r.test_name || r.test_type || '')));
      const vdrl = filteredResults.filter(r => /vdrl|rpr/i.test((r.test_name || r.test_type || '')));
      const hepaB = filteredResults.filter(r => /hbsag|hepa\s*b|hepatitis\s*b/i.test((r.test_name || r.test_type || '')));
      const cervical = filteredResults.filter(r => (r.test_category === 'cervical_screening') || /pap\s*smear|hpv|cervical/i.test((r.test_name || r.test_type || '')));
      const pregnancy = filteredResults.filter(r => (r.test_category === 'pregnancy') || /pregnancy|hcg/i.test((r.test_name || r.test_type || '')));
      const included = new Set([...ultrasound, ...urinalysis, ...cbc, ...bloodTyping, ...vdrl, ...hepaB, ...cervical, ...pregnancy].map(x => x.id));
      const others = filteredResults.filter(r => !included.has(r.id));
      const sections = { ultrasound, urinalysis, cbc, blood_typing: bloodTyping, vdrl, hepa_b: hepaB, cervical_screening: cervical, pregnancy, others };
      const html = generateClinicalLabReportsHTML(patient, sections, logoUrl);
      const filename = `Clinical_Lab_Reports_${(patient.full_name || 'Patient').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error(e);
      alert('Failed to generate Clinical and Laboratory Reports');
    }
  };

  const handlePrintSingleLabTest = async (test) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = {};
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient = { first_name: prof.first_name || '', middle_name: prof.middle_name || '', last_name: prof.last_name || '', age: prof.age || '', gender: prof.gender || 'female' };
        patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
      } catch { }
      const html = generateSingleLabTestHTML(patient, test, logoUrl);
      const tName = (test.test_name || test.test_type || 'LabTest').replace(/\s+/g, '_');
      const pName = (patient.full_name || 'Patient').replace(/\s+/g, '_');
      const filename = `${tName}_${pName}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error(e);
      alert('Failed to generate Lab Test PDF');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Laboratory & Test Results</h3>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => openModal('add-lab')}
          >
            Add Lab Result
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handlePrintClinicalLabReports}
            title="Print Clinical & Laboratory Reports"
          >
            Lab Reports PDF
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="px-3 py-2 border rounded" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="__all__">All categories</option>
          {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="__all__">All statuses</option>
          {statuses.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        <input className="px-3 py-2 border rounded" placeholder="Search test name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="px-3 py-2 border rounded" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="__all__">All categories</option>
          {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="__all__">All statuses</option>
          {statuses.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <input className="px-3 py-2 border rounded" placeholder="Search test name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {results.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No lab results found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-4">Test Date</th>
                <th className="py-3 pr-4">Test Type</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Result</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result) => (
                <tr key={result.id} className={`border-b hover:bg-gray-50 ${result.test_category === 'cervical_screening' ? 'bg-pink-50' : ''
                  }`}>
                  <td className="py-3 pr-4">{new Date(result.test_date).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {result.test_category === 'cervical_screening' && (
                        <span className="w-2 h-2 bg-pink-500 rounded-full" title="Cervical Screening"></span>
                      )}
                      {result.test_type}
                    </div>
                  </td>
                  <td className="py-3 pr-4 capitalize">
                    {result.test_category === 'cervical_screening' ? 'Cervical Screening' : result.test_category}
                  </td>
                  <td className="py-3 pr-4">{result.result_value || '-'}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded text-xs ${result.status === 'critical' ? 'bg-red-100 text-red-800' :
                      result.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                        result.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-1">

                      <button
                        onClick={() => openModal('view-lab-result', result)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handlePrintSingleLabTest(result)}
                        className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                        title="Print PDF"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => openModal('edit-lab-result', result)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Edit Result"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLabResult(result.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="Delete Result"
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

const ImmunizationsTab = ({ immunizations, patientId, reload, openModal }) => {
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
    if (!window.confirm('Are you sure you want to delete this immunization record?')) return;

    try {
      await axios.delete(`/api/clinic/immunizations/${immunizationId}`);
      reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete immunization record');
    }
  };

  const handleDeleteScreening = async (screeningId) => {
    if (!window.confirm('Are you sure you want to delete this screening record?')) return;

    try {
      await axios.delete(`/api/clinic/screenings/${screeningId}`);
      reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete screening record');
    }
  };

  const handleDeleteProcedure = async (procedureId) => {
    if (!window.confirm('Are you sure you want to delete this procedure record?')) return;

    try {
      await axios.delete(`/api/clinic/procedures/${procedureId}`);
      reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete procedure record');
    }
  };

  const handlePrintImmunization = async (immunization) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = { name: '', contact: '' };
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient.name = [prof.first_name, prof.middle_name, prof.last_name].filter(Boolean).join(' ');
        patient.contact = prof.phone || '';
      } catch { }
      const dateStr = immunization.date_given ? new Date(immunization.date_given).toLocaleDateString() : 'N/A';
      const nextDue = immunization.next_due_date ? new Date(immunization.next_due_date).toLocaleDateString() : 'N/A';
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Immunization Record</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class="header">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class="clinic">N.B. SEGOROYNE LYING-IN CLINIC</div><div class="sub">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class="sub">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class="title">IMMUNIZATION RECORD</div><table><tr><td style="width:50%"><span class="label">Patient</span> <span class="value">${patient.name || 'Patient'}</span></td><td style="width:50%"><span class="label">Contact</span> <span class="value">${patient.contact || ''}</span></td></tr><tr><td><span class="label">Vaccine Type</span> <span class="value">${immunization.vaccine_type || ''}</span></td><td><span class="label">Date Given</span> <span class="value">${dateStr}</span></td></tr><tr><td><span class="label">Dose Number</span> <span class="value">${immunization.dose_number ?? ''}</span></td><td><span class="label">Injection Site</span> <span class="value">${immunization.injection_site || ''}</span></td></tr><tr><td><span class="label">Provider</span> <span class="value">${immunization.healthcare_provider || ''}</span></td><td><span class="label">Next Due</span> <span class="value">${nextDue}</span></td></tr></table></body></html>`;
      const filename = `Immunization_${(patient.name || 'Patient').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Immunization Records</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border rounded" value={selectedVaccine} onChange={(e) => setSelectedVaccine(e.target.value)}>
            <option value="__all__">All vaccines</option>
            {vaccines.map(v => (<option key={v} value={v}>{v}</option>))}
          </select>
          <select className="px-3 py-2 border rounded" value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
            <option value="__all__">All due states</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
            <option value="none">No schedule</option>
          </select>
          <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-4">Date Given</th>
                <th className="py-3 pr-4">Vaccine Type</th>
                <th className="py-3 pr-4">Dose</th>
                <th className="py-3 pr-4">Site</th>
                <th className="py-3 pr-4">Healthcare Provider</th>
                <th className="py-3 pr-4">Next Due</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredImmunizations.map((immunization) => (
                <tr key={immunization.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 pr-4">{new Date(immunization.date_given).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💉</span>
                      {immunization.vaccine_type}
                    </div>
                  </td>
                  <td className="py-3 pr-4">{immunization.dose_number || 'N/A'}</td>
                  <td className="py-3 pr-4">{immunization.injection_site || 'N/A'}</td>
                  <td className="py-3 pr-4">{immunization.healthcare_provider || 'N/A'}</td>
                  <td className="py-3 pr-4">
                    {immunization.next_due_date ? (
                      <span className={`px-2 py-1 rounded text-xs ${new Date(immunization.next_due_date) < new Date() ?
                        'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {new Date(immunization.next_due_date).toLocaleDateString()}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openModal('view-immunization', immunization)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handlePrintImmunization(immunization)}
                        className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                        title="Print PDF"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => openModal('edit-immunization', immunization)}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        title="Edit Record"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteImmunization(immunization.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="Delete Record"
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

const ScreeningsTab = ({ screenings, patientId, reload, openModal }) => {
  const [selectedTest, setSelectedTest] = useState('__all__');
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const tests = Array.from(new Set((screenings || []).map(s => s.test_type).filter(Boolean)));
  const statuses = Array.from(new Set((screenings || []).map(s => s.status).filter(Boolean)));
  const filteredScreenings = (screenings || []).filter(s => {
    const typeOk = selectedTest === '__all__' ? true : String(s.test_type) === String(selectedTest);
    const statusOk = selectedStatus === '__all__' ? true : String(s.status) === String(selectedStatus);
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = s.date_performed || s.screening_date;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return typeOk && statusOk && monthOk;
  });
  const handleDeleteScreening = async (screeningId) => {
    if (!window.confirm('Are you sure you want to delete this screening record?')) return;

    try {
      await axios.delete(`/api/clinic/screenings/${screeningId}`);
      reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete screening record');
    }
  };

  const handlePrintScreening = async (screening) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = { name: '', contact: '' };
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient.name = [prof.first_name, prof.middle_name, prof.last_name].filter(Boolean).join(' ');
        patient.contact = prof.phone || '';
      } catch { }
      const dateStr = screening.screening_date ? new Date(screening.screening_date).toLocaleString() : (screening.date_performed ? new Date(screening.date_performed).toLocaleString() : 'N/A');
      const statusUi = (() => { const s = screening.status; const v = (s === 'completed' ? 'normal' : (s || 'pending')).toUpperCase(); return v; })();
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Newborn Screening Report</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class=\"header\">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class=\"clinic\">N.B. SEGOROYNE LYING-IN CLINIC</div><div class=\"sub\">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class=\"sub\">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class=\"title\">NEWBORN SCREENING REPORT</div><table><tr><td style=\"width:50%\"><span class=\"label\">Patient</span> <span class=\"value\">${patient.name || 'Patient'}</span></td><td style=\"width:50%\"><span class=\"label\">Contact</span> <span class=\"value\">${patient.contact || ''}</span></td></tr><tr><td><span class=\"label\">Test Type</span> <span class=\"value\">${screening.screening_type || screening.test_type || ''}</span></td><td><span class=\"label\">Date</span> <span class=\"value\">${dateStr}</span></td></tr><tr><td><span class=\"label\">Result</span> <span class=\"value\">${(screening.results ?? screening.result ?? '')}</span></td><td><span class=\"label\">Status</span> <span class=\"value\">${statusUi}</span></td></tr><tr><td colspan=\"2\"><span class=\"label\">Provider</span> <span class=\"value\">${screening.screened_by ?? screening.healthcare_provider ?? ''}</span></td></tr></table></body></html>`;
      const filename = `Screening_${(patient.name || 'Patient').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Newborn Screening Records</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border rounded" value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
            <option value="__all__">All tests</option>
            {tests.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            onClick={() => openModal('add-screening')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Screening
          </button>
        </div>
      </div>

      {filteredScreenings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No screening records found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Performed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Healthcare Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScreenings.map((screening) => (
                <tr key={screening.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {screening.test_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(screening.date_performed).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {screening.result}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${screening.status === 'Normal' ? 'bg-green-100 text-green-800' :
                      screening.status === 'Abnormal' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {screening.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {screening.healthcare_provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('view-screening', screening)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handlePrintScreening(screening)}
                        className="text-gray-800 hover:text-black"
                        title="Print PDF"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => openModal('edit-screening', screening)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteScreening(screening.id)}
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

const ProceduresTab = ({ procedures, patientId, reload, openModal }) => {
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
    if (!window.confirm('Are you sure you want to delete this procedure record?')) return;

    try {
      await axios.delete(`/api/clinic/procedures/${procedureId}`);
      reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete procedure record');
    }
  };

  const handlePrintProcedure = async (procedure) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = { name: '', contact: '' };
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient.name = [prof.first_name, prof.middle_name, prof.last_name].filter(Boolean).join(' ');
        patient.contact = prof.phone || '';
      } catch { }
      const dateStr = procedure.date_performed ? new Date(procedure.date_performed).toLocaleDateString() : 'N/A';
      const status = (procedure.status || '').toString().toUpperCase();
      const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><title>Procedure Record</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111} .header{display:flex;align-items:center;gap:10px;margin-bottom:10px} .logo-box{width:24mm;height:24mm;display:flex;align-items:center;justify-content:center;background:#111;border-radius:2mm} .logo{width:22mm;height:22mm;object-fit:contain} .clinic{font-weight:700;font-size:12pt} .sub{font-size:10pt;color:#555} .title{font-weight:700;text-align:center;margin:6mm 0 4mm} table{width:100%;border-collapse:collapse} td{border-bottom:1px solid #666;padding:3mm;vertical-align:top} .label{font-weight:700;color:#000;white-space:nowrap} .value{color:#000}</style></head><body><div class=\"header\">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class=\"clinic\">N.B. SEGOROYNE LYING-IN CLINIC</div><div class=\"sub\">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class=\"sub\">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div><div class=\"title\">MEDICAL PROCEDURE RECORD</div><table><tr><td style=\"width:50%\"><span class=\"label\">Patient</span> <span class=\"value\">${patient.name || 'Patient'}</span></td><td style=\"width:50%\"><span class=\"label\">Contact</span> <span class=\"value\">${patient.contact || ''}</span></td></tr><tr><td><span class=\"label\">Procedure Type</span> <span class=\"value\">${procedure.procedure_type || ''}</span></td><td><span class=\"label\">Date</span> <span class=\"value\">${dateStr}</span></td></tr><tr><td><span class=\"label\">Provider</span> <span class=\"value\">${procedure.healthcare_provider || ''}</span></td><td><span class=\"label\">Status</span> <span class=\"value\">${status}</span></td></tr><tr><td colspan=\"2\"><span class=\"label\">Outcome</span> <span class=\"value\">${procedure.outcome || ''}</span></td></tr></table></body></html>`;
      const filename = `Procedure_${(patient.name || 'Patient').replace(/\s+/g, '_')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate PDF');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Medical Procedures</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border rounded" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="__all__">All types</option>
            {types.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            onClick={() => openModal('add-procedure')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Procedure
          </button>
        </div>
      </div>

      {filteredProcedures.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No procedure records found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Performed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Healthcare Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Appointment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcedures.map((procedure) => (
                <tr key={procedure.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {procedure.procedure_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(procedure.date_performed).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${procedure.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      procedure.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        procedure.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {procedure.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {procedure.healthcare_provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {procedure.next_appointment ? new Date(procedure.next_appointment).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('view-procedure', procedure)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handlePrintProcedure(procedure)}
                        className="text-gray-800 hover:text-black"
                        title="Print PDF"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => openModal('edit-procedure', procedure)}
                        className="text-green-600 hover:text-green-900"
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

const PostpartumTab = ({ care, admissions = [], prenatalVisits = [], selectedAdmissionIdProp = '__all__', patientId, reload, openModal }) => {
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('__all__');
  useEffect(() => { try { if (typeof selectedAdmissionIdProp !== 'undefined') setSelectedAdmissionId(selectedAdmissionIdProp); } catch { } }, [selectedAdmissionIdProp]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedPrenatalCycleId, setSelectedPrenatalCycleId] = useState('__all__');
  const admissionIds = Array.from(new Set((care || []).map(c => c.admission_id).filter(id => id !== null)));

  const prenatalCycleIds = Array.from(new Set((prenatalVisits || []).map(v => v.pregnancy_id).filter(id => id !== null)));
  const prenatalGroups = React.useMemo(() => {
    const map = new Map();
    (prenatalVisits || []).forEach((v) => {
      const id = v.pregnancy_id == null ? '__none__' : String(v.pregnancy_id);
      const dt = v.scheduled_date || v.visit_date;
      if (!map.has(id)) map.set(id, { id, items: [], latest: null });
      const g = map.get(id);
      g.items.push(v);
      if (dt && (!g.latest || new Date(dt) > new Date(g.latest))) g.latest = dt;
    });
    const list = Array.from(map.values()).map(g => ({ ...g, label: g.id === '__none__' ? 'Unassigned' : `Cycle ${g.id}` }))
      .sort((a, b) => new Date(b.latest || 0) - new Date(a.latest || 0));
    return list;
  }, [prenatalVisits]);

  const resolveAdmissionForCycle = (cycleId) => {
    try {
      if (!cycleId || cycleId === '__all__') return null;
      const group = (prenatalGroups || []).find(g => String(g.id) === String(cycleId));
      const pivot = group?.latest || null;
      if (!pivot) return null;
      const sortedAdms = (admissions || []).map(a => ({
        id: a.id,
        date: a.baby_birth_date || a.admitted_at || a.admission_date || null
      })).filter(a => !!a.date).sort((x, y) => new Date(x.date) - new Date(y.date));
      const after = sortedAdms.filter(a => new Date(a.date) >= new Date(pivot));
      return (after[0]?.id) || null;
    } catch { return null; }
  };

  const monthFilteredCare = (care || []).filter(c => {
    const byAdmission = (() => {
      if (selectedAdmissionId === '__all__') return true;
      if (selectedAdmissionId === '__none__') return c.admission_id == null;
      return String(c.admission_id) === String(selectedAdmissionId);
    })();
    const monthOk = (() => {
      if (!selectedMonth) return true;
      const dt = c.assessment_date;
      if (!dt) return false;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    })();
    return byAdmission && monthOk;
  });
  const handleDeletePostpartumAssessment = async (assessmentId) => {
    if (window.confirm('Are you sure you want to delete this postpartum assessment?')) {
      try {
        await axios.delete(`/api/clinic/postpartum-care/${assessmentId}`);
        reload(); // Refresh patient data
      } catch (error) {
        console.error('Error deleting postpartum assessment:', error);
        alert('Failed to delete postpartum assessment');
      }
    }
  };

  const handlePrintPostpartumRecord = async () => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = {};
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient = {
          first_name: prof.first_name || '',
          middle_name: prof.middle_name || '',
          last_name: prof.last_name || ''
        };
        patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
      } catch { }
      let delivery = {};
      try {
        const a = await axios.get(`/api/admin/admissions/patient/${patientId}`);
        const rows = a.data || [];
        const latest = rows.length ? rows[rows.length - 1] : {};
        delivery = {
          baby_birth_date: latest.baby_birth_date || '',
          admitted_at: latest.admitted_at || ''
        };
      } catch { }
      const within24h = care.find(c => Number(c.day_postpartum) <= 1) || care[0] || {};
      const within7d = care.find(c => Number(c.day_postpartum) > 1 && Number(c.day_postpartum) <= 7) || (care.length > 1 ? care[1] : {});
      if (!within24h.family_planning_method || !within7d.family_planning_method) {
        try {
          const fp = await axios.get(`/api/clinic/family-planning/${patientId}`);
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
  };

  const handlePrintSinglePostpartum = async (assessment) => {
    try {
      const base = window.location.origin;
      const logoUrl = await resolveLogoUrl();
      let patient = {};
      try {
        const p = await axios.get(`/api/admin/patient-profile/${patientId}`);
        const prof = p.data || {};
        patient = { first_name: prof.first_name || '', middle_name: prof.middle_name || '', last_name: prof.last_name || '' };
        patient.full_name = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
      } catch { }
      const html = generateSinglePostpartumAssessmentHTML(patient, assessment, logoUrl);
      const filename = `Postpartum_Assessment_${(patient.full_name || 'Patient').replace(/\s+/g, '_')}_${(assessment.assessment_date ? new Date(assessment.assessment_date).toISOString().split('T')[0] : 'Date')}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      alert('Failed to generate Postpartum Assessment PDF');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Postpartum Care Assessments</h3>
        <div className="flex gap-2 items-center">
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
          <select
            className="px-3 py-2 border rounded"
            value={selectedPrenatalCycleId}
            onChange={(e) => setSelectedPrenatalCycleId(e.target.value)}
            title="Follow prenatal cycle"
          >
            <option value="__all__">All cycles</option>
            <option value="__none__">Unassigned</option>
            {prenatalCycleIds.map((id) => (
              <option key={id} value={id}>Cycle {id}</option>
            ))}
          </select>
          <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              const primary = (selectedAdmissionId === '__all__' || selectedAdmissionId === '__none__')
                ? (selectedPrenatalCycleId === '__all__' || selectedPrenatalCycleId === '__none__' ? null : resolveAdmissionForCycle(selectedPrenatalCycleId))
                : selectedAdmissionId;
              const fallback = (() => {
                const items = (admissions || [])
                  .map(a => ({ id: a.id, d: a.admitted_at || a.appointment_date || a.admission_date || a.delivered_at || null }))
                  .filter(x => !!x.d)
                  .sort((x, y) => new Date(y.d) - new Date(x.d));
                return items[0]?.id || null;
              })();
              const admId = primary == null ? fallback : primary;
              const prefillCycle = (selectedPrenatalCycleId === '__all__' || selectedPrenatalCycleId === '__none__') ? '' : String(selectedPrenatalCycleId);
              openModal('add-postpartum', { admissionId: admId, prefill: { pregnancy_id: prefillCycle } });
            }}
          >
            Add Assessment
          </button>

          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handlePrintPostpartumRecord}
            title="Print Postpartum Record"
          >
            Postpartum PDF
          </button>
        </div>
      </div>
      {(() => {
        const groups = (() => {
          const list = [];
          (prenatalGroups || []).forEach((g) => {
            const admId = resolveAdmissionForCycle(g.id);
            const items = monthFilteredCare.filter(c => (admId == null ? c.admission_id == null : String(c.admission_id || '') === String(admId)));
            list.push({ id: g.id, label: g.label, items });
          });
          return list;
        })();
        if (groups.length === 0) {
          return (
            <div className="space-y-8">
              <div>
                <div className="text-xl font-semibold mb-3">All postpartum assessments</div>
                {monthFilteredCare.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No postpartum assessments found</div>
                ) : (
                  <div className="space-y-3">
                    {monthFilteredCare.map((assessment) => (
                      <div key={assessment.id} className="p-4 border rounded">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-semibold">Day {assessment.day_postpartum} Postpartum</div>
                            <div className="text-sm text-gray-600">{new Date(assessment.assessment_date).toLocaleDateString()}</div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:underline px-2 py-1 rounded" onClick={() => openModal('view-postpartum', assessment)}>View Details</button>
                            <button className="text-gray-800 hover:underline px-2 py-1 rounded" onClick={() => handlePrintSinglePostpartum(assessment)}>Print</button>
                            <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600" onClick={() => openModal('edit-postpartum', assessment)}>Edit</button>
                            <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onClick={() => handleDeletePostpartumAssessment(assessment.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }
        const present = groups[0] || { id: '', label: '', items: [] };
        const past = groups.slice(1);
        const groupedIds = new Set(groups.flatMap(g => g.items.map(i => i.id)));
        const unmatched = monthFilteredCare.filter(c => !groupedIds.has(c.id));
        return (
          <div className="space-y-8">
            <div>
              <div className="text-xl font-semibold mb-3">Present postpartum cycle</div>
              {present.items.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No postpartum assessments found</div>
              ) : (
                <div className="space-y-3">
                  {present.items.map((assessment) => (
                    <div key={assessment.id} className="p-4 border rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">Day {assessment.day_postpartum} Postpartum</div>
                          <div className="text-sm text-gray-600">{new Date(assessment.assessment_date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:underline px-2 py-1 rounded" onClick={() => openModal('view-postpartum', assessment)}>View Details</button>
                          <button className="text-gray-800 hover:underline px-2 py-1 rounded" onClick={() => handlePrintSinglePostpartum(assessment)}>Print</button>
                          <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600" onClick={() => openModal('edit-postpartum', assessment)}>Edit</button>
                          <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onClick={() => handleDeletePostpartumAssessment(assessment.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {past.length > 0 && (
              <div>
                <div className="text-xl font-semibold mb-3">The past postpartum cycle</div>
                <div className="space-y-6">
                  {past.map((grp) => (
                    <div key={grp.id}>
                      <div className="text-sm font-medium mb-2">{grp.label}</div>
                      {grp.items.length === 0 ? (
                        <div className="text-gray-500 text-sm">None</div>
                      ) : (
                        <div className="space-y-3">
                          {grp.items.map((assessment) => (
                            <div key={assessment.id} className="p-4 border rounded">
                              <div className="flex justify-between">
                                <div>
                                  <div className="font-semibold">Day {assessment.day_postpartum} Postpartum</div>
                                  <div className="text-sm text-gray-600">{new Date(assessment.assessment_date).toLocaleDateString()}</div>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:underline px-2 py-1 rounded" onClick={() => openModal('view-postpartum', assessment)}>View Details</button>
                                  <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600" onClick={() => openModal('edit-postpartum', assessment)}>Edit</button>
                                  <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onClick={() => handleDeletePostpartumAssessment(assessment.id)}>Delete</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {unmatched.length > 0 && (
              <div>
                <div className="text-xl font-semibold mb-3">Other postpartum assessments</div>
                <div className="space-y-3">
                  {unmatched.map((assessment) => (
                    <div key={assessment.id} className="p-4 border rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">Day {assessment.day_postpartum} Postpartum</div>
                          <div className="text-sm text-gray-600">{new Date(assessment.assessment_date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:underline px-2 py-1 rounded" onClick={() => openModal('view-postpartum', assessment)}>View Details</button>
                          <button className="text-gray-800 hover:underline px-2 py-1 rounded" onClick={() => handlePrintSinglePostpartum(assessment)}>Print</button>
                          <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600" onClick={() => openModal('edit-postpartum', assessment)}>Edit</button>
                          <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onClick={() => handleDeletePostpartumAssessment(assessment.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

const AdmissionsTab = ({ admissions = [], userId, reload, openModal }) => {
  const getUserRole = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role || '';
    } catch {
      return '';
    }
  };

  const userRole = getUserRole();
  const canManage = ['admin', 'doctor', 'staff', 'midwife'].includes(userRole);
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');

  const statuses = Array.from(new Set(admissions.map(a => a.status).filter(Boolean)));
  const filtered = admissions.filter(a => {
    const statusOk = selectedStatus === '__all__' ? true : String(a.status) === String(selectedStatus);
    if (!selectedMonth) return statusOk;
    const dt = a.admission_date || a.admitted_at || a.appointment_date || null;
    if (!dt) return false && statusOk;
    const d = new Date(dt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return statusOk && key === selectedMonth;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admission?')) return;
    try {
      await axios.delete(`/api/admin/admissions/${id}`);
      reload();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete');
    }
  };

  const handlePrintAdmission = async (admission) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const p = await axios.get(`/api/admin/patient-profile/${admission.user_id || userId}`).catch(() => ({ data: {} }));
      const profile = p.data || {};
      const patientData = {
        first_name: profile.first_name || '',
        middle_name: profile.middle_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        age: profile.age || '',
        address: profile.address || ''
      };
      const html = generateAdmissionFormHTML(admission, patientData, {}, logoUrl);
      const filename = `Admission_Form_${(admission.display_patient_name || admission.patient_name || 'Patient').replace(/\s+/g, '_')}_${admission.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error(e);
      alert('Failed to generate admission form');
    }
  };

  const handlePrintMotherDischarge = async (admission) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const p = await axios.get(`/api/admin/patient-profile/${admission.user_id || userId}`).catch(() => ({ data: {} }));
      const profile = p.data || {};
      const patientData = {
        first_name: profile.first_name || '',
        middle_name: profile.middle_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        age: profile.age || '',
        address: profile.address || ''
      };
      const html = generateMotherDischargeSummaryHTML(patientData, admission, {}, logoUrl);
      const filename = `Mother_Discharge_${(admission.display_patient_name || admission.patient_name || 'Patient').replace(/\s+/g, '_')}_${admission.id}`;
      downloadHTMLAsPDF(html, filename);
    } catch (e) {
      console.error(e);
      alert('Failed to generate discharge summary');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hospital Admissions</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          {canManage && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => openModal('add-admission')}
            >
              Add Admission
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No admissions found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((admission) => (
            <div key={admission.id} className="p-4 border rounded hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold">Admission #{admission.id}</div>
                    <span className={`px-2 py-1 text-xs rounded ${admission.patient_type === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{admission.patient_type === 'registered' ? 'Registered Patient' : 'Walk-in Patient'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-800">Patient Information:</div>
                      <div>Name: {admission.display_patient_name || 'Unknown'}</div>
                      <div>Contact: {admission.display_contact_number || 'Not provided'}</div>
                      {admission.patient_email && <div>Email: {admission.patient_email}</div>}
                      {admission.patient_age && <div>Age: {admission.patient_age}</div>}
                      {admission.patient_gender && <div>Gender: {admission.patient_gender}</div>}
                      {admission.patient_blood_type && <div>Blood Type: {admission.patient_blood_type}</div>}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-800">Admission Details:</div>
                      <div>Admitted: {admission.admitted_at && new Date(admission.admitted_at).toLocaleString()}</div>
                      <div>Room: {admission.room || 'Not assigned'}</div>
                      <div>Reason: {admission.admission_reason}</div>
                      {admission.booking_id && <div>Booking ID: #{admission.booking_id}</div>}
                      {admission.service_type && <div>Service: {admission.service_type}</div>}
                    </div>
                    {(admission.discharged_at || admission.discharge_notes || admission.disposition) && (
                      <div className="space-y-1 md:col-span-2">
                        <div className="font-medium text-gray-800">Discharge Information:</div>
                        {admission.discharged_at && <div>Discharged: {new Date(admission.discharged_at).toLocaleString()}</div>}
                        {admission.disposition && <div>Disposition: {admission.disposition}</div>}
                        {admission.discharge_notes && <div>Notes: {admission.discharge_notes}</div>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-sm ${admission.status === 'admitted' ? 'bg-yellow-100 text-yellow-800' : admission.status === 'discharged' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{admission.status}</span>
                  {canManage && (
                    <div className="flex gap-1">
                      <button onClick={() => openModal('view-admission', admission)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">View</button>
                      <button onClick={() => openModal('edit-admission', admission)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                      {admission.status === 'admitted' && (
                        <button onClick={() => openModal('update-delivery', admission)} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">Delivery</button>
                      )}
                      <button onClick={() => openModal('add-baby', { prefill: { birth_date: admission.baby_birth_date || admission.admitted_at?.slice(0, 10) || '', birth_time: admission.baby_birth_time || '', birth_weight_kg: admission.baby_weight_kg || '', birth_length_cm: admission.baby_length_cm || '', head_circumference_cm: admission.baby_head_circumference_cm || '', apgar_1min: admission.apgar1 || '', apgar_5min: admission.apgar5 || '' }, admissionId: admission.id })} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Create Baby</button>
                      <button onClick={() => openModal('add-medication-admin', { prefill_admission_id: admission.id })} className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200">Add Medication</button>
                      {admission.status === 'admitted' && (
                        <button onClick={() => openModal('discharge-admission', admission)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Discharge</button>
                      )}
                      {admission.status !== 'discharged' && (
                        <button onClick={() => handleDelete(admission.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                      )}
                      <button onClick={() => handlePrintAdmission(admission)} className="px-2 py-1 text-xs bg-gray-700 text-white rounded">Print Form</button>
                      <button onClick={() => handlePrintMotherDischarge(admission)} className="px-2 py-1 text-xs bg-gray-700 text-white rounded">Print Discharge</button>
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

const FamilyPlanningTab = ({ records, patientId, reload, openModal }) => {
  const [selectedMethod, setSelectedMethod] = useState('__all__');
  const [selectedStatus, setSelectedStatus] = useState('__all__');
  const [selectedMonth, setSelectedMonth] = useState('');
  const methods = Array.from(new Set((records || []).map(r => r.method_chosen).filter(Boolean)));
  const statuses = Array.from(new Set((records || []).map(r => r.status).filter(Boolean)));
  const filteredRecords = (records || []).filter(r => {
    const methodOk = selectedMethod === '__all__' ? true : String(r.method_chosen) === String(selectedMethod);
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
  const handleDeleteFamilyPlanningRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this family planning record?')) {
      try {
        await axios.delete(`/api/clinic/family-planning/${recordId}`);
        reload(); // Refresh patient data
      } catch (error) {
        console.error('Error deleting family planning record:', error);
        alert('Failed to delete family planning record');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Family Planning Records</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border rounded" value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
            <option value="__all__">All methods</option>
            {methods.map(m => (<option key={m} value={m}>{m}</option>))}
          </select>
          <select className="px-3 py-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="__all__">All statuses</option>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input type="month" className="px-3 py-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
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
          {filteredRecords.map((record) => (
            <div key={record.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold">{record.method_chosen || 'Method not specified'}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(record.consultation_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm mt-1">Category: {record.method_category}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded text-sm ${record.status === 'active' ? 'bg-green-100 text-green-800' :
                    record.status === 'discontinued' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {record.status}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      onClick={() => openModal('view-family-planning', record)}
                    >
                      View
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      onClick={() => openModal('edit-family-planning', record)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      onClick={() => handleDeleteFamilyPlanningRecord(record.id)}
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

// Modal Components
const PrenatalScheduleModal = ({ patientId, profile, pregnancyId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    visit_number: '',
    trimester: '1',
    scheduled_date: '',
    gestational_age: '',
    blood_pressure: '',
    weight_kg: '',
    fundal_height_cm: '',
    fetal_heart_rate: '',
    temperature_c: '',
    maternal_heart_rate: '',
    respiratory_rate: '',
    edema: false,
    complaints: '',
    assessment: '',
    plan: '',
    next_visit_date: '',
    notes: '',
    pregnancy_id: pregnancyId || ''
  });
  const [visitMode, setVisitMode] = useState('booked');
  const [createBooking, setCreateBooking] = useState(true);
  const [orderLabs, setOrderLabs] = useState(false);
  const [selectedLabs, setSelectedLabs] = useState({ cbc: true, blood_typing: true, vdrl: true, hepa_b: true, urine: true });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/api/clinic/prenatal-schedule/${patientId}`);
        const visits = Array.isArray(res.data) ? res.data : [];
        const nextVisitNum = String((visits.length || 0) + 1);
        const maxPregId = visits.reduce((acc, v) => {
          const pid = Number(v.pregnancy_id || 0);
          return pid > acc ? pid : acc;
        }, 0);
        setFormData((prev) => ({
          ...prev,
          visit_number: prev.visit_number || nextVisitNum,
          pregnancy_id: prev.pregnancy_id || String(maxPregId || 1)
        }));
      } catch { }
    })();
  }, [patientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (visitMode === 'walkin') {
        const name = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ').trim();
        await axios.post('/api/admin/walkin/prenatal', {
          patient_name: name,
          contact_number: profile.phone || '00000000000',
          visit_date: formData.scheduled_date,
          gestational_age: formData.gestational_age || null,
          weight: formData.weight_kg || null,
          blood_pressure: formData.blood_pressure || null,
          fundal_height: formData.fundal_height_cm || null,
          fetal_heart_rate: formData.fetal_heart_rate || null,
          temperature_c: formData.temperature_c || null,
          heart_rate: formData.maternal_heart_rate || null,
          respiratory_rate: formData.respiratory_rate || null,
          notes: formData.assessment || formData.notes || null,
          next_visit_date: formData.next_visit_date || null
        });
      } else {
        await axios.post('/api/clinic/prenatal-schedule', {
          patient_id: patientId,
          visit_number: formData.visit_number,
          trimester: formData.trimester,
          scheduled_date: formData.scheduled_date,
          gestational_age: formData.gestational_age || null,
          blood_pressure: formData.blood_pressure || null,
          weight_kg: formData.weight_kg || null,
          fundal_height_cm: formData.fundal_height_cm || null,
          fetal_heart_rate: formData.fetal_heart_rate || null,
          edema: formData.edema ? 1 : 0,
          complaints: formData.complaints || null,
          assessment: formData.assessment || null,
          plan: formData.plan || null,
          next_visit_date: formData.next_visit_date || null,
          notes: formData.notes || null,
          pregnancy_id: formData.pregnancy_id === '' ? null : Number(formData.pregnancy_id)
        });
      }

      if (visitMode === 'booked' && createBooking) {
        const name = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ').trim();
        await axios.post('/api/admin/create-walkin', {
          patient_name: name,
          contact_number: profile.phone || '00000000000',
          service_type: 'Prenatal Checkup',
          date: formData.scheduled_date,
          time_slot: '00:00',
          existing_user_id: profile.user_id || null
        });
      }

      if (orderLabs) {
        const labs = [
          { key: 'cbc', label: 'Complete Blood Count' },
          { key: 'blood_typing', label: 'Blood Type' },
          { key: 'vdrl', label: 'Syphilis (VDRL)' },
          { key: 'hepa_b', label: 'Hepatitis B' },
          { key: 'urine', label: 'Urinalysis' }
        ];
        const payloads = labs.filter(l => selectedLabs[l.key]).map(l => ({
          patient_id: patientId,
          test_type: l.label,
          test_category: l.key,
          test_date: formData.scheduled_date,
          status: 'ordered'
        }));
        await Promise.all(payloads.map(p => axios.post('/api/clinic/lab-results', p)));
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling prenatal visit:', error);
      const server = error?.response?.data;
      const message = (server && (server.error || server.message)) || error.message || 'Failed to schedule prenatal visit';
      setErrorMsg(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Schedule Prenatal Visit</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (<div className="p-2 rounded bg-red-50 text-red-700 text-sm">{errorMsg}</div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visit Type</label>
            <select className="w-full border rounded px-3 py-2" value={visitMode} onChange={(e) => setVisitMode(e.target.value)}>
              <option value="booked">Booked</option>
              <option value="walkin">Walk-in</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={createBooking} onChange={(e) => setCreateBooking(e.target.checked)} />
            <span className="text-sm">Create booking for this visit</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visit Number</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.visit_number}
              onChange={(e) => setFormData({ ...formData, visit_number: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Trimester</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.trimester}
              onChange={(e) => setFormData({ ...formData, trimester: e.target.value })}
              required
            >
              <option value="1">First (1-12 weeks)</option>
              <option value="2">Second (13-26 weeks)</option>
              <option value="3">Third (27-40 weeks)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pangilang Anak (Child Number)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.pregnancy_id}
              onChange={(e) => setFormData({ ...formData, pregnancy_id: e.target.value })}
              placeholder="Halimbawa: 1, 2, 3"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Scheduled Date</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gestational Age</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.gestational_age}
            onChange={(e) => setFormData({ ...formData, gestational_age: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Blood Pressure</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.blood_pressure}
              onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fundal Height (cm)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.fundal_height_cm}
              onChange={(e) => setFormData({ ...formData, fundal_height_cm: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fetal Heart Rate (bpm)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.fetal_heart_rate}
              onChange={(e) => setFormData({ ...formData, fetal_heart_rate: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
            <input type="number" step="0.1" className="w-full border rounded px-3 py-2" value={formData.temperature_c} onChange={(e) => setFormData({ ...formData, temperature_c: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Maternal Heart Rate</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={formData.maternal_heart_rate} onChange={(e) => setFormData({ ...formData, maternal_heart_rate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Respiratory Rate</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={formData.respiratory_rate} onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.edema}
              onChange={(e) => setFormData({ ...formData, edema: e.target.checked })}
            />
            <span className="text-sm">Edema</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Next Visit Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.next_visit_date}
              onChange={(e) => setFormData({ ...formData, next_visit_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Complaints</label>
          <textarea className="w-full border rounded px-3 py-2" value={formData.complaints} onChange={(e) => setFormData({ ...formData, complaints: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Assessment</label>
          <textarea className="w-full border rounded px-3 py-2" value={formData.assessment} onChange={(e) => setFormData({ ...formData, assessment: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plan</label>
          <textarea className="w-full border rounded px-3 py-2" value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full border rounded px-3 py-2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </div>
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={orderLabs} onChange={(e) => setOrderLabs(e.target.checked)} />
            <span className="text-sm">Also order prenatal labs</span>
          </div>
          {orderLabs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'cbc', label: 'CBC' },
                { key: 'blood_typing', label: 'Blood Typing' },
                { key: 'vdrl', label: 'VDRL' },
                { key: 'hepa_b', label: 'Hepatitis B' },
                { key: 'urine', label: 'Urinalysis' }
              ].map(t => (
                <label key={t.key} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!selectedLabs[t.key]} onChange={(e) => setSelectedLabs({ ...selectedLabs, [t.key]: e.target.checked })} />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={loading || !formData.visit_number || !formData.trimester || !formData.scheduled_date} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Schedule Visit'}
          </button>
        </div>
      </form>
    </div>
  );
};

const OrderPrenatalLabsModal = ({ patientId, onClose, onSuccess }) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

const AddBabyModal = ({ patientId, admissions = [], prefill = {}, admissionId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: prefill.birth_date || '',
    birth_time: prefill.birth_time || '',
    gender: 'male',
    birth_weight_kg: prefill.birth_weight_kg || '',
    birth_length_cm: prefill.birth_length_cm || '',
    head_circumference_cm: prefill.head_circumference_cm || '',
    apgar_1min: prefill.apgar_1min || '',
    apgar_5min: prefill.apgar_5min || '',
    blood_type: '',
    complications: '',
    admission_id: admissionId || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/clinic/babies', {
        mother_patient_id: patientId,
        admission_id: formData.admission_id || null,
        first_name: formData.first_name || null,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name || null,
        birth_date: formData.birth_date,
        birth_time: formData.birth_time || null,
        gender: formData.gender,
        birth_weight_kg: formData.birth_weight_kg || null,
        birth_length_cm: formData.birth_length_cm || null,
        head_circumference_cm: formData.head_circumference_cm || null,
        apgar_1min: formData.apgar_1min || null,
        apgar_5min: formData.apgar_5min || null,
        blood_type: formData.blood_type || null,
        complications: formData.complications || null
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding baby record:', error);
      alert('Failed to add baby record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Baby Record</h2>
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
        <h3 className="text-lg font-semibold border-b pb-2">Baby Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Middle Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
        </div>
        <h3 className="text-lg font-semibold border-b pb-2">Birth Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Birth Date *</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Birth Time</label>
            <input
              type="time"
              className="w-full border rounded px-3 py-2"
              value={formData.birth_time}
              onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender *</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <h3 className="text-lg font-semibold border-b pb-2">Measurements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2"
              value={formData.birth_weight_kg}
              onChange={(e) => setFormData({ ...formData, birth_weight_kg: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Length (cm)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={formData.birth_length_cm}
              onChange={(e) => setFormData({ ...formData, birth_length_cm: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Head Circumference (cm)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={formData.head_circumference_cm}
              onChange={(e) => setFormData({ ...formData, head_circumference_cm: e.target.value })}
            />
          </div>
        </div>
        <h3 className="text-lg font-semibold border-b pb-2">APGAR & Blood Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">APGAR 1 min</label>
            <input
              type="number"
              min="0"
              max="10"
              className="w-full border rounded px-3 py-2"
              value={formData.apgar_1min}
              onChange={(e) => setFormData({ ...formData, apgar_1min: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">APGAR 5 min</label>
            <input
              type="number"
              min="0"
              max="10"
              className="w-full border rounded px-3 py-2"
              value={formData.apgar_5min}
              onChange={(e) => setFormData({ ...formData, apgar_5min: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blood Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.blood_type}
              onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
            >
              <option value="">Unknown</option>
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
        <div>
          <label className="block text-sm font-medium mb-1">Complications</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={formData.complications}
            onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Link to Admission</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.admission_id}
            onChange={(e) => setFormData({ ...formData, admission_id: e.target.value })}
          >
            <option value="">None</option>
            {admissions.filter(a => a.status === 'admitted').map(a => (
              <option key={a.id} value={a.id}>Admission #{a.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Complications/Notes</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="3"
            value={formData.complications}
            onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
          ></textarea>
        </div>
        <div className="flex gap-2 justify-end pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Add Baby Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

const AddBabyVitalsModal = ({ baby, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    recorded_at: new Date().toISOString().slice(0, 16),
    weight_kg: '',
    length_cm: '',
    head_circumference_cm: '',
    temperature: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    feeding_type: '',
    blood_pressure: '',
    urine: '',
    stool: '',
    notes: '',
    recorded_by: (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u?.name || ''; } catch { return ''; } })()
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        baby_id: baby.id,
        recorded_at: new Date(formData.recorded_at).toISOString().slice(0, 19).replace('T', ' '),
        weight_kg: formData.weight_kg !== '' ? parseFloat(formData.weight_kg) : null,
        length_cm: formData.length_cm !== '' ? parseFloat(formData.length_cm) : null,
        head_circumference_cm: formData.head_circumference_cm !== '' ? parseFloat(formData.head_circumference_cm) : null,
        temperature: formData.temperature !== '' ? parseFloat(formData.temperature) : null,
        heart_rate: formData.heart_rate !== '' ? parseInt(formData.heart_rate) : null,
        respiratory_rate: formData.respiratory_rate !== '' ? parseInt(formData.respiratory_rate) : null,
        oxygen_saturation: formData.oxygen_saturation !== '' ? parseInt(formData.oxygen_saturation) : null,
        feeding_type: formData.feeding_type || null,
        blood_pressure: formData.blood_pressure || null,
        urine: formData.urine || null,
        stool: formData.stool || null,
        notes: formData.notes || '',
        recorded_by: formData.recorded_by || null
      };
      await axios.post('/api/clinic/babies/vitals', payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding baby vitals:', error);
      alert(error.response?.data?.error || 'Failed to add baby vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Newborn Vitals Entry</h2>
      <div className="mb-4 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-900">
        <div className="font-medium">
          Baby: {(baby?.first_name || '') + ' ' + (baby?.last_name || '')}
        </div>
        <div>
          DOB: {baby?.birth_date || '-'}{baby?.birth_time ? ` ${baby.birth_time}` : ''} • APGAR: {typeof baby?.apgar_1min !== 'undefined' ? baby.apgar_1min : '-'} / {typeof baby?.apgar_5min !== 'undefined' ? baby.apgar_5min : '-'}
        </div>
        <div>
          Birth Wt/Len/HC: {baby?.birth_weight_kg || '-'} kg • {baby?.birth_length_cm || '-'} cm • {baby?.head_circumference_cm || '-'} cm
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recorded At</label>
            <input
              type="datetime-local"
              className="w-full border rounded px-3 py-2"
              value={formData.recorded_at}
              onChange={(e) => setFormData({ ...formData, recorded_at: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Feeding Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.feeding_type}
              onChange={(e) => setFormData({ ...formData, feeding_type: e.target.value })}
            >
              <option value="">Select</option>
              <option value="breastfeeding">Breastfeeding</option>
              <option value="formula">Formula</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">BP</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.blood_pressure}
              onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
              placeholder="e.g., 70/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Length (cm)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={formData.length_cm}
              onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Head Circumference (cm)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={formData.head_circumference_cm}
              onChange={(e) => setFormData({ ...formData, head_circumference_cm: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded px-3 py-2"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Heart Rate (bpm)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.heart_rate}
              onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Respiratory Rate (breaths/min)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.respiratory_rate}
              onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Oxygen Saturation (%)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.oxygen_saturation}
              onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Urine</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.urine}
              onChange={(e) => setFormData({ ...formData, urine: e.target.value })}
              placeholder="e.g., normal / remarks"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stool</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.stool}
              onChange={(e) => setFormData({ ...formData, stool: e.target.value })}
              placeholder="e.g., normal / remarks"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recorded By</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.recorded_by}
            onChange={(e) => setFormData({ ...formData, recorded_by: e.target.value })}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Add Vitals'}
          </button>
        </div>
      </form>
    </div>
  );
};

const AddBabyAdmissionModal = ({ baby, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date_admitted: new Date().toISOString().slice(0, 19).replace('T', ' '),
    admitting_diagnosis: 'Full term baby via NSD',
    notes: ''
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
      <h2 className="text-2xl font-bold mb-4">Admit Newborn</h2>
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

  useEffect(() => {
    if (!admission) return;
    try {
      const n = admission.notes ? (typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes) : {};
      const dd = n?.delivery_details || {};
      setFormData((prev) => ({
        ...prev,
        screening_date: dd.screening_date || prev.screening_date,
        screening_filter_card_no: dd.screening_filter_card_no || prev.screening_filter_card_no,
        vitamin_k_date: dd.vitamin_k_date || prev.vitamin_k_date,
        bcg_date: dd.bcg_date || prev.bcg_date,
        hepb_date: dd.hepb_date || prev.hepb_date,
        home_medication: dd.home_medication || prev.home_medication,
        follow_up: dd.follow_up || prev.follow_up,
        discharged_by: admission.discharged_by || prev.discharged_by
      }));
    } catch { }
  }, [admission]);

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
      <h2 className="text-2xl font-bold mb-4">Newborn Discharge Summary</h2>
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

// AddLabResultModal removed - now using SharedAddLabResultModal from ./modals
















// AddImmunizationModal removed - now using SharedAddImmunizationModal from ./modals















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

// Edit Immunization Modal Component (save disabled due to missing backend route)
const EditImmunizationModal = ({ immunization, onClose /*, onSuccess*/ }) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Immunization Record</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="flex justify-end mt-6 gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        <button disabled className="px-4 py-2 bg-yellow-400 text-white rounded opacity-60 cursor-not-allowed" title="Editing not supported yet">Save Changes</button>
      </div>
    </div>
  );
};

// AddScreeningModal removed - now using SharedAddScreeningModal from ./modals















const ViewScreeningModal = ({ screening, onClose, onPrint }) => {
  if (!screening) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Screening Details</h2>
        <div className="flex items-center gap-2">
          {onPrint && (<button onClick={onPrint} className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600">Print PDF</button>)}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Test Type:</span> {screening.test_type}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Date Performed:</span> {new Date(screening.date_performed).toLocaleDateString()}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Result:</span> {screening.result || '—'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> {screening.status}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Healthcare Provider:</span> {screening.healthcare_provider || '—'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Lab Name:</span> {screening.lab_name || '—'}</div>
        </div>
        <div className="font-medium"><span className="text-sm text-gray-600">Interpretation:</span> {screening.interpretation || '—'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Recommendations:</span> {screening.recommendations || '—'}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Required:</span> {screening.follow_up_required ? 'Yes' : 'No'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Date:</span> {screening.follow_up_date ? new Date(screening.follow_up_date).toLocaleDateString() : '—'}</div>
        </div>
        <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {screening.notes || '—'}</div>
      </div>
      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Close</button>
      </div>
    </div>
  );
};

const EditScreeningModal = ({ screening, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    test_type: screening?.test_type || '',
    date_performed: screening?.date_performed ? screening.date_performed.split('T')[0] : '',
    result: screening?.result || '',
    status: screening?.status || 'Pending',
    healthcare_provider: screening?.healthcare_provider || '',
    interpretation: screening?.interpretation || '',
    recommendations: screening?.recommendations || '',
    follow_up_required: !!screening?.follow_up_required,
    follow_up_date: screening?.follow_up_date ? screening.follow_up_date.split('T')[0] : '',
    lab_name: screening?.lab_name || '',
    notes: screening?.notes || '',
    // Optional backend fields defaulted to null to avoid undefined
    gestational_age: screening?.gestational_age ?? null,
    birth_weight_kg: screening?.birth_weight_kg ?? null,
    screening_method: screening?.screening_method ?? null
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!screening?.id) return;
    setLoading(true);
    try {
      await axios.put(`/api/clinic/screenings/${screening.id}`, {
        ...formData
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update screening record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Edit Screening Record</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Type *</label>
            <select name="test_type" value={formData.test_type} onChange={handleChange} required className="w-full border rounded px-3 py-2">
              <option value="">Select Test Type</option>
              <option value="Newborn Screening Test">Newborn Screening Test</option>
              <option value="Newborn Hearing Test">Newborn Hearing Test</option>
              <option value="Metabolic Screening">Metabolic Screening</option>
              <option value="Genetic Screening">Genetic Screening</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Performed *</label>
            <input type="date" name="date_performed" value={formData.date_performed} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
            <input type="text" name="result" value={formData.result} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select name="status" value={formData.status} onChange={handleChange} required className="w-full border rounded px-3 py-2">
              <option value="Normal">Normal</option>
              <option value="Abnormal">Abnormal</option>
              <option value="Pending">Pending</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Healthcare Provider</label>
            <input type="text" name="healthcare_provider" value={formData.healthcare_provider} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lab Name</label>
            <input type="text" name="lab_name" value={formData.lab_name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interpretation</label>
            <textarea name="interpretation" rows="3" value={formData.interpretation} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
            <textarea name="recommendations" rows="3" value={formData.recommendations} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex items-center">
          <input type="checkbox" name="follow_up_required" checked={formData.follow_up_required} onChange={handleChange} className="mr-2" />
          <label className="text-sm font-medium text-gray-700">Follow-up Required</label>
        </div>
        {formData.follow_up_required && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" rows="3" value={formData.notes} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

// AddProcedureModal removed - now using SharedAddProcedureModal from ./modals




















const AddPostpartumModal = ({ patientId, admissions = [], prenatalVisits = [], prefill = {}, admissionId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    admission_id: admissionId || '',
    pregnancy_id: prefill.pregnancy_id || '',
    day_postpartum: '7',
    assessment_date: '',
    breastfeeding_status: 'yes',
    notes: '',
    iron_supplement_date: '',
    vitamin_a_date: '',
    foul_smell_discharge: false,
    family_planning_method: '',
    fever: false,
    vaginal_bleeding: false,
    visit_window: '7d'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedPrenatalCycleId, setSelectedPrenatalCycleId] = useState(prefill.pregnancy_id || '');
  const prenatalCycleIds = Array.from(new Set((prenatalVisits || []).map(v => v.pregnancy_id).filter(id => id !== null)));
  const prenatalGroups = React.useMemo(() => {
    const map = new Map();
    (prenatalVisits || []).forEach((v) => {
      const id = v.pregnancy_id == null ? '__none__' : String(v.pregnancy_id);
      const dt = v.scheduled_date || v.visit_date;
      if (!map.has(id)) map.set(id, { id, items: [], latest: null });
      const g = map.get(id);
      g.items.push(v);
      if (dt && (!g.latest || new Date(dt) > new Date(g.latest))) g.latest = dt;
    });
    return Array.from(map.values()).map(g => ({ ...g, label: g.id === '__none__' ? 'Unassigned' : `Cycle ${g.id}` }))
      .sort((a, b) => new Date(b.latest || 0) - new Date(a.latest || 0));
  }, [prenatalVisits]);

  const resolveAdmissionForCycle = (cycleId) => {
    try {
      if (!cycleId || cycleId === '__none__') return null;
      const group = (prenatalGroups || []).find(g => String(g.id) === String(cycleId));
      const pivot = group?.latest || null;
      if (!pivot) return null;
      const sortedAdms = (admissions || []).map(a => ({
        id: a.id,
        date: a.baby_birth_date || a.admitted_at || a.admission_date || null
      })).filter(a => !!a.date).sort((x, y) => new Date(x.date) - new Date(y.date));
      const after = sortedAdms.filter(a => new Date(a.date) >= new Date(pivot));
      return (after[0]?.id) || null;
    } catch { return null; }
  };

  useEffect(() => {
    if (!selectedPrenatalCycleId) return;
    const admId = resolveAdmissionForCycle(selectedPrenatalCycleId);
    setFormData(prev => ({ ...prev, admission_id: admId || '', pregnancy_id: selectedPrenatalCycleId }));
  }, [selectedPrenatalCycleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        patient_id: patientId,
        admission_id: formData.admission_id || null,
        pregnancy_id: formData.pregnancy_id === '' ? null : Number(formData.pregnancy_id),
        day_postpartum: formData.day_postpartum ? Number(formData.day_postpartum) : undefined,
        assessment_date: formData.assessment_date,
        breastfeeding_status: formData.breastfeeding_status || null,
        notes: formData.notes || null,
        iron_supplement_date: formData.iron_supplement_date || null,
        vitamin_a_date: formData.vitamin_a_date || null,
        foul_smell_discharge: formData.foul_smell_discharge ? 1 : 0,
        family_planning_method: formData.family_planning_method || null,
        fever: formData.fever ? 1 : 0,
        vaginal_bleeding: formData.vaginal_bleeding ? 1 : 0
      };
      if (!payload.day_postpartum || !payload.assessment_date) {
        throw new Error('Please select a visit window and assessment date');
      }
      await axios.post('/api/clinic/postpartum-care', payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding postpartum assessment:', error);
      const server = error?.response?.data;
      const message = (server && (server.error || server.message)) || error.message || 'Failed to add postpartum assessment';
      setErrorMsg(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Postpartum Record</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {errorMsg && (<div className="p-2 rounded bg-red-50 text-red-700 text-sm">{errorMsg}</div>)}
        <div>
          <label className="block text-sm font-medium mb-1">Pregnancy Cycle</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedPrenatalCycleId}
            onChange={(e) => setSelectedPrenatalCycleId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {prenatalCycleIds.map((id) => (
              <option key={id} value={id}>Cycle {id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Admission</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.admission_id}
            onChange={(e) => setFormData({ ...formData, admission_id: e.target.value })}
          >
            <option value="">None</option>
            {(admissions || []).map((a) => (
              <option key={a.id} value={a.id}>
                {`Admission ${a.id}${a.admitted_at ? ` (${new Date(a.admitted_at).toLocaleDateString()})` : ''}`}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visit Window *</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="visit_window" checked={formData.visit_window === '24h'} onChange={() => setFormData({ ...formData, visit_window: '24h', day_postpartum: '1' })} />
                <span>Within 24 hours</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="visit_window" checked={formData.visit_window === '7d'} onChange={() => setFormData({ ...formData, visit_window: '7d', day_postpartum: '7' })} />
                <span>Within 7 days</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assessment Date *</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.assessment_date}
              onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vit. A 200,000 IU Given</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.vitamin_a_date}
              onChange={(e) => setFormData({ ...formData, vitamin_a_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Iron Supplement Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.iron_supplement_date}
              onChange={(e) => setFormData({ ...formData, iron_supplement_date: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" checked={formData.breastfeeding_status === 'yes'} onChange={(e) => setFormData({ ...formData, breastfeeding_status: e.target.checked ? 'yes' : 'no' })} />
            <label className="text-sm font-medium">Breastfeeding</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" checked={formData.fever} onChange={(e) => setFormData({ ...formData, fever: e.target.checked })} />
            <label className="text-sm font-medium">Fever</label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" checked={formData.vaginal_bleeding} onChange={(e) => setFormData({ ...formData, vaginal_bleeding: e.target.checked })} />
            <label className="text-sm font-medium">Vaginal Bleeding</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" checked={formData.foul_smell_discharge} onChange={(e) => setFormData({ ...formData, foul_smell_discharge: e.target.checked })} />
            <label className="text-sm font-medium">Foul Smelling Vaginal Discharge</label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Family Planning To Be Used</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.family_planning_method}
            onChange={(e) => setFormData({ ...formData, family_planning_method: e.target.value })}
            placeholder="e.g., Pills, DMPA, IUD, Implant"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Problems/Actions/Referrals</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          ></textarea>
        </div>
        <div className="flex gap-2 justify-end pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={loading || !formData.assessment_date || !formData.day_postpartum} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>
    </div>
  );
};


const AddFamilyPlanningModal = ({ patientId, profile, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    consultation_date: '',
    method_chosen: '',
    method_started_date: '',
    method_category: 'natural',
    counseling_done: true,
    side_effects: '',
    follow_up_date: '',
    notes: '',
    counseled_by: ''
  });
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCounselors = async () => {
      try {
        const { data } = await axios.get('/api/users/available-counselors');
        setCounselors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading counselors:', err);
        setCounselors([]);
      }
    };
    loadCounselors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Normalize fields to match backend/DB expectations
      const counselorId = Number(formData.counseled_by);
      const submissionData = {
        patient_id: patientId,
        // spread first, then override normalized fields
        ...formData,
        // Normalize optional text/date fields: empty -> null
        method_chosen: formData.method_chosen && formData.method_chosen.trim() !== '' ? formData.method_chosen : null,
        method_started_date: formData.method_started_date && formData.method_started_date.trim() !== '' ? formData.method_started_date : null,
        follow_up_date: formData.follow_up_date && formData.follow_up_date.trim() !== '' ? formData.follow_up_date : null,
        notes: formData.notes && formData.notes.trim() !== '' ? formData.notes : null,
        side_effects: formData.side_effects && formData.side_effects.trim() !== '' ? formData.side_effects : null,
        // MySQL expects tinyint(1) for booleans; enforce 0/1
        counseling_done: formData.counseling_done ? 1 : 0,
        // Use numeric user id if provided; otherwise null
        counseled_by: Number.isInteger(counselorId) && counselorId > 0 ? counselorId : null
      };

      await axios.post('/api/clinic/family-planning', submissionData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding family planning record:', error);
      alert(error.response?.data?.error || 'Failed to add family planning record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Family Planning Record</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Consultation Date *</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.consultation_date}
              onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Method Category</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.method_category}
              onChange={(e) => setFormData({ ...formData, method_category: e.target.value })}
            >
              <option value="natural">Natural</option>
              <option value="barrier">Barrier</option>
              <option value="hormonal">Hormonal</option>
              <option value="iud">IUD</option>
              <option value="permanent">Permanent</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Method Chosen</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Pills, IUD, Condoms, etc."
            value={formData.method_chosen}
            onChange={(e) => setFormData({ ...formData, method_chosen: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Method Started Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.method_started_date}
              onChange={(e) => setFormData({ ...formData, method_started_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Follow-up Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Side Effects/Concerns</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="2"
            value={formData.side_effects}
            onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Counseled By</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.counseled_by || ''}
            onChange={(e) => setFormData({ ...formData, counseled_by: e.target.value })}
          >
            <option value="">None</option>
            {counselors.map((c) => (
              <option key={`${c.user_id}-${c.role}`} value={c.user_id}>
                {c.name} ({c.role})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="counseling_done"
            checked={formData.counseling_done}
            onChange={(e) => setFormData({ ...formData, counseling_done: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="counseling_done" className="text-sm font-medium">Counseling Done</label>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Add Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

// View Family Planning (registered patient)
const ViewFamilyPlanningModal = ({ familyPlanning, onClose }) => {
  const formatDate = (d) => {
    if (!d) return 'Not set';
    try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
  };

  const yesNo = (v) => {
    if (v === 1 || v === '1' || v === true) return 'Yes';
    return 'No';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Family Planning Record Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Consultation Date:</span> {formatDate(familyPlanning.consultation_date)}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Method Chosen:</span> {familyPlanning.method_chosen || 'Not specified'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Method Category:</span> {familyPlanning.method_category || '—'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Method Started:</span> {familyPlanning.method_started_date ? formatDate(familyPlanning.method_started_date) : 'Not started'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Counseling Done:</span> {yesNo(familyPlanning.counseling_done)}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Date:</span> {familyPlanning.follow_up_date ? formatDate(familyPlanning.follow_up_date) : 'Not scheduled'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Counseled By:</span> {familyPlanning.counselor_name || 'None'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs ${familyPlanning.status === 'active' ? 'bg-green-100 text-green-800' : familyPlanning.status === 'discontinued' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{familyPlanning.status || '—'}</span></div>
        </div>
        <div className="font-medium whitespace-pre-wrap"><span className="text-sm text-gray-600">Side Effects:</span> {familyPlanning.side_effects || 'None reported'}</div>
        <div className="font-medium whitespace-pre-wrap"><span className="text-sm text-gray-600">Notes:</span> {familyPlanning.notes || '—'}</div>
      </div>
    </div>
  );
};

// Edit Family Planning (registered patient)
const EditFamilyPlanningModal = ({ familyPlanning, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    consultation_date: familyPlanning.consultation_date ? new Date(familyPlanning.consultation_date).toISOString().split('T')[0] : '',
    method_chosen: familyPlanning.method_chosen || '',
    method_started_date: familyPlanning.method_started_date ? new Date(familyPlanning.method_started_date).toISOString().split('T')[0] : '',
    method_category: familyPlanning.method_category || 'natural',
    counseling_done: !!(Number(familyPlanning.counseling_done) || familyPlanning.counseling_done === true),
    side_effects: familyPlanning.side_effects || '',
    follow_up_date: familyPlanning.follow_up_date ? new Date(familyPlanning.follow_up_date).toISOString().split('T')[0] : '',
    notes: familyPlanning.notes || '',
    counseled_by: familyPlanning.counseled_by || ''
  });
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCounselors = async () => {
      try {
        const { data } = await axios.get('/api/users/available-counselors');
        setCounselors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading counselors:', err);
        setCounselors([]);
      }
    };
    loadCounselors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const counselorId = Number(formData.counseled_by);
      const submissionData = {
        // spread first, then override normalized fields
        ...formData,
        method_chosen: formData.method_chosen && formData.method_chosen.trim() !== '' ? formData.method_chosen : null,
        method_started_date: formData.method_started_date && formData.method_started_date.trim() !== '' ? formData.method_started_date : null,
        follow_up_date: formData.follow_up_date && formData.follow_up_date.trim() !== '' ? formData.follow_up_date : null,
        notes: formData.notes && formData.notes.trim() !== '' ? formData.notes : null,
        side_effects: formData.side_effects && formData.side_effects.trim() !== '' ? formData.side_effects : null,
        counseling_done: formData.counseling_done ? 1 : 0,
        counseled_by: Number.isInteger(counselorId) && counselorId > 0 ? counselorId : null
      };

      await axios.put(`/api/clinic/family-planning/${familyPlanning.id}`, submissionData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating family planning record:', error);
      alert(error.response?.data?.error || 'Failed to update family planning record');
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
              className="w-full border rounded px-3 py-2"
              value={formData.consultation_date}
              onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Method Category</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.method_category}
              onChange={(e) => setFormData({ ...formData, method_category: e.target.value })}
            >
              <option value="natural">Natural</option>
              <option value="barrier">Barrier</option>
              <option value="hormonal">Hormonal</option>
              <option value="iud">IUD</option>
              <option value="permanent">Permanent</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Method Chosen</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.method_chosen}
            onChange={(e) => setFormData({ ...formData, method_chosen: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Method Started Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.method_started_date}
              onChange={(e) => setFormData({ ...formData, method_started_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Follow-up Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Side Effects/Concerns</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="2"
            value={formData.side_effects}
            onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Counseled By</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.counseled_by || ''}
            onChange={(e) => setFormData({ ...formData, counseled_by: e.target.value })}
          >
            <option value="">None</option>
            {counselors.map((c) => (
              <option key={`${c.user_id}-${c.role}`} value={c.user_id}>
                {c.name} ({c.role})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit_counseling_done"
            checked={formData.counseling_done}
            onChange={(e) => setFormData({ ...formData, counseling_done: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="edit_counseling_done" className="text-sm font-medium">Counseling Done</label>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Admission Modal Components
const AddAdmissionModal = ({ patientId, profile, onClose, onSuccess }) => {
  // Pre-populate patient information from the profile
  const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ');

  const [formData, setFormData] = useState({
    booking_id: '',
    user_id: profile.user_id || patientId,
    patient_name: fullName,
    contact_number: profile.phone || '',
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
  // Since patientId is provided, this is automatically a registered patient
  const patientType = 'registered';
  const [physicalExam, setPhysicalExam] = useState({
    skin: '',
    conjunctiva: '',
    breast: '',
    abdomen: '',
    extremities: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        // Convert empty strings to null for optional numeric fields
        baby_weight_kg: formData.baby_weight_kg ? parseFloat(formData.baby_weight_kg) : null,
        apgar1: formData.apgar1 ? parseInt(formData.apgar1) : null,
        apgar5: formData.apgar5 ? parseInt(formData.apgar5) : null,
        booking_id: formData.booking_id || null,
        existing_user_id: patientType === 'registered' ? formData.user_id : null
      };
      const peHas = Object.values(physicalExam).some(v => String(v || '').trim() !== '');
      if (peHas) {
        submissionData.notes = JSON.stringify({ physical_exam: physicalExam });
      }

      await axios.post('/api/admin/admissions', submissionData);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create admission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Add New Admission</h2>

      {/* Patient Type Display - Registered Patient */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <div className="text-sm text-blue-800">
          <div><strong>Patient Type:</strong> Registered Patient</div>
          <div className="text-xs text-blue-600 mt-1">Adding admission for an existing registered patient</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Information */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Patient Information</h3>

          {/* Display current patient information */}
          <div className="mb-4 p-3 bg-gray-50 rounded border">
            <div className="text-sm text-gray-700">
              <div><strong>Patient:</strong> {fullName}</div>
              <div><strong>Contact:</strong> {profile.phone || 'Not provided'}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div className="text-xs text-gray-500 mt-1">Patient information is automatically filled from the current patient profile</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient Name *</label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                className="w-full p-2 border rounded"
                required
                placeholder="Patient name"
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
                placeholder="Contact number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Booking ID (if applicable)</label>
              <input
                type="number"
                value={formData.booking_id}
                onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter booking ID if this is from an appointment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Room Assignment</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., Room 101, Ward A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cycle of Pregnancy</label>
              <input
                type="text"
                value={formData.pregnancy_cycle}
                onChange={(e) => setFormData({ ...formData, pregnancy_cycle: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., G1P0"
              />
            </div>
          </div>
        </div>

        {/* Admission Details */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Admission Details</h3>
          <div>
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
                <option value="Ongoing Care">Ongoing Care</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Baby Weight (kg)</label>
              <input
                type="number"
                step="0.01"
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

        {/* Physical Examination (Optional) */}
        <div className="border-b pb-4">
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

const UpdateDeliveryModal = ({ admission, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    delivery_type: admission?.delivery_type || '',
    outcome: admission?.outcome || '',
    baby_weight_kg: admission?.baby_weight_kg || '',
    apgar1: admission?.apgar1 || '',
    apgar5: admission?.apgar5 || '',
    complications: admission?.complications || '',
    delivered_at: admission?.delivered_at ? new Date(admission.delivered_at).toISOString().slice(0, 16) : ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        delivery_type: formData.delivery_type || null,
        outcome: formData.outcome || null,
        baby_weight_kg: formData.baby_weight_kg !== '' ? parseFloat(formData.baby_weight_kg) : null,
        apgar1: formData.apgar1 !== '' ? parseInt(formData.apgar1) : null,
        apgar5: formData.apgar5 !== '' ? parseInt(formData.apgar5) : null,
        complications: formData.complications || null,
        delivered_at: formData.delivered_at ? new Date(formData.delivered_at).toISOString().slice(0, 19).replace('T', ' ') : null,
      };
      await axios.put(`/api/admin/admissions/${admission.id}/delivery`, payload);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update delivery details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Update Delivery Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
              <option value="live_birth">Live Birth</option>
              <option value="stillbirth">Stillbirth</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Baby Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.baby_weight_kg}
              onChange={(e) => setFormData({ ...formData, baby_weight_kg: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivered At</label>
            <input
              type="datetime-local"
              value={formData.delivered_at}
              onChange={(e) => setFormData({ ...formData, delivered_at: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">APGAR (1 min)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.apgar1}
              onChange={(e) => setFormData({ ...formData, apgar1: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">APGAR (5 min)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.apgar5}
              onChange={(e) => setFormData({ ...formData, apgar5: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Complications</label>
          <textarea
            value={formData.complications}
            onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Describe any complications"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Update Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditAdmissionModal = ({ admission, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patient_name: admission.patient_name || admission.display_patient_name || '',
    contact_number: admission.contact_number || admission.display_contact_number || '',
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
  const parseNotesObj = (n) => {
    if (!n) return {};
    if (typeof n === 'string') {
      try { const obj = JSON.parse(n); return (obj && typeof obj === 'object') ? obj : {}; } catch (e) { return {}; }
    }
    return (n && typeof n === 'object') ? n : {};
  };
  const initialNotesObj = parseNotesObj(admission.notes);
  const [physicalExam, setPhysicalExam] = useState({
    skin: (initialNotesObj.physical_exam && initialNotesObj.physical_exam.skin) ? initialNotesObj.physical_exam.skin : '',
    conjunctiva: (initialNotesObj.physical_exam && initialNotesObj.physical_exam.conjunctiva) ? initialNotesObj.physical_exam.conjunctiva : '',
    breast: (initialNotesObj.physical_exam && initialNotesObj.physical_exam.breast) ? initialNotesObj.physical_exam.breast : '',
    abdomen: (initialNotesObj.physical_exam && initialNotesObj.physical_exam.abdomen) ? initialNotesObj.physical_exam.abdomen : '',
    extremities: (initialNotesObj.physical_exam && initialNotesObj.physical_exam.extremities) ? initialNotesObj.physical_exam.extremities : ''
  });

  useEffect(() => {
    const loadCycles = async () => {
      try {
        setLoadingCycles(true);
        if (admission.patient_type === 'registered' && admission.user_id) {
          const res = await axios.get(`/api/clinic/prenatal-schedule/${admission.user_id}`);
          const records = res.data || [];
          const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(v => v !== null && v !== undefined))).sort((a, b) => a - b);
          const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
          setCycleOptions(opts);
          setFormData(prev => ({ ...prev, pregnancy_cycle: opts.find(o => o.value === prev.pregnancy_cycle) ? prev.pregnancy_cycle : prev.pregnancy_cycle || '' }));
        } else {
          const name = String(admission.patient_name || admission.display_patient_name || '').trim();
          const contact = String(admission.contact_number || admission.display_contact_number || '').trim();
          if (!name || !contact) { setCycleOptions([]); return; }
          const res = await axios.get('/api/admin/walkin/prenatal', { params: { patient_name: name, contact_number: contact } });
          const records = res.data || [];
          const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(v => v !== null && v !== undefined))).sort((a, b) => a - b);
          const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
          setCycleOptions(opts);
          setFormData(prev => ({ ...prev, pregnancy_cycle: opts.find(o => o.value === prev.pregnancy_cycle) ? prev.pregnancy_cycle : prev.pregnancy_cycle || '' }));
        }
      } catch (e) {
        setCycleOptions([]);
      } finally {
        setLoadingCycles(false);
      }
    };
    loadCycles();
  }, [admission.patient_type, admission.user_id, admission.patient_name, admission.contact_number, admission.display_patient_name, admission.display_contact_number]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        // Convert empty strings to null for optional numeric fields
        baby_weight_kg: formData.baby_weight_kg ? parseFloat(formData.baby_weight_kg) : null,
        apgar1: formData.apgar1 ? parseInt(formData.apgar1) : null,
        apgar5: formData.apgar5 ? parseInt(formData.apgar5) : null
      };
      const baseNotes = parseNotesObj(admission.notes);
      submissionData.notes = JSON.stringify({ ...baseNotes, physical_exam: physicalExam });

      await axios.put(`/api/admin/admissions/${admission.id}`, submissionData);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update admission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Edit Admission #{admission.id}</h2>

      {/* Patient Info Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">
          <div><strong>Patient:</strong> {admission.display_patient_name || admission.patient_name}</div>
          <div><strong>Type:</strong> {admission.patient_type === 'registered' ? 'Registered Patient' : 'Walk-in Patient'}</div>
          <div><strong>Admitted:</strong> {admission.admitted_at && new Date(admission.admitted_at).toLocaleString()}</div>
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
                disabled={admission.patient_type === 'registered'}
              />
              {admission.patient_type === 'registered' && (
                <p className="text-xs text-gray-500 mt-1">Cannot edit registered patient name</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Number *</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="w-full p-2 border rounded"
                required
                disabled={admission.patient_type === 'registered'}
              />
              {admission.patient_type === 'registered' && (
                <p className="text-xs text-gray-500 mt-1">Cannot edit registered patient contact</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Room Assignment</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., Room 101, Ward A"
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

        {/* Admission Details */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Admission Details</h3>
          <div>
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
                <option value="Ongoing Care">Ongoing Care</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Baby Weight (kg)</label>
              <input
                type="number"
                step="0.01"
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

            <div>
              <label className="block text-sm font-medium mb-1">Disposition</label>
              <input
                type="text"
                value={formData.disposition}
                onChange={(e) => setFormData({ ...formData, disposition: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Patient disposition"
              />
            </div>
          </div>
        </div>

        {/* Physical Examination */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-800 mb-3">Physical Examination</h3>
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
      alert(error.response?.data?.error || 'Failed to discharge patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Discharge Patient</h2>
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p><strong>Patient:</strong> {admission.patient_name}</p>
        <p><strong>Admission ID:</strong> #{admission.id}</p>
        <p><strong>Room:</strong> {admission.room || 'Not assigned'}</p>
        <p><strong>Admitted:</strong> {admission.admitted_at && new Date(admission.admitted_at).toLocaleString()}</p>
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

// Edit Patient Info Modal for Registered Patients
const EditPatientInfoModal = ({ profile, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    middle_name: profile.middle_name || '',
    last_name: profile.last_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    age: profile.age || '',
    gender: profile.gender || 'female',
    blood_type: profile.blood_type || '',
    address: profile.address || '',
    civil_status: profile.civil_status || '',
    religion: profile.religion || '',
    occupation: profile.occupation || '',
    place_of_birth: profile.place_of_birth || '',
    date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : '',
    emergency_contact_name: profile.emergency_contact_name || '',
    emergency_contact_phone: profile.emergency_contact_phone || '',
    emergency_contact_relationship: profile.emergency_contact_relationship || '',
    allergies: profile.allergies || '',
    notes: profile.notes || ''
    , partner_name: profile.partner_name || ''
    , partner_age: profile.partner_age || ''
    , partner_occupation: profile.partner_occupation || ''
    , partner_religion: profile.partner_religion || ''
    , lmp: profile.lmp ? new Date(profile.lmp).toISOString().split('T')[0] : ''
    , edd: profile.edd ? new Date(profile.edd).toISOString().split('T')[0] : ''
    , gravida: profile.gravida || ''
    , para: profile.para || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(`/api/admin/patients/${profile.id}`, formData);

      if (response.data) {
        alert('Patient information updated successfully!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Error updating patient information: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Patient Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Middle Name</label>
            <input
              type="text"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
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
              <option value="">Unknown</option>
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

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="2"
            placeholder="Complete address"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Place of Birth</label>
            <input
              type="text"
              value={formData.place_of_birth}
              onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., N.B. Segoroyne Lying-in Clinic"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Obstetric History</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">LMP</label>
              <input
                type="date"
                value={formData.lmp}
                onChange={(e) => setFormData({ ...formData, lmp: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">EDD</label>
              <input
                type="date"
                value={formData.edd}
                onChange={(e) => setFormData({ ...formData, edd: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gravida</label>
              <input
                type="number"
                value={formData.gravida}
                onChange={(e) => setFormData({ ...formData, gravida: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Para</label>
              <input
                type="number"
                value={formData.para}
                onChange={(e) => setFormData({ ...formData, para: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Spouse/Partner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name of Spouse</label>
              <input
                type="text"
                value={formData.partner_name}
                onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Spouse full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                value={formData.partner_age}
                onChange={(e) => setFormData({ ...formData, partner_age: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Occupation</label>
              <input
                type="text"
                value={formData.partner_occupation}
                onChange={(e) => setFormData({ ...formData, partner_occupation: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Religion</label>
              <input
                type="text"
                value={formData.partner_religion}
                onChange={(e) => setFormData({ ...formData, partner_religion: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Name</label>
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Emergency contact name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Emergency contact phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relationship</label>
              <input
                type="text"
                value={formData.emergency_contact_relationship}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>
          </div>
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
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows="2"
            placeholder="Additional notes about the patient"
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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Patient Info'}
          </button>
        </div>
      </form>
    </div>
  );
};

// View Prenatal Modal (registered patient)
const ViewPrenatalModal = ({ visit, onClose }) => {
  if (!visit) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Prenatal Visit Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="font-medium"><span className="text-sm text-gray-600">Visit Number:</span> {visit.visit_number ?? 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Trimester:</span> {visit.trimester ?? 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Scheduled Date:</span> {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleDateString() : 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Gestational Age:</span> {visit.gestational_age || 'N/A'}</div>
        <div className="md:col-span-2 font-medium"><span className="text-sm text-gray-600">Status:</span> {visit.status || 'scheduled'}</div>
        {(visit.blood_pressure || visit.weight_kg || visit.fundal_height_cm || visit.fetal_heart_rate || visit.temperature_c || visit.maternal_heart_rate || visit.respiratory_rate) && (
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600">Vital Signs</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              {visit.blood_pressure && (
                <div className="font-medium"><span className="text-sm text-gray-600">Blood Pressure:</span> {visit.blood_pressure}</div>
              )}
              {visit.weight_kg && (
                <div className="font-medium"><span className="text-sm text-gray-600">Weight (kg):</span> {visit.weight_kg}</div>
              )}
              {visit.fundal_height_cm && (
                <div className="font-medium"><span className="text-sm text-gray-600">Fundal Height (cm):</span> {visit.fundal_height_cm}</div>
              )}
              {visit.fetal_heart_rate && (
                <div className="font-medium"><span className="text-sm text-gray-600">Fetal Heart Rate (bpm):</span> {visit.fetal_heart_rate}</div>
              )}
              {typeof visit.temperature_c !== 'undefined' && visit.temperature_c !== '' && (
                <div className="font-medium"><span className="text-sm text-gray-600">Temperature (°C):</span> {visit.temperature_c}</div>
              )}
              {visit.maternal_heart_rate && (
                <div className="font-medium"><span className="text-sm text-gray-600">Maternal Heart Rate (bpm):</span> {visit.maternal_heart_rate}</div>
              )}
              {visit.respiratory_rate && (
                <div className="font-medium"><span className="text-sm text-gray-600">Respiratory Rate (breaths/min):</span> {visit.respiratory_rate}</div>
              )}
            </div>
          </div>
        )}
        <div className="md:col-span-2 font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {visit.notes || 'None'}</div>
      </div>
    </div>
  );
};

// Edit Prenatal Modal (save disabled until backend supports PUT)
const EditPrenatalModal = ({ visit, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    visit_number: visit?.visit_number || '',
    trimester: visit?.trimester || '1',
    scheduled_date: visit?.scheduled_date ? new Date(visit.scheduled_date).toISOString().split('T')[0] : '',
    gestational_age: visit?.gestational_age || '',
    pregnancy_id: visit?.pregnancy_id || '',
    weight_kg: visit?.weight_kg || '',
    blood_pressure: visit?.blood_pressure || '',
    fundal_height_cm: visit?.fundal_height_cm || '',
    fetal_heart_rate: visit?.fetal_heart_rate || '',
    temperature_c: visit?.temperature_c || '',
    maternal_heart_rate: visit?.maternal_heart_rate || '',
    respiratory_rate: visit?.respiratory_rate || '',
    status: visit?.status || 'scheduled',
    notes: visit?.notes || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/api/clinic/prenatal-schedule/${visit.id}`, {
        ...formData,
        pregnancy_id: formData.pregnancy_id === '' ? null : Number(formData.pregnancy_id)
      });
      if (typeof onSuccess === 'function') onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update prenatal visit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Prenatal Visit</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700">Visit Number</label>
          <input name="visit_number" value={formData.visit_number} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Trimester</label>
          <select name="trimester" value={formData.trimester} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
            <option value="1">First</option>
            <option value="2">Second</option>
            <option value="3">Third</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Scheduled Date</label>
          <input type="date" name="scheduled_date" value={formData.scheduled_date} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Gestational Age</label>
          <input name="gestational_age" value={formData.gestational_age} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Pangilang Anak (Child Number)</label>
          <input type="number" name="pregnancy_id" value={formData.pregnancy_id} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Weight (kg)</label>
          <input type="number" step="0.1" name="weight_kg" value={formData.weight_kg} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Blood Pressure</label>
          <input name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Fundal Height (cm)</label>
          <input type="number" step="0.1" name="fundal_height_cm" value={formData.fundal_height_cm} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Fetal Heart Rate</label>
          <input type="number" name="fetal_heart_rate" value={formData.fetal_heart_rate} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Temperature (°C)</label>
          <input type="number" step="0.1" name="temperature_c" value={formData.temperature_c} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Maternal Heart Rate</label>
          <input type="number" name="maternal_heart_rate" value={formData.maternal_heart_rate} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Respiratory Rate</label>
          <input type="number" name="respiratory_rate" value={formData.respiratory_rate} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700">Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
        </div>
        <div className="flex justify-end mt-6 gap-2 md:col-span-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

// ViewBabyModal is now imported from ./modals/BabyViewModal

// Edit Baby Modal (save disabled until backend supports PUT)
const EditBabyModal = ({ baby, onClose /*, onSuccess*/ }) => {
  const [formData, setFormData] = useState({
    first_name: baby?.first_name || '',
    middle_name: baby?.middle_name || '',
    last_name: baby?.last_name || '',
    birth_date: baby?.birth_date ? new Date(baby.birth_date).toISOString().split('T')[0] : '',
    birth_time: baby?.birth_time || '',
    gender: baby?.gender || 'male',
    birth_weight_kg: baby?.birth_weight_kg || '',
    birth_length_cm: baby?.birth_length_cm || '',
    head_circumference_cm: baby?.head_circumference_cm || '',
    apgar_1min: baby?.apgar_1min || '',
    apgar_5min: baby?.apgar_5min || '',
    blood_type: baby?.blood_type || '',
    complications: baby?.complications || '',
    status: baby?.status || 'active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Baby Record</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700">First Name</label>
            <input name="first_name" value={formData.first_name} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Middle Name</label>
            <input name="middle_name" value={formData.middle_name} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Last Name</label>
            <input name="last_name" value={formData.last_name} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Birth Date</label>
            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Birth Time</label>
            <input type="time" name="birth_time" value={formData.birth_time} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Weight (kg)</label>
            <input type="number" step="0.01" name="birth_weight_kg" value={formData.birth_weight_kg} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Length (cm)</label>
            <input type="number" step="0.1" name="birth_length_cm" value={formData.birth_length_cm} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Head Circumference (cm)</label>
            <input type="number" step="0.1" name="head_circumference_cm" value={formData.head_circumference_cm} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700">APGAR 1 min</label>
            <input type="number" min="0" max="10" name="apgar_1min" value={formData.apgar_1min} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">APGAR 5 min</label>
            <input type="number" min="0" max="10" name="apgar_5min" value={formData.apgar_5min} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Blood Type</label>
            <select name="blood_type" value={formData.blood_type} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="">Unknown</option>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Complications / Notes</label>
            <input name="complications" value={formData.complications} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        <button disabled className="px-4 py-2 bg-yellow-400 text-white rounded opacity-60 cursor-not-allowed" title="Editing not supported yet">Save Changes</button>
      </div>
    </div>
  );
};

// View Lab Result Modal (registered patient)
const ViewLabResultModal = ({ result, onClose, onPrint }) => {
  if (!result) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lab Result Details</h2>
        <div className="flex items-center gap-2">
          {onPrint && (
            <button onClick={onPrint} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Print PDF</button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Test Date:</span> {result.test_date ? new Date(result.test_date).toLocaleDateString() : 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Test Name:</span> {result.test_name || result.test_type || 'N/A'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Category:</span> <span className="capitalize">{result.test_category || 'N/A'}</span></div>
          <div className="font-medium"><span className="text-sm text-gray-600">Result:</span> {result.result_value ? `${result.result_value} ${result.unit || ''}` : 'N/A'}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Reference Range:</span> {result.reference_range || 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> <span className={`px-2 py-1 rounded text-xs ${result.status === 'critical' ? 'bg-red-100 text-red-800' :
            result.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
              result.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
            }`}>{result.status || 'N/A'}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Lab Name:</span> {result.lab_name || 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Ordered By:</span> {result.ordered_by || 'N/A'}</div>
        </div>
        <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {result.notes || 'None'}</div>
      </div>
    </div>
  );
};

// Edit Lab Result Modal (save disabled until backend supports PUT)
const EditLabResultModal = ({ result, onClose /*, onSuccess*/ }) => {
  const [formData, setFormData] = useState({
    test_name: result?.test_name || '',
    test_category: result?.test_category || 'blood',
    test_date: result?.test_date ? new Date(result.test_date).toISOString().split('T')[0] : '',
    result_value: result?.result_value || '',
    reference_range: result?.reference_range || '',
    unit: result?.unit || '',
    status: result?.status || 'completed',
    lab_name: result?.lab_name || '',
    ordered_by: result?.ordered_by || '',
    notes: result?.notes || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Lab Result</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Test Name</label>
            <input name="test_name" value={formData.test_name} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Category</label>
            <select name="test_category" value={formData.test_category} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="blood">Blood Test</option>
              <option value="urine">Urine Test</option>
              <option value="cervical_screening">Cervical Screening</option>
              <option value="pregnancy">Pregnancy Test</option>
              <option value="ultrasound">Ultrasound</option>
              <option value="imaging">Imaging</option>
              <option value="screening">General Screening</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Test Date</label>
            <input type="date" name="test_date" value={formData.test_date} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Result Value</label>
            <input name="result_value" value={formData.result_value} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Reference Range</label>
            <input name="reference_range" value={formData.reference_range} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Unit</label>
            <input name="unit" value={formData.unit} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="completed">Completed</option>
              <option value="abnormal">Abnormal</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Lab Name</label>
            <input name="lab_name" value={formData.lab_name} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Ordered By</label>
            <input name="ordered_by" value={formData.ordered_by} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        <button disabled className="px-4 py-2 bg-yellow-400 text-white rounded opacity-60 cursor-not-allowed" title="Editing not supported yet">Save Changes</button>
      </div>
    </div>
  );
};


// Edit Procedure Modal (save disabled until backend supports PUT)
const EditProcedureModal = ({ procedure, onClose /*, onSuccess*/ }) => {
  const [formData, setFormData] = useState({
    procedure_type: procedure?.procedure_type || '',
    date_performed: procedure?.date_performed ? new Date(procedure.date_performed).toISOString().split('T')[0] : '',
    status: procedure?.status || 'Scheduled',
    healthcare_provider: procedure?.healthcare_provider || '',
    location: procedure?.location || '',
    duration_minutes: procedure?.duration_minutes || '',
    anesthesia_type: procedure?.anesthesia_type || '',
    complications: procedure?.complications || '',
    outcome: procedure?.outcome || '',
    follow_up_required: !!procedure?.follow_up_required,
    next_appointment: procedure?.next_appointment ? new Date(procedure.next_appointment).toISOString().split('T')[0] : '',
    notes: procedure?.notes || '',
    cost: procedure?.cost || '',
    insurance_covered: !!procedure?.insurance_covered
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Procedure</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Procedure Type</label>
            <input name="procedure_type" value={formData.procedure_type} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Date Performed</label>
            <input type="date" name="date_performed" value={formData.date_performed} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Healthcare Provider</label>
            <input name="healthcare_provider" value={formData.healthcare_provider} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Location</label>
            <input name="location" value={formData.location} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Duration (minutes)</label>
            <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Anesthesia Type</label>
            <input name="anesthesia_type" value={formData.anesthesia_type} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700">Complications</label>
            <textarea name="complications" value={formData.complications} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={2} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Outcome</label>
            <input name="outcome" value={formData.outcome} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Follow-up Required</label>
            <input type="checkbox" name="follow_up_required" checked={formData.follow_up_required} onChange={handleChange} className="ml-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Next Appointment</label>
            <input type="date" name="next_appointment" value={formData.next_appointment} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Cost</label>
            <input type="number" name="cost" value={formData.cost} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Insurance Covered</label>
            <input type="checkbox" name="insurance_covered" checked={formData.insurance_covered} onChange={handleChange} className="ml-2" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        <button disabled className="px-4 py-2 bg-yellow-400 text-white rounded opacity-60 cursor-not-allowed" title="Editing not supported yet">Save Changes</button>
      </div>
    </div>
  );
};

const ViewPostpartumModal = ({ postpartum, onClose, onPrint }) => {
  if (!postpartum) return null;
  const yesNo = (v) => (v === 1 || v === '1' || v === true ? 'Yes' : v === 0 || v === '0' || v === false ? 'No' : 'N/A');
  const formatDate = (d) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Postpartum Assessment Details</h2>
        <div className="flex items-center gap-2">
          {onPrint && (<button className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700" onClick={onPrint}>Print</button>)}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="font-medium"><span className="text-sm text-gray-600">Pregnancy Cycle:</span> {postpartum.pregnancy_id ?? 'Unassigned'}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Day Postpartum:</span> {postpartum.day_postpartum ?? 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Assessment Date:</span> {formatDate(postpartum.assessment_date)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Breastfeeding:</span> {(postpartum.breastfeeding_status || '').toString().toLowerCase() === 'yes' ? 'Yes' : ((postpartum.breastfeeding_status || '').toString().toLowerCase() === 'no' ? 'No' : (postpartum.breastfeeding_status || 'N/A'))}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Fever:</span> {yesNo(postpartum.fever)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Vaginal Bleeding:</span> {yesNo(postpartum.vaginal_bleeding)}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Foul Smelling Vaginal Discharge:</span> {yesNo(postpartum.foul_smell_discharge)}</div>
        </div>
        <div className="font-medium"><span className="text-sm text-gray-600">Family Planning To Be Used:</span> {postpartum.family_planning_method || 'N/A'}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Vitamin A Date:</span> {formatDate(postpartum.vitamin_a_date)}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Iron Supplement Date:</span> {formatDate(postpartum.iron_supplement_date)}</div>
        </div>
        <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {postpartum.notes || 'None'}</div>
      </div>
    </div>
  );
};

// Edit Postpartum Modal (save disabled until backend supports PUT)
const EditPostpartumModal = ({ postpartum, onClose /*, onSuccess*/ }) => {
  const [formData, setFormData] = useState({
    day_postpartum: postpartum?.day_postpartum || '',
    assessment_date: postpartum?.assessment_date ? new Date(postpartum.assessment_date).toISOString().split('T')[0] : '',
    blood_pressure: postpartum?.blood_pressure || '',
    temperature: postpartum?.temperature || '',
    pulse: postpartum?.pulse || '',
    fundal_height: postpartum?.fundal_height || '',
    lochia_type: postpartum?.lochia_type || 'rubra',
    lochia_amount: postpartum?.lochia_amount || 'moderate',
    perineum_condition: postpartum?.perineum_condition || 'healing',
    breasts_condition: postpartum?.breasts_condition || 'soft',
    breastfeeding_status: postpartum?.breastfeeding_status || 'exclusive',
    mood_assessment: postpartum?.mood_assessment || 'normal',
    voiding_normal: !!postpartum?.voiding_normal,
    bowel_movement_normal: !!postpartum?.bowel_movement_normal,
    notes: postpartum?.notes || ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Postpartum Assessment</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Day Postpartum</label>
            <input type="number" name="day_postpartum" value={formData.day_postpartum} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Assessment Date</label>
            <input type="date" name="assessment_date" value={formData.assessment_date} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Blood Pressure</label>
            <input name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Temperature (°C)</label>
            <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Pulse (bpm)</label>
            <input type="number" name="pulse" value={formData.pulse} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Lochia Type</label>
            <select name="lochia_type" value={formData.lochia_type} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="rubra">Rubra</option>
              <option value="serosa">Serosa</option>
              <option value="alba">Alba</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Lochia Amount</label>
            <select name="lochia_amount" value={formData.lochia_amount} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="scanty">Scanty</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Perineum Condition</label>
            <select name="perineum_condition" value={formData.perineum_condition} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="intact">Intact</option>
              <option value="healing">Healing</option>
              <option value="inflamed">Inflamed</option>
              <option value="infected">Infected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Breasts Condition</label>
            <select name="breasts_condition" value={formData.breasts_condition} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="soft">Soft</option>
              <option value="filling">Filling</option>
              <option value="engorged">Engorged</option>
              <option value="mastitis">Mastitis</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Breastfeeding Status</label>
            <select name="breastfeeding_status" value={formData.breastfeeding_status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="exclusive">Exclusive</option>
              <option value="mixed">Mixed</option>
              <option value="not_breastfeeding">Not Breastfeeding</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Mood Assessment</label>
            <select name="mood_assessment" value={formData.mood_assessment} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="normal">Normal</option>
              <option value="anxious">Anxious</option>
              <option value="depressed">Depressed</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Voiding Normal</label>
            <input type="checkbox" name="voiding_normal" checked={formData.voiding_normal} onChange={handleChange} className="ml-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Bowel Movement Normal</label>
            <input type="checkbox" name="bowel_movement_normal" checked={formData.bowel_movement_normal} onChange={handleChange} className="ml-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        <button disabled className="px-4 py-2 bg-yellow-400 text-white rounded opacity-60 cursor-not-allowed" title="Editing not supported yet">Save Changes</button>
      </div>
    </div>
  );
};

export default PatientRecordEnhanced;
const AddReferralModal = ({ patientId, onClose, onSuccess }) => {
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
      await axios.post('/api/clinic/referrals', payload);
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
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Add Referral'}</button>
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
      const payload = {
        return_to: formData.return_to || null,
        return_datetime: formData.return_datetime ? new Date(formData.return_datetime).toISOString().slice(0, 19).replace('T', ' ') : null,
        diagnosis: formData.diagnosis || null,
        actions_taken: formData.actions_taken || null,
        recommendations: formData.recommendations || null,
        signed_by: formData.signed_by || null,
        notes: formData.notes || null
      };
      await axios.post(`/api/clinic/referrals/${referral.id}/return`, payload);
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

const AddMedicationAdminModal = ({ patientId, admissions = [], prefillAdmissionId, onClose, onSuccess }) => {
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
      const payload = {
        patient_id: patientId,
        admission_id: admissionId || null,
        administration_date: adminDate,
        entries
      };
      await axios.post('/api/clinic/medication-administration', payload);
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
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Add Administration'}</button>
        </div>
      </form>
    </div>
  );
};
