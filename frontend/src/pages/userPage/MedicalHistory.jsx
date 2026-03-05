import React, { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaDownload, FaFilePdf, FaCalendarAlt, FaUserMd, FaStethoscope, FaThermometerHalf, FaWeight, FaRuler, FaFlask, FaProcedures, FaClipboardCheck, FaSyringe, FaFile, FaBaby, FaFemale, FaUsers, FaBabyCarriage } from 'react-icons/fa';
import axios from 'axios';
import UserLayout from '../../components/UserLayout';
import { generateMedicalRecordHTML, generateSingleMedicalRecordHTML, generatePrenatalBookletHTML, downloadHTMLAsPDF } from '../../utils/simplePdfGenerator';
import { resolveLogoUrl } from '../../utils/logoUtils';

const MedicalHistory = () => {
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [immunizations, setImmunizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientData, setPatientData] = useState({});
  const [activeTab, setActiveTab] = useState('prenatal');
  const [prenatalRecords, setPrenatalRecords] = useState([]);
  const [postpartumRecords, setPostpartumRecords] = useState([]);
  const [familyPlanningRecords, setFamilyPlanningRecords] = useState([]);
  const [babyRecords, setBabyRecords] = useState([]);
  const [selectedCycleKey, setSelectedCycleKey] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        // Helper to avoid total failure if a single endpoint errors
        const safeGet = async (url, fallback) => {
          try {
            const resp = await axios.get(url, config);
            return resp;
          } catch (err) {
            if (import.meta.env.DEV) console.error(`Failed GET ${url}:`, err.response?.data || err.message);
            return { data: fallback };
          }
        };

        // Fetch all medical data in parallel with per-request fallback
        const [
          medicalResponse,
          labResponse,
          proceduresResponse,
          screeningsResponse,
          immunizationsResponse,
          patientResponse,
          prenatalResponse,
          postpartumResponse,
          familyPlanningResponse,
          babyResponse
        ] = await Promise.all([
          safeGet('/api/users/my-medical-history', []),
          safeGet('/api/users/my-lab-results', []),
          safeGet('/api/users/my-procedures', []),
          safeGet('/api/users/my-screenings', []),
          safeGet('/api/users/my-immunizations', []),
          safeGet('/api/users/patient-profile', {}),
          safeGet('/api/users/my-prenatal-records', []),
          safeGet('/api/users/my-postpartum-records', []),
          safeGet('/api/users/my-family-planning-records', []),
          safeGet('/api/users/my-baby-records', [])
        ]);

        setMedicalHistory(medicalResponse.data || []);
        setLabResults(labResponse.data || []);
        setProcedures(proceduresResponse.data || []);
        setScreenings(screeningsResponse.data || []);
        setImmunizations(immunizationsResponse.data || []);
        setPatientData(patientResponse.data || {});
        setPrenatalRecords(prenatalResponse.data || []);
        setPostpartumRecords(postpartumResponse.data || []);
        setFamilyPlanningRecords(familyPlanningResponse.data || []);
        setBabyRecords(babyResponse.data || []);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Unexpected error in fetching medical data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const handleExportPDF = async () => {
    if (medicalHistory.length === 0) {
      alert('No medical records to export');
      return;
    }

    try {
      const logoUrl = await resolveLogoUrl();
      const html = generateMedicalRecordHTML(patientData, medicalHistory, logoUrl);
      downloadHTMLAsPDF(html, `Medical_Records_${patientData.name || 'Patient'}_${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating PDF:', error);
      alert('Error generating PDF report');
    }
  };

  const handleSingleRecordPDF = async (record) => {
    try {
      const logoUrl = await resolveLogoUrl();
      const html = generateSingleMedicalRecordHTML(patientData, record, logoUrl);
      const dateCandidates = [
        record.appointment_date,
        record.test_date,
        record.screening_date,
        record.date_given,
        record.date_performed,
        record.next_appointment,
        record.follow_up_date
      ];
      let recordDate = '';
      for (const d of dateCandidates) {
        if (!d) continue;
        const dt = new Date(d);
        if (!Number.isNaN(dt.getTime())) {
          recordDate = dt.toISOString().split('T')[0];
          break;
        }
      }
      if (!recordDate) {
        recordDate = new Date().toISOString().split('T')[0];
      }
      downloadHTMLAsPDF(html, `Medical_Record_${patientData.name || 'Patient'}_${recordDate}`);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating single record PDF:', error);
      alert('Error generating PDF report');
    }
  };

  const handlePrintPrenatalBooklet = async () => {
    try {
      const logoUrl = await resolveLogoUrl();
      const name = [patientData.first_name, patientData.middle_name, patientData.last_name].filter(Boolean).join(' ') || (patientData.name || 'Patient');
      const pData = {
        name,
        phone: patientData.phone || '',
        lmp: patientData.lmp || patientData.vitals?.lmp || null,
        edd: patientData.edd || patientData.vitals?.edd || null
      };
      const html = generatePrenatalBookletHTML(pData, prenatalRecords || [], logoUrl);
      downloadHTMLAsPDF(html, `Prenatal_Booklet_${name}`);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating prenatal booklet PDF:', error);
      alert('Error generating prenatal booklet');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // Null/undefined/empty guard
    if (!timeString || typeof timeString !== 'string' || !timeString.trim()) {
      return '--';
    }

    const s = timeString.trim();

    // Case 1: simple HH:mm or HH:mm:ss
    const timeOnly = s.match(/^([0-1]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
    if (timeOnly) {
      const hour = parseInt(timeOnly[1], 10);
      const minutes = timeOnly[2];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }

    // Case 2: range like "8:00-8:30AM" or "08:00-08:30"; pick the start part
    const startPart = s.split('-')[0]?.trim() || s;
    const hm = startPart.match(/^([0-1]?\d|2[0-3]):([0-5]\d)/);
    if (hm) {
      const hour = parseInt(hm[1], 10);
      const minutes = hm[2];
      const isPM = /PM$/i.test(s);
      const isAM = /AM$/i.test(s);
      const ampm = isAM ? 'AM' : isPM ? 'PM' : (hour >= 12 ? 'PM' : 'AM');
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }

    // Fallback: return string as-is
    return s;
  };

  

  const filteredLabResults = labResults.filter(result =>
    result.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.result?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProcedures = procedures.filter(procedure =>
    procedure.procedure_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    procedure.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    procedure.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScreenings = screenings.filter(screening =>
    screening.screening_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    screening.result?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    screening.recommendations?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredImmunizations = immunizations.filter(immunization =>
    immunization.vaccine_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    immunization.healthcare_provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    immunization.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cycleOptions = React.useMemo(() => {
    const groups = new Map();
    (babyRecords || []).forEach((b) => {
      const adm = b.admission_id || null;
      const key = adm ? `adm:${adm}` : `baby:${b.id}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          admissionId: adm,
          pivotDate: b.birth_date
        });
      }
    });
    const arr = Array.from(groups.values()).sort((a, b) => new Date(b.pivotDate) - new Date(a.pivotDate));
    return arr.map((c, idx) => {
      const dateLabel = c.pivotDate ? new Date(c.pivotDate).toLocaleDateString() : '';
      const admLabel = c.admissionId ? ` (Admission ${c.admissionId})` : '';
      const extra = dateLabel ? ` - ${dateLabel}${admLabel}` : admLabel;
      return { ...c, label: `Cycle ${idx + 1}${extra}` };
    });
  }, [babyRecords]);

  const selectedCycle = React.useMemo(() => {
    if (!selectedCycleKey) return null;
    return cycleOptions.find((c) => c.key === selectedCycleKey) || null;
  }, [selectedCycleKey, cycleOptions]);

  const getCycleIndexForDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return null;
    for (let i = 0; i < cycleOptions.length; i++) {
      const p = cycleOptions[i].pivotDate ? new Date(cycleOptions[i].pivotDate) : null;
      if (p && !Number.isNaN(p.getTime()) && d <= p) return i + 1;
    }
    const delivered = Number(patientData?.para) || cycleOptions.length || 0;
    return delivered + 1;
  };

  const ordinalWord = (n) => {
    if (!n || n < 1) return '';
    if (n === 1) return 'First';
    if (n === 2) return 'Second';
    if (n === 3) return 'Third';
    if (n === 4) return 'Fourth';
    if (n === 5) return 'Fifth';
    if (n === 6) return 'Sixth';
    if (n === 7) return 'Seventh';
    if (n === 8) return 'Eighth';
    if (n === 9) return 'Ninth';
    if (n === 10) return 'Tenth';
    return `${n}th`;
  };

  const filteredPrenatal = prenatalRecords
    .filter(record =>
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.gestational_age?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(record => {
      if (!selectedCycle) return true;
      const d = record.scheduled_date || record.appointment_date;
      if (!d) return false;
      return new Date(d) <= new Date(selectedCycle.pivotDate);
    });

  const filteredPostpartum = postpartumRecords
    .filter(record =>
      record.assessment_date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(record => {
      if (!selectedCycle) return true;
      if (selectedCycle.admissionId) {
        return String(record.admission_id || '') === String(selectedCycle.admissionId);
      }
      const d = record.assessment_date;
      if (!d) return false;
      return new Date(d) >= new Date(selectedCycle.pivotDate);
    });

  const filteredFamilyPlanning = familyPlanningRecords.filter(record =>
    record.method_chosen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBaby = babyRecords.filter((record) => {
    const term = (searchTerm || '').toLowerCase();
    if (!term) return true; // show all when search is empty

    const toLower = (v) => (v === null || v === undefined) ? '' : String(v).toLowerCase();

    // Build baby full name from available fields
    const name = toLower([record.first_name, record.middle_name, record.last_name]
      .filter(Boolean)
      .join(' '));

    // Match against name and common baby/vitals fields
    const matchesName = name.includes(term);
    const matchesFeeding = toLower(record.feeding_type).includes(term);
    const matchesGender = toLower(record.gender).includes(term);
    const matchesBlood = toLower(record.blood_type).includes(term);
    const matchesComplications = toLower(record.complications).includes(term);

    const textMatch = (
      matchesName ||
      matchesFeeding ||
      matchesGender ||
      matchesBlood ||
      matchesComplications
    );
    return textMatch;
  });

  const filteredBabyByCycle = filteredBaby.filter((record) => {
    if (!selectedCycle) return true;
    if (selectedCycle.admissionId) {
      return String(record.admission_id || '') === String(selectedCycle.admissionId);
    }
    return String(record.id) === String(selectedCycle.key.split(':')[1]);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading medical history...</div>
      </div>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center">
              <FaStethoscope className="text-blue-600 text-2xl mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Medical Records</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="flex gap-3 items-stretch">
                <div className="w-full sm:w-64">
                  <select
                    value={selectedCycleKey}
                    onChange={(e) => setSelectedCycleKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All cycles</option>
                    {cycleOptions.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setSelectedCycleKey('')}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                  title="Clear cycle filter"
                >
                  Clear
                </button>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={medicalHistory.length === 0}
                className="flex justify-center items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Export records as PDF"
              >
                <FaFilePdf />
                <span className="whitespace-nowrap">Print PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
            
            <button
              onClick={() => setActiveTab('lab-results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lab-results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaFlask className="inline mr-2" />
              Lab Results
            </button>
            <button
              onClick={() => setActiveTab('procedures')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'procedures'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaProcedures className="inline mr-2" />
              Procedures
            </button>
            <button
              onClick={() => setActiveTab('screenings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'screenings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaClipboardCheck className="inline mr-2" />
              Screenings
            </button>
            <button
              onClick={() => setActiveTab('immunizations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'immunizations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaSyringe className="inline mr-2" />
              Immunizations
            </button>
            <button
              onClick={() => setActiveTab('prenatal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prenatal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaBabyCarriage className="inline mr-2" />
              Prenatal
            </button>
            <button
              onClick={() => setActiveTab('postpartum')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'postpartum'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaFemale className="inline mr-2" />
              Postpartum
            </button>
            <button
              onClick={() => setActiveTab('family-planning')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'family-planning'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaUsers className="inline mr-2" />
              Family Planning
            </button>
            <button
              onClick={() => setActiveTab('baby-records')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'baby-records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaBaby className="inline mr-2" />
              Baby Records
            </button>
          </nav>
        </div>

        <div className="p-6">
          
          
          {activeTab === 'lab-results' && (
             filteredLabResults.length === 0 ? (
               <div className="text-center py-12">
                 <FaFlask className="mx-auto text-gray-400 text-5xl mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   {labResults.length === 0 ? 'No Lab Results Yet' : 'No Results Found'}
                 </h3>
                 <p className="text-gray-500">
                   {labResults.length === 0 
                     ? 'Your lab results will appear here after tests are completed.'
                     : 'Try adjusting your search criteria to find specific results.'
                   }
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 {filteredLabResults.map((result) => (
                   <div key={result.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                     <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                       <div className="flex-1">
                         <div className="flex items-center mb-3">
                           <FaCalendarAlt className="text-blue-600 mr-2" />
                           <span className="text-base sm:text-lg font-semibold text-gray-900">
                             {formatDate(result.appointment_date)}
                           </span>
                           <span className="ml-2 text-sm text-gray-500">
                             at {formatTime(result.time_slot)}
                           </span>
                           <span className="ml-2 sm:ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             {result.service_type}
                           </span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                           <div>
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Test Name</h4>
                             <p className="text-gray-900 text-sm font-medium leading-relaxed">{result.test_name}</p>
                           </div>

                           <div>
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Result</h4>
                             <p className="text-gray-900 text-sm font-medium leading-relaxed">{result.result}</p>
                           </div>

                           {result.reference_range && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Reference Range</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{result.reference_range}</p>
                             </div>
                           )}

                           {result.status && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Status</h4>
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                 result.status === 'Normal' ? 'bg-green-100 text-green-800' :
                                 result.status === 'Abnormal' ? 'bg-red-100 text-red-800' :
                                 'bg-yellow-100 text-yellow-800'
                               }`}>
                                 {result.status}
                               </span>
                             </div>
                           )}
                         </div>

                         {result.notes && (
                           <div className="mb-4">
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Notes</h4>
                             <p className="text-gray-900 text-sm font-medium bg-gray-50 p-3 rounded-lg leading-relaxed">
                               {result.notes}
                             </p>
                           </div>
                         )}
                       </div>

                       <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                         <button
                           onClick={() => { setSelectedRecord(result); setShowDetailsModal(true); }}
                           className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                         >
                           View Full Details
                         </button>
                         <button
                           onClick={() => handleSingleRecordPDF(result)}
                           className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                           title="Print lab result PDF"
                         >
                           <FaFilePdf className="text-xs" />
                           Print PDF
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )
           )}
          
          {activeTab === 'procedures' && (
             filteredProcedures.length === 0 ? (
               <div className="text-center py-12">
                 <FaProcedures className="mx-auto text-gray-400 text-5xl mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   {procedures.length === 0 ? 'No Procedures Yet' : 'No Procedures Found'}
                 </h3>
                 <p className="text-gray-500">
                   {procedures.length === 0 
                     ? 'Your procedure history will appear here after procedures are completed.'
                     : 'Try adjusting your search criteria to find specific procedures.'
                   }
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 {filteredProcedures.map((procedure) => (
                   <div key={procedure.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                     <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                       <div className="flex-1">
                         <div className="flex items-center mb-3">
                           <FaCalendarAlt className="text-blue-600 mr-2" />
                           <span className="text-base sm:text-lg font-semibold text-gray-900">
                             {formatDate(procedure.appointment_date)}
                           </span>
                           <span className="ml-2 text-sm text-gray-500">
                             at {formatTime(procedure.time_slot)}
                           </span>
                           <span className="ml-2 sm:ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                             {procedure.service_type}
                           </span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                           <div>
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Procedure Name</h4>
                             <p className="text-gray-900 text-sm font-medium leading-relaxed">{procedure.procedure_name}</p>
                           </div>

                           {procedure.description && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Description</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{procedure.description}</p>
                             </div>
                           )}

                           {procedure.outcome && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Outcome</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{procedure.outcome}</p>
                             </div>
                           )}

                           {procedure.complications && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Complications</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{procedure.complications}</p>
                             </div>
                           )}
                         </div>

                         {procedure.notes && (
                           <div className="mb-4">
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Notes</h4>
                             <p className="text-gray-900 text-sm font-medium bg-gray-50 p-3 rounded-lg leading-relaxed">
                               {procedure.notes}
                             </p>
                           </div>
                         )}
                       </div>

                       <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                         <button
                           onClick={() => { setSelectedRecord(procedure); setShowDetailsModal(true); }}
                           className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                         >
                           View Full Details
                         </button>
                         <button
                           onClick={() => handleSingleRecordPDF(procedure)}
                           className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                           title="Print procedure record PDF"
                         >
                           <FaFilePdf className="text-xs" />
                           Print PDF
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )
           )}
          
          {activeTab === 'screenings' && (
             filteredScreenings.length === 0 ? (
               <div className="text-center py-12">
                 <FaSearch className="mx-auto text-gray-400 text-5xl mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   {screenings.length === 0 ? 'No Screenings Yet' : 'No Screenings Found'}
                 </h3>
                 <p className="text-gray-500">
                   {screenings.length === 0 
                     ? 'Your screening history will appear here after screenings are completed.'
                     : 'Try adjusting your search criteria to find specific screenings.'
                   }
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 {filteredScreenings.map((screening) => (
                   <div key={screening.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                     <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                       <div className="flex-1">
                         <div className="flex items-center mb-3">
                           <FaCalendarAlt className="text-blue-600 mr-2" />
                           <span className="text-base sm:text-lg font-semibold text-gray-900">
                             {formatDate(screening.appointment_date)}
                           </span>
                           <span className="ml-2 text-sm text-gray-500">
                             at {formatTime(screening.time_slot)}
                           </span>
                           <span className="ml-2 sm:ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             {screening.service_type}
                           </span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                           <div>
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Screening Type</h4>
                             <p className="text-gray-900 text-sm font-medium leading-relaxed">{screening.screening_type}</p>
                           </div>

                           {screening.result && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Result</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{screening.result}</p>
                             </div>
                           )}

                           {screening.risk_level && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Risk Level</h4>
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                 screening.risk_level.toLowerCase() === 'low' ? 'bg-green-100 text-green-800' :
                                 screening.risk_level.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                 screening.risk_level.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                                 'bg-gray-100 text-gray-800'
                               }`}>
                                 {screening.risk_level}
                               </span>
                             </div>
                           )}

                           {screening.next_screening_date && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Next Screening Due</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{formatDate(screening.next_screening_date)}</p>
                             </div>
                           )}
                         </div>

                         {screening.recommendations && (
                           <div className="mb-4">
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Recommendations</h4>
                             <p className="text-gray-900 text-sm font-medium bg-blue-50 p-3 rounded-lg leading-relaxed">
                               {screening.recommendations}
                             </p>
                           </div>
                         )}

                         {screening.notes && (
                           <div className="mb-4">
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Notes</h4>
                             <p className="text-gray-900 text-sm font-medium bg-gray-50 p-3 rounded-lg leading-relaxed">
                               {screening.notes}
                             </p>
                           </div>
                         )}
                       </div>

                       <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                         <button
                           onClick={() => { setSelectedRecord(screening); setShowDetailsModal(true); }}
                           className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                         >
                           View Full Details
                         </button>
                         <button
                           onClick={() => handleSingleRecordPDF(screening)}
                           className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                           title="Print screening record PDF"
                         >
                           <FaFilePdf className="text-xs" />
                           Print PDF
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )
           )}
          
          {activeTab === 'immunizations' && (
             filteredImmunizations.length === 0 ? (
               <div className="text-center py-12">
                 <FaSyringe className="mx-auto text-gray-400 text-5xl mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   {immunizations.length === 0 ? 'No Immunizations Yet' : 'No Immunizations Found'}
                 </h3>
                 <p className="text-gray-500">
                   {immunizations.length === 0 
                     ? 'Your immunization history will appear here after vaccinations are administered.'
                     : 'Try adjusting your search criteria to find specific immunizations.'
                   }
                 </p>
               </div>
             ) : (
               <div className="space-y-4">
                 {filteredImmunizations.map((immunization) => (
                   <div key={immunization.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                     <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                       <div className="flex-1">
                         <div className="flex items-center mb-3">
                           <FaCalendarAlt className="text-blue-600 mr-2" />
                           <span className="text-base sm:text-lg font-semibold text-gray-900">
                             {formatDate(immunization.appointment_date)}
                           </span>
                           <span className="ml-2 text-sm text-gray-500">
                             at {formatTime(immunization.time_slot)}
                           </span>
                           <span className="ml-2 sm:ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                             {immunization.service_type}
                           </span>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                           <div>
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Vaccine Name</h4>
                             <p className="text-gray-900 text-sm font-medium leading-relaxed">{immunization.vaccine_name}</p>
                           </div>

                           {immunization.dose_number && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Dose Number</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{immunization.dose_number}</p>
                             </div>
                           )}

                           {immunization.lot_number && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Lot Number</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{immunization.lot_number}</p>
                             </div>
                           )}

                           {immunization.manufacturer && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Manufacturer</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{immunization.manufacturer}</p>
                             </div>
                           )}

                           {immunization.site_given && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Site Given</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{immunization.site_given}</p>
                             </div>
                           )}

                           {immunization.next_dose_due && (
                             <div>
                               <h4 className="text-xs font-normal text-gray-600 mb-1">Next Dose Due</h4>
                               <p className="text-gray-900 text-sm font-medium leading-relaxed">{formatDate(immunization.next_dose_due)}</p>
                             </div>
                           )}
                         </div>

                         {immunization.reactions && (
                           <div className="mb-4">
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Reactions</h4>
                             <p className="text-gray-900 text-sm font-medium bg-yellow-50 p-3 rounded-lg leading-relaxed">
                               {immunization.reactions}
                             </p>
                           </div>
                         )}

                         {immunization.notes && (
                           <div className="mb-4">
                             <h4 className="text-xs font-normal text-gray-600 mb-1">Notes</h4>
                             <p className="text-gray-900 text-sm font-medium bg-gray-50 p-3 rounded-lg leading-relaxed">
                               {immunization.notes}
                             </p>
                           </div>
                         )}
                       </div>

                       <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                        <button
                          onClick={() => { setSelectedRecord(immunization); setShowDetailsModal(true); }}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Full Details
                        </button>
                        <button
                          onClick={() => handleSingleRecordPDF(immunization)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                          title="Print immunization record PDF"
                        >
                          <FaFilePdf className="text-xs" />
                          Print PDF
                        </button>
                      </div>
                     </div>
                   </div>
                 ))}
             </div>
           )
         )}

          {activeTab === 'prenatal' && (
            filteredPrenatal.length === 0 ? (
              <div className="text-center py-12">
                <FaBabyCarriage className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {prenatalRecords.length === 0 ? 'No Prenatal Records Yet' : 'No Records Found'}
                </h3>
                <p className="text-gray-500">
                  {prenatalRecords.length === 0
                    ? 'Your prenatal visits will appear here when scheduled or recorded.'
                    : 'Try adjusting your search criteria to find specific records.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-gray-600">{selectedCycle ? selectedCycle.label : 'All cycles'}</div>
                  <button
                    onClick={handlePrintPrenatalBooklet}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                    title="Print prenatal booklet PDF"
                  >
                    <FaFilePdf className="text-xs" />
                    Print Prenatal Booklet
                  </button>
                </div>
                {filteredPrenatal.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <FaCalendarAlt className="text-blue-600 mr-2" />
                          <span className="text-base sm:text-lg font-semibold text-gray-900">
                            {formatDate(record.appointment_date)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            at {formatTime(record.time_slot)}
                          </span>
                          <span className="ml-2 sm:ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {record.service_type}
                          </span>
                          {(() => {
                            const idx = getCycleIndexForDate(record.scheduled_date || record.appointment_date);
                            return idx ? (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {ordinalWord(idx)} child
                              </span>
                            ) : null;
                          })()}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          {record.gestational_age && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Gestational Age</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.gestational_age}</p>
                            </div>
                          )}
                          {record.next_visit_date && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Next Visit</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{formatDate(record.next_visit_date)}</p>
                            </div>
                          )}
                          {record.assessment && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Assessment</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.assessment}</p>
                            </div>
                          )}
                          {record.plan && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Plan</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.plan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                        <button
                          onClick={() => { setSelectedRecord(record); setShowDetailsModal(true); }}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Full Details
                        </button>
                        <button
                          onClick={() => handleSingleRecordPDF(record)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          title="Print prenatal record PDF"
                        >
                          <FaFilePdf className="text-xs" />
                          Print PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'postpartum' && (
            filteredPostpartum.length === 0 ? (
              <div className="text-center py-12">
                <FaFemale className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {postpartumRecords.length === 0 ? 'No Postpartum Records Yet' : 'No Records Found'}
                </h3>
                <p className="text-gray-500">
                  {postpartumRecords.length === 0
                    ? 'Your postpartum assessments will appear here when recorded.'
                    : 'Try adjusting your search criteria to find specific records.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between mb-2">
                  <div className="text-sm text-gray-600">{selectedCycle ? selectedCycle.label : 'All cycles'}</div>
                </div>
                {filteredPostpartum.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <FaCalendarAlt className="text-blue-600 mr-2" />
                          <span className="text-base sm:text-lg font-semibold text-gray-900">
                            {formatDate(record.appointment_date)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            at {formatTime(record.time_slot)}
                          </span>
                          <span className="ml-2 sm:ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            {record.service_type}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          {record.assessment_notes && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Assessment Notes</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.assessment_notes}</p>
                            </div>
                          )}
                          {record.recovery_status && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Recovery Status</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.recovery_status}</p>
                            </div>
                          )}
                          {record.follow_up_plan && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Follow-up Plan</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.follow_up_plan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                        <button
                          onClick={() => { setSelectedRecord(record); setShowDetailsModal(true); }}
                          className="px-3 sm:px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                        >
                          View Full Details
                        </button>
                        <button
                          onClick={() => handleSingleRecordPDF(record)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                          title="Print postpartum record PDF"
                        >
                          <FaFilePdf className="text-xs" />
                          Print PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'family-planning' && (
            filteredFamilyPlanning.length === 0 ? (
              <div className="text-center py-12">
                <FaUsers className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {familyPlanningRecords.length === 0 ? 'No Family Planning Records Yet' : 'No Records Found'}
                </h3>
                <p className="text-gray-500">
                  {familyPlanningRecords.length === 0
                    ? 'Your family planning records will appear here after consultations.'
                    : 'Try adjusting your search criteria to find specific records.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFamilyPlanning.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <FaCalendarAlt className="text-blue-600 mr-2" />
                          <span className="text-base sm:text-lg font-semibold text-gray-900">
                            {formatDate(record.appointment_date)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            at {formatTime(record.time_slot)}
                          </span>
                          <span className="ml-2 sm:ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            {record.service_type}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          {record.method_chosen && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Method Chosen</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.method_chosen}</p>
                            </div>
                          )}
                          {record.method_category && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Method Category</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.method_category}</p>
                            </div>
                          )}
                          {record.method_started_date && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Started Date</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{formatDate(record.method_started_date)}</p>
                            </div>
                          )}
                          {typeof record.counseling_done !== 'undefined' && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Counseling Done</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.counseling_done ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {record.counseling_done ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                          {record.follow_up_date && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Follow-up Date</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{formatDate(record.follow_up_date)}</p>
                            </div>
                          )}
                        </div>

                        {record.notes && (
                          <div className="mb-4">
                            <h4 className="text-xs font-normal text-gray-600 mb-1">Notes</h4>
                            <p className="text-gray-900 text-sm font-medium bg-gray-50 p-3 rounded-lg leading-relaxed">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                        <button
                          onClick={() => { setSelectedRecord(record); setShowDetailsModal(true); }}
                          className="px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                        >
                          View Full Details
                        </button>
                        <button
                          onClick={() => handleSingleRecordPDF(record)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                          title="Print family planning record PDF"
                        >
                          <FaFilePdf className="text-xs" />
                          Print PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'baby-records' && (
            filteredBabyByCycle.length === 0 ? (
              <div className="text-center py-12">
                <FaBaby className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {babyRecords.length === 0 ? 'No Baby Records Yet' : 'No Records Found'}
                </h3>
                <p className="text-gray-500">
                  {babyRecords.length === 0
                    ? 'Baby records linked to your profile will appear here.'
                    : 'Try adjusting your search criteria to find specific records.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBabyByCycle.map((record) => (
                  <div key={`${record.id}-${record.recorded_at || 'no-vitals'}`} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <FaCalendarAlt className="text-blue-600 mr-2" />
                          <span className="text-base sm:text-lg font-semibold text-gray-900">
                            {record.birth_date ? `Born ${formatDate(record.birth_date)}` : 'Birth date not set'}
                          </span>
                          {record.recorded_at && (
                            <span className="ml-2 text-sm text-gray-500">
                              vitals at {new Date(record.recorded_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          <div>
                            <h4 className="text-xs font-normal text-gray-600 mb-1">Baby Name</h4>
                            <p className="text-gray-900 text-sm font-medium leading-relaxed">
                              {[record.first_name, record.middle_name, record.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                            </p>
                          </div>
                          {typeof record.weight_kg !== 'undefined' && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Weight</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.weight_kg} kg</p>
                            </div>
                          )}
                          {typeof record.length_cm !== 'undefined' && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Length</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.length_cm} cm</p>
                            </div>
                          )}
                          {typeof record.head_circumference_cm !== 'undefined' && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Head Circumference</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.head_circumference_cm} cm</p>
                            </div>
                          )}
                          {record.feeding_type && (
                            <div>
                              <h4 className="text-xs font-normal text-gray-600 mb-1">Feeding Type</h4>
                              <p className="text-gray-900 text-sm font-medium leading-relaxed">{record.feeding_type}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:ml-4 flex flex-row md:flex-col gap-2">
                        <button
                          onClick={() => { setSelectedRecord(record); setShowDetailsModal(true); }}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          View Full Details
                        </button>
                        <button
                          onClick={() => handleSingleRecordPDF(record)}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          title="Print baby record PDF"
                        >
                          <FaFilePdf className="text-xs" />
                          Print PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Medical Record Details
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedRecord.appointment_date)} at {formatTime(selectedRecord.time_slot)}
                  <span className="ml-2 text-blue-600">• {selectedRecord.service_type}</span>
                  {(() => {
                    const isPrenatal = Boolean(selectedRecord.gestational_age) || String(selectedRecord.service_type || '').toLowerCase().includes('prenatal');
                    if (!isPrenatal) return null;
                    const idx = getCycleIndexForDate(selectedRecord.scheduled_date || selectedRecord.appointment_date);
                    return idx ? (
                      <span className="ml-2 text-yellow-700">• {ordinalWord(idx)} child</span>
                    ) : null;
                  })()}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Medical Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">Medical Information</h4>
                  
                  {selectedRecord.doctor_notes && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Doctor's Notes</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900 text-sm font-medium">{selectedRecord.doctor_notes}</p>
                      </div>
                    </div>
                  )}

                  {selectedRecord.diagnosis && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Diagnosis</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.diagnosis}</p>
                    </div>
                  )}

                  {selectedRecord.treatment_given && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Treatment Given</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900 text-sm font-medium">{selectedRecord.treatment_given}</p>
                      </div>
                    </div>
                  )}

                  {selectedRecord.recommendations && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Recommendations</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900 text-sm font-medium">{selectedRecord.recommendations}</p>
                      </div>
                    </div>
                  )}

                  {selectedRecord.next_appointment_suggestion && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Next Appointment Suggestion</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.next_appointment_suggestion}</p>
                    </div>
                  )}

                  {/* Lab Results */}
                  {selectedRecord.test_name && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Test Name</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.test_name}</p>
                    </div>
                  )}
                  {!selectedRecord.test_name && selectedRecord.test_type && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Test Name</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.test_type}</p>
                    </div>
                  )}
                  {selectedRecord.result && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Result</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.result}</p>
                    </div>
                  )}
                  {!selectedRecord.result && (selectedRecord.result_value || selectedRecord.unit) && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Result</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.result_value}{selectedRecord.unit ? ` ${selectedRecord.unit}` : ''}</p>
                    </div>
                  )}
                  {selectedRecord.reference_range && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Reference Range</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.reference_range}</p>
                    </div>
                  )}
                  {selectedRecord.status && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Status</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.status}</p>
                    </div>
                  )}
                  {selectedRecord.test_category && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Category</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.test_category}</p>
                    </div>
                  )}
                  {selectedRecord.notes && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Notes</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-900 text-sm font-medium">{selectedRecord.notes}</p>
                      </div>
                    </div>
                  )}
                  {selectedRecord.lab_name && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Lab Name</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.lab_name}</p>
                    </div>
                  )}
                  {selectedRecord.ordered_by && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Ordered By</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.ordered_by}</p>
                    </div>
                  )}

                  {/* Screenings */}
                  {selectedRecord.screening_type && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Screening Type</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.screening_type}</p>
                    </div>
                  )}
                  {selectedRecord.result && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Result</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.result}</p>
                    </div>
                  )}
                  {selectedRecord.risk_level && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Risk Level</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.risk_level}</p>
                    </div>
                  )}
                  {selectedRecord.next_screening_date && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Next Screening Due</label>
                      <p className="text-gray-900 text-sm font-medium">{formatDate(selectedRecord.next_screening_date)}</p>
                    </div>
                  )}
                  {selectedRecord.recommendations && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Recommendations</label>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-gray-900 text-sm font-medium">{selectedRecord.recommendations}</p>
                      </div>
                    </div>
                  )}
                  {selectedRecord.healthcare_provider && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Healthcare Provider</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.healthcare_provider}</p>
                    </div>
                  )}
                  {selectedRecord.lab_name && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Lab Name</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.lab_name}</p>
                    </div>
                  )}
                  {selectedRecord.interpretation && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Interpretation</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.interpretation}</p>
                    </div>
                  )}
                  {typeof selectedRecord.follow_up_required !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Follow-up Required</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.follow_up_required ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {selectedRecord.follow_up_date && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Follow-up Date</label>
                      <p className="text-gray-900 text-sm font-medium">{formatDate(selectedRecord.follow_up_date)}</p>
                    </div>
                  )}
                  {selectedRecord.equipment_used && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Equipment Used</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.equipment_used}</p>
                    </div>
                  )}
                  {selectedRecord.test_location && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Test Location</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.test_location}</p>
                    </div>
                  )}

                  {/* Procedures */}
                  {selectedRecord.procedure_name && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Procedure Name</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.procedure_name}</p>
                    </div>
                  )}
                  {selectedRecord.description && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Description</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.description}</p>
                    </div>
                  )}
                  {selectedRecord.outcome && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Outcome</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.outcome}</p>
                    </div>
                  )}
                  {selectedRecord.complications && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Complications</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.complications}</p>
                    </div>
                  )}
                  {selectedRecord.healthcare_provider && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Healthcare Provider</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.healthcare_provider}</p>
                    </div>
                  )}
                  {selectedRecord.location && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Location</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.location}</p>
                    </div>
                  )}
                  {typeof selectedRecord.duration_minutes !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Duration (minutes)</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.duration_minutes}</p>
                    </div>
                  )}
                  {selectedRecord.anesthesia_type && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Anesthesia Type</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.anesthesia_type}</p>
                    </div>
                  )}
                  {typeof selectedRecord.follow_up_required !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Follow-up Required</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.follow_up_required ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {selectedRecord.next_appointment && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Next Appointment</label>
                      <p className="text-gray-900 text-sm font-medium">{formatDate(selectedRecord.next_appointment)}</p>
                    </div>
                  )}
                  {selectedRecord.notes && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Notes</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.notes}</p>
                    </div>
                  )}
                  {typeof selectedRecord.cost !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Cost</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.cost}</p>
                    </div>
                  )}
                  {typeof selectedRecord.insurance_covered !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Insurance Covered</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.insurance_covered ? 'Yes' : 'No'}</p>
                    </div>
                  )}

                  {/* Immunizations */}
                  {(selectedRecord.vaccine_name || selectedRecord.vaccine_type) && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Vaccine Name</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.vaccine_name || selectedRecord.vaccine_type}</p>
                    </div>
                  )}
                  {selectedRecord.dose_number && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Dose Number</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.dose_number}</p>
                    </div>
                  )}
                  {selectedRecord.lot_number && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Lot Number</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.lot_number}</p>
                    </div>
                  )}
                  {selectedRecord.manufacturer && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Manufacturer</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.manufacturer}</p>
                    </div>
                  )}
                  {selectedRecord.healthcare_provider && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Healthcare Provider</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.healthcare_provider}</p>
                    </div>
                  )}
                  {selectedRecord.batch_number && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Batch Number</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.batch_number}</p>
                    </div>
                  )}
                  {(selectedRecord.site_given || selectedRecord.injection_site) && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Site Given</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.site_given || selectedRecord.injection_site}</p>
                    </div>
                  )}
                  {selectedRecord.next_dose_due && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Next Dose Due</label>
                      <p className="text-gray-900 text-sm font-medium">{formatDate(selectedRecord.next_dose_due)}</p>
                    </div>
                  )}
                  {(selectedRecord.reactions || selectedRecord.adverse_reactions) && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Reactions</label>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-gray-900 text-sm font-medium">{selectedRecord.reactions || selectedRecord.adverse_reactions}</p>
                      </div>
                    </div>
                  )}

                  {/* Prenatal */}
                  {selectedRecord.gestational_age && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Gestational Age</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.gestational_age}</p>
                    </div>
                  )}
                  {selectedRecord.next_visit_date && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Next Visit</label>
                      <p className="text-gray-900 text-sm font-medium">{formatDate(selectedRecord.next_visit_date)}</p>
                    </div>
                  )}
                  {selectedRecord.assessment && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Assessment</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.assessment}</p>
                    </div>
                  )}
                  {selectedRecord.plan && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Plan</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.plan}</p>
                    </div>
                  )}

                  {/* Postpartum */}
                  {selectedRecord.assessment_notes && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Assessment Notes</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.assessment_notes}</p>
                    </div>
                  )}
                  {selectedRecord.recovery_status && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Recovery Status</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.recovery_status}</p>
                    </div>
                  )}
                  {selectedRecord.follow_up_plan && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Follow-up Plan</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.follow_up_plan}</p>
                    </div>
                  )}

                  {/* Family Planning */}
                  {selectedRecord.method_chosen && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Method Chosen</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.method_chosen}</p>
                    </div>
                  )}
                  {selectedRecord.method_category && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Method Category</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.method_category}</p>
                    </div>
                  )}
                  {selectedRecord.method_started_date && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Started Date</label>
                      <p className="text-gray-900 text-sm font-medium">{formatDate(selectedRecord.method_started_date)}</p>
                    </div>
                  )}
                  {typeof selectedRecord.counseling_done !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Counseling Done</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.counseling_done ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {selectedRecord.follow_up_date && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Follow-up Date</label>
                      <p className="text-gray-900 text-sm font-medium">{formatDate(selectedRecord.follow_up_date)}</p>
                    </div>
                  )}

                  {/* Baby Records */}
                  {(selectedRecord.first_name || selectedRecord.last_name) && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Baby Name</label>
                      <p className="text-gray-900 text-sm font-medium">{[selectedRecord.first_name, selectedRecord.middle_name, selectedRecord.last_name].filter(Boolean).join(' ')}</p>
                    </div>
                  )}
                  {typeof selectedRecord.weight_kg !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Weight</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.weight_kg} kg</p>
                    </div>
                  )}
                  {typeof selectedRecord.length_cm !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Length</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.length_cm} cm</p>
                    </div>
                  )}
                  {typeof selectedRecord.head_circumference_cm !== 'undefined' && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Head Circumference</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.head_circumference_cm} cm</p>
                    </div>
                  )}
                  {selectedRecord.feeding_type && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-500 mb-1">Feeding Type</label>
                      <p className="text-gray-900 text-sm font-medium">{selectedRecord.feeding_type}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Vital Signs */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Vital Signs</h4>
                
                {selectedRecord.vital_signs && Object.values(selectedRecord.vital_signs).some(value => value) ? (
                  <div className="space-y-3">
                    {selectedRecord.vital_signs.blood_pressure && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
                        <span className="text-sm text-gray-600">{selectedRecord.vital_signs.blood_pressure}</span>
                      </div>
                    )}
                    {selectedRecord.vital_signs.heart_rate && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                        <span className="text-sm text-gray-600">{selectedRecord.vital_signs.heart_rate}</span>
                      </div>
                    )}
                    {selectedRecord.vital_signs.temperature && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Temperature</span>
                        <span className="text-sm text-gray-600">{selectedRecord.vital_signs.temperature}</span>
                      </div>
                    )}
                    {selectedRecord.vital_signs.weight && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Weight</span>
                        <span className="text-sm text-gray-600">{selectedRecord.vital_signs.weight}</span>
                      </div>
                    )}
                    {selectedRecord.vital_signs.height && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Height</span>
                        <span className="text-sm text-gray-600">{selectedRecord.vital_signs.height}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No vital signs recorded for this appointment.</p>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Record Information</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Created: {new Date(selectedRecord.created_at).toLocaleString()}</p>
                    {selectedRecord.updated_at !== selectedRecord.created_at && (
                      <p>Updated: {new Date(selectedRecord.updated_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => handleSingleRecordPDF(selectedRecord)}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Print this record as PDF"
              >
                <FaFilePdf />
                Print PDF
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </UserLayout>
  );
};

export default MedicalHistory;
