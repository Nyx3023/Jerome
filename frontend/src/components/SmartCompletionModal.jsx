import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';
import {
  getServiceCategory,
  getCategoryConfig,
  getAllVitalSigns,
  COMPLETION_MODAL_FIELDS,
  validateRequiredFields
} from '../utils/serviceCategories';

const SmartCompletionModal = ({
  appointment,
  services = [],
  onClose,
  onSuccess,
  actorRole = 'doctor',
  allowComplete = true
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // Get service category - use service_type or session (different queries use different field names)
  const serviceTypeName = appointment.service_type || appointment.session || '';
  const serviceCategory = getServiceCategory(serviceTypeName, services);
  const categoryConfig = getCategoryConfig(serviceCategory);
  const modalConfig = COMPLETION_MODAL_FIELDS[categoryConfig.completionModal];
  const vitalSignsFields = getAllVitalSigns(serviceCategory);

  // Initialize form data
  const [formData, setFormData] = useState({
    test_type: '',
    test_category: 'blood',
    test_date: '',
    result_value: '',
    normal_range: '',
    unit: '',
    status: 'completed',
    interpretation: '',
    notes: ''
  });

  const [vitalSigns, setVitalSigns] = useState(() => {
    const initialVitalSigns = {};
    vitalSignsFields.forEach(field => {
      initialVitalSigns[field.key] = '';
    });
    return initialVitalSigns;
  });

  const [completionData, setCompletionData] = useState(() => {
    const initialData = {};
    modalConfig.sections.forEach(section => {
      section.fields.forEach(field => {
        initialData[field.key] = '';
      });
    });
    if (getCategoryConfig(getServiceCategory(appointment.service_type, services)).category === 'prenatal_care' || getServiceCategory(appointment.service_type, services) === 'prenatal_care') {
      initialData.cycle_choice = 'auto';
    }
    return initialData;
  });

  const modalRef = useRef(null);
  const [addMedication, setAddMedication] = useState(false);
  const [medAdminDate, setMedAdminDate] = useState(new Date().toISOString().slice(0, 10));
  const [medEntries, setMedEntries] = useState([
    { time_administered: '', medication_name: '', dose: '', route: '', administered_by: '', notes: '' }
  ]);
  const addMedRow = () => setMedEntries([...medEntries, { time_administered: '', medication_name: '', dose: '', route: '', administered_by: '', notes: '' }]);
  const updateMedRow = (i, key, val) => {
    const copy = medEntries.slice();
    copy[i][key] = val;
    setMedEntries(copy);
  };

  useEffect(() => {
    try {
      if (document && document.body) document.body.style.pointerEvents = 'auto';
      const nodes = Array.from(document.querySelectorAll('*')).filter(el => {
        const cls = el.className || '';
        return typeof cls === 'string' && cls.includes('fixed') && cls.includes('inset-0');
      });
      nodes.forEach(el => {
        if (el && el.childElementCount === 0) el.remove();
      });
      const tryFocus = () => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector('input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]');
          if (firstInput && typeof firstInput.focus === 'function') firstInput.focus();
        }
      };
      setTimeout(tryFocus, 25);
      setTimeout(tryFocus, 150);
      setTimeout(tryFocus, 600);
    } catch { }
  }, []);

  const computeGestationalAge = (lmpStr) => {
    if (!lmpStr) return '';
    try {
      const lmpDate = new Date(lmpStr);
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - lmpDate.getTime());
      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(totalDays / 7);
      const days = totalDays % 7;
      return `${weeks}w ${days}d`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const pid = appointment?.patient_id || appointment?.user_id;
    if (!pid) return;
    axios.get(`/api/admin/patient-profile/${pid}`)
      .then((res) => {
        const p = res.data || {};
        const lmp = p.lmp || '';
        const edd = p.edd || '';
        const ga = computeGestationalAge(lmp);
        setVitalSigns(prev => ({
          ...prev,
          lmp: lmp ? String(lmp).slice(0, 10) : prev.lmp,
          edd: edd ? String(edd).slice(0, 10) : prev.edd,
          gestational_age: ga || prev.gestational_age
        }));
        setCompletionData(prev => ({
          ...prev,
          gestational_age: prev.gestational_age || ga || ''
        }));
      })
      .catch(() => { });
  }, [appointment]);

  useEffect(() => {
    const bookingId = appointment?.id;
    if (!bookingId) return;
    axios.get(`/api/doctors/medical-notes/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then((res) => {
        const notes = res.data || {};
        let vs = notes.vital_signs;
        try { if (typeof vs === 'string') vs = JSON.parse(vs); } catch { }
        if (vs && typeof vs === 'object') {
          setVitalSigns(prev => ({ ...prev, ...vs }));
        }
      })
      .catch(() => { });
  }, [appointment]);

  const handleVitalSignsChange = (key, value) => {
    setVitalSigns(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCompletionDataChange = (key, value) => {
    setCompletionData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    // Resolve "Other" selections: replace with the typed custom value
    const resolvedFormData = { ...formData };
    if (resolvedFormData.test_type === 'Other') {
      if (!resolvedFormData.test_type_other?.trim()) {
        setErrors(['Please specify the test type when "Other" is selected.']);
        setLoading(false);
        return;
      }
      resolvedFormData.test_type = resolvedFormData.test_type_other.trim();
    }
    if (resolvedFormData.test_category === 'Other') {
      if (!resolvedFormData.test_category_other?.trim()) {
        setErrors(['Please specify the category when "Other" is selected.']);
        setLoading(false);
        return;
      }
      resolvedFormData.test_category = resolvedFormData.test_category_other.trim();
    }
    if (resolvedFormData.vaccine_type === 'Other') {
      if (!resolvedFormData.vaccine_type_other?.trim()) {
        setErrors(['Please specify the vaccine type when "Other" is selected.']);
        setLoading(false);
        return;
      }
      resolvedFormData.vaccine_type = resolvedFormData.vaccine_type_other.trim();
    }
    if (resolvedFormData.injection_site === 'Other') {
      resolvedFormData.injection_site = (resolvedFormData.injection_site_other || '').trim() || 'Other';
    }
    // Use resolvedFormData for the rest of the submission
    Object.assign(formData, resolvedFormData);

    // For lab results, validate formData instead of completionData
    if (serviceCategory === 'lab_results') {
      if (!formData.test_type || !formData.test_category || !formData.test_date) {
        setErrors(['Test Type, Category, and Test Date are required']);
        setLoading(false);
        return;
      }
    } else {
      // Validate required fields for other categories
      const validationErrors = validateRequiredFields(serviceCategory, vitalSigns, completionData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare service-specific data based on category
      let serviceData = {};
      let endpoint = '';

      switch (serviceCategory) {
        case 'family_planning':
          {
            const isWalkIn = !appointment.patient_id;
            if (isWalkIn) {
              serviceData = {
                patient_name: appointment.patient_name,
                contact_number: appointment.contact_number,
                method_type: completionData.method_category || 'none',
                method_details: completionData.method_chosen || '',
                counseling_notes: completionData.notes || '',
                follow_up_date: completionData.follow_up_date || null
              };
              endpoint = actorRole === 'staff' ? '/api/admin/walkin/family-planning' : '/api/doctors/walkin/family-planning';
            } else {
              serviceData = {
                patient_id: appointment.patient_id,
                consultation_date: new Date().toISOString().split('T')[0],
                method_chosen: completionData.method_chosen || '',
                method_started_date: completionData.method_started_date || null,
                method_category: completionData.method_category || 'none',
                counseling_done: completionData.counseling_done || false,
                side_effects: completionData.side_effects || '',
                follow_up_date: completionData.follow_up_date || null,
                status: 'active',
                notes: completionData.notes || '',
                counseled_by: appointment.doctor_id || null
              };
              endpoint = '/api/clinic/family-planning';
            }
          }
          break;

        case 'lab_results':
          {
            const isWalkIn = !appointment.patient_id;
            if (isWalkIn) {
              serviceData = {
                patient_name: appointment.patient_name,
                contact_number: appointment.contact_number,
                test_name: formData.test_type,
                test_category: formData.test_category,
                test_date: formData.test_date,
                result_value: formData.result_value || '',
                unit: formData.unit || '',
                reference_range: formData.normal_range || '',
                status: formData.status || 'completed',
                lab_name: formData.lab_name || '',
                notes: formData.notes || ''
              };
              endpoint = actorRole === 'staff' ? '/api/admin/walkin/lab-results' : '/api/doctors/walkin/lab-results';
            } else {
              serviceData = {
                patient_id: appointment.patient_id,
                booking_id: appointment.id,
                test_type: formData.test_type,
                test_category: formData.test_category,
                test_date: formData.test_date,
                result_value: formData.result_value || '',
                normal_range: formData.normal_range || '',
                unit: formData.unit || '',
                status: formData.status || 'completed',
                interpretation: formData.interpretation || '',
                notes: formData.notes || '',
                ordered_by: appointment.doctor_id || null
              };
              endpoint = '/api/clinic/lab-results';
            }
          }
          break;

        case 'prenatal_care':
          {
            const isWalkIn = !appointment.patient_id;
            const gaStr = completionData.gestational_age || vitalSigns.gestational_age || '';

            if (isWalkIn) {
              // For walk-in patients, use direct prenatal endpoint
              serviceData = {
                patient_name: appointment.patient_name,
                contact_number: appointment.contact_number,
                visit_date: new Date().toISOString().split('T')[0],
                gestational_age: gaStr,
                weight: vitalSigns.weight || null,
                blood_pressure: vitalSigns.blood_pressure || '',
                fundal_height: vitalSigns.fundal_height_cm || null,
                fetal_heart_rate: vitalSigns.fetal_heart_rate || null,
                temperature_c: vitalSigns.temperature_c || null,
                heart_rate: vitalSigns.heart_rate || null,
                respiratory_rate: vitalSigns.respiratory_rate || null,
                notes: completionData.prenatal_findings || '',
                next_visit_date: completionData.next_visit_date || null,
                cycle_choice: completionData.cycle_choice || 'auto'
              };
              endpoint = actorRole === 'staff' ? '/api/staff/walkin/prenatal' : '/api/doctors/walkin/prenatal';
            } else {
              // For registered patients, use medical notes with structured updates
              const doctorNotes = generateDoctorNotes(completionData, 'prenatal_care');
              serviceData = {
                booking_id: appointment.id,
                patient_id: appointment.patient_id || null,
                doctor_notes: doctorNotes || 'Prenatal visit completed',
                vital_signs: { ...vitalSigns },
                structured_updates: {
                  prenatal: {
                    gestational_age: gaStr,
                    prenatal_findings: completionData.prenatal_findings || '',
                    next_visit_date: completionData.next_visit_date || null,
                    cycle_choice: completionData.cycle_choice || 'auto',
                    risk_assessment: completionData.risk_assessment || '',
                    recommendations: completionData.recommendations || '',
                    next_visit_plan: completionData.next_visit_plan || '',
                    blood_pressure: vitalSigns.blood_pressure || '',
                    weight_kg: vitalSigns.weight || null,
                    fundal_height_cm: vitalSigns.fundal_height_cm || null,
                    fetal_heart_rate: vitalSigns.fetal_heart_rate || null,
                    temperature_c: vitalSigns.temperature_c || null,
                    maternal_heart_rate: vitalSigns.heart_rate || null,
                    respiratory_rate: vitalSigns.respiratory_rate || null
                  }
                }
              };
              endpoint = '/api/doctors/medical-notes';
            }
          }
          break;

        case 'postpartum_care':
        case 'postpartum':
          {
            const doctorNotes = generateDoctorNotes(completionData, 'postpartum');
            serviceData = {
              booking_id: appointment.id,
              patient_id: appointment.patient_id || appointment.user_id || null,
              doctor_notes: doctorNotes || 'Postpartum visit completed',
              vital_signs: { ...vitalSigns },
              structured_updates: {
                postpartum: {
                  postpartum_findings: completionData.postpartum_findings || completionData.notes || '',
                  recovery_status: completionData.recovery_status || '',
                  next_visit_plan: completionData.next_visit_date || null
                }
              }
            };
            endpoint = '/api/doctors/medical-notes';
          }
          break;

        case 'screening':
          {
            const isWalkIn = !appointment.patient_id;
            if (isWalkIn) {
              serviceData = {
                patient_name: appointment.patient_name,
                contact_number: appointment.contact_number,
                test_type: formData.test_type || completionData.test_type || '',
                date_performed: formData.date_performed || new Date().toISOString().split('T')[0],
                result: formData.result || completionData.screening_results || '',
                status: formData.status || 'completed',
                healthcare_provider: formData.healthcare_provider || appointment.doctor_id || null,
                equipment_used: formData.equipment_used || '',
                test_location: formData.test_location || '',
                follow_up_required: formData.follow_up_required || false,
                follow_up_date: formData.follow_up_date || null,
                notes: formData.notes || completionData.notes || ''
              };
              endpoint = actorRole === 'staff' ? '/api/admin/walkin/screenings' : '/api/doctors/walkin/screenings';
            } else {
              serviceData = {
                patient_id: appointment.patient_id,
                booking_id: appointment.id,
                test_type: formData.test_type || completionData.test_type || '',
                date_performed: formData.date_performed || new Date().toISOString().split('T')[0],
                result: formData.result || completionData.screening_results || '',
                status: formData.status || 'completed',
                healthcare_provider: formData.healthcare_provider || appointment.doctor_id || null,
                equipment_used: formData.equipment_used || '',
                test_location: formData.test_location || '',
                follow_up_required: formData.follow_up_required || false,
                follow_up_date: formData.follow_up_date || null,
                notes: formData.notes || completionData.notes || ''
              };
              endpoint = '/api/clinic/screenings';
            }
          }
          break;

        case 'medical_procedures':
          {
            const isWalkIn = !appointment.patient_id;
            if (isWalkIn) {
              const doctorNotes = generateDoctorNotes({
                procedure_performed: formData.procedure_type || '',
                procedure_outcome: formData.outcome || '',
                complications: formData.complications || ''
              }, 'medical_procedures');
              serviceData = {
                booking_id: appointment.id,
                patient_id: null,
                doctor_notes: doctorNotes || 'Procedure performed',
                vital_signs: { ...vitalSigns },
                structured_updates: {
                  procedures: {
                    procedure_type: formData.procedure_type || '',
                    procedure_performed: formData.outcome || '',
                    procedure_notes: formData.notes || ''
                  }
                }
              };
              endpoint = '/api/doctors/medical-notes';
            } else {
              serviceData = {
                patient_id: appointment.patient_id,
                booking_id: appointment.id,
                procedure_type: formData.procedure_type || '',
                date_performed: formData.date_performed || new Date().toISOString().split('T')[0],
                status: formData.status || 'completed',
                healthcare_provider: formData.healthcare_provider || appointment.doctor_id || null,
                location: formData.location || '',
                duration_minutes: formData.duration_minutes || null,
                anesthesia_type: formData.anesthesia_type || '',
                complications: formData.complications || '',
                outcome: formData.outcome || '',
                notes: formData.notes || ''
              };
              endpoint = '/api/clinic/procedures';
            }
          }
          break;

        case 'immunizations':
          {
            const isWalkIn = !appointment.patient_id;
            if (isWalkIn) {
              serviceData = {
                patient_name: appointment.patient_name,
                contact_number: appointment.contact_number,
                vaccine_type: formData.vaccine_type || formData.vaccine_name || '',
                date_given: formData.date_given || new Date().toISOString().split('T')[0],
                dose_number: formData.dose_number || '',
                injection_site: formData.injection_site || '',
                healthcare_provider: formData.healthcare_provider || appointment.doctor_id || null,
                batch_number: formData.batch_number || '',
                manufacturer: formData.manufacturer || '',
                next_due_date: formData.next_due_date || null,
                adverse_reactions: formData.adverse_reactions || '',
                notes: formData.notes || ''
              };
              endpoint = actorRole === 'staff' ? '/api/admin/walkin/immunizations' : '/api/doctors/walkin/immunizations';
            } else {
              serviceData = {
                patient_id: appointment.patient_id,
                booking_id: appointment.id,
                vaccine_name: formData.vaccine_type || formData.vaccine_name || '',
                date_given: formData.date_given || new Date().toISOString().split('T')[0],
                dose_number: formData.dose_number || '',
                injection_site: formData.injection_site || '',
                healthcare_provider: formData.healthcare_provider || appointment.doctor_id || null,
                next_due_date: formData.next_due_date || null,
                batch_number: formData.batch_number || '',
                manufacturer: formData.manufacturer || '',
                adverse_reactions: formData.adverse_reactions || '',
                notes: formData.notes || ''
              };
              endpoint = '/api/clinic/immunizations';
            }
          }
          break;

        case 'birth_plan':
          {
            serviceData = {
              patient_id: appointment.patient_id || null,
              partner_name: completionData.partner_name || '',
              partner_phone: completionData.partner_phone || '',
              transport_mode: completionData.transport_mode || '',
              emergency_facility: completionData.emergency_facility || '',
              donor_name: completionData.donor_name || '',
              donor_phone: completionData.donor_phone || '',
              philhealth_status: completionData.philhealth_status || '',
              married: completionData.married || '',
              checklist_mother: completionData.checklist_mother || '',
              checklist_baby: completionData.checklist_baby || '',
              consent_signed: completionData.consent_signed === 'Yes' ? 1 : 0,
              signed_at: completionData.consent_signed === 'Yes' ? new Date().toISOString() : null
            };
            endpoint = '/api/clinic/birth-plan';
          }
          break;

        default:
          throw new Error(`Unsupported service category: ${serviceCategory}`);
      }

      // Submit to service-specific endpoint
      await axios.post(endpoint, serviceData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (addMedication) {
        let pidResolved = appointment.patient_id || null;
        if (!pidResolved && appointment.user_id) {
          try {
            const r = await axios.get(`/api/admin/patient-profile/${appointment.user_id}`);
            pidResolved = (r.data && r.data.id) ? r.data.id : null;
          } catch { }
        }
        if (!pidResolved && appointment.patient_name && appointment.contact_number) {
          try {
            const r2 = await axios.get('/api/admin/walkin/patient-profile', { params: { patient_name: appointment.patient_name, contact_number: appointment.contact_number } });
            pidResolved = (r2.data && r2.data.id) ? r2.data.id : null;
          } catch { }
        }
        const rows = (medEntries || []).filter(e => (e.medication_name || '').trim().length > 0);
        if (pidResolved && rows.length > 0) {
          await axios.post('/api/clinic/medication-administration', {
            patient_id: pidResolved,
            admission_id: null,
            administration_date: medAdminDate,
            entries: rows
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        }
      }

      // Update appointment status to completed if allowed
      if (allowComplete) {
        const statusEndpoint = actorRole === 'staff'
          ? '/api/staff/updateAppointmentStatus'
          : '/api/doctors/updateAppointmentStatus';

        await axios.put(statusEndpoint, {
          id: appointment.id,
          status: 'completed'
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      onSuccess(appointment.id, appointment.appointment_status, appointment.patient_name);
      onClose();

      alert(allowComplete ? `${categoryConfig.name} appointment completed successfully!` : `${categoryConfig.name} data saved successfully!`);
    } catch (error) {
      console.error('Error completing appointment:', error);
      setErrors(['Error completing appointment. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const generateDoctorNotes = (data, category) => {
    const notes = [];

    switch (category) {
      case 'prenatal_care':
        if (data.prenatal_findings) notes.push(`Prenatal Findings: ${data.prenatal_findings}`);
        if (data.risk_assessment) notes.push(`Risk Assessment: ${data.risk_assessment}`);
        if (data.prenatal_education) notes.push(`Education Provided: ${data.prenatal_education}`);
        break;
      case 'family_planning':
        if (data.contraceptive_method) notes.push(`Method Discussed: ${data.contraceptive_method}`);
        if (data.method_chosen) notes.push(`Method Chosen: ${data.method_chosen}`);
        if (data.counseling_provided) notes.push(`Counseling: ${data.counseling_provided}`);
        break;
      case 'lab_results':
        if (data.lab_results_summary) notes.push(`Results: ${data.lab_results_summary}`);
        if (data.abnormal_findings) notes.push(`Abnormal Findings: ${data.abnormal_findings}`);
        if (data.interpretation) notes.push(`Interpretation: ${data.interpretation}`);
        break;
      case 'immunizations':
        if (data.vaccines_given) notes.push(`Vaccines Given: ${data.vaccines_given}`);
        if (data.batch_numbers) notes.push(`Batch Numbers: ${data.batch_numbers}`);
        if (data.adverse_reactions) notes.push(`Reactions: ${data.adverse_reactions}`);
        break;
      case 'screening':
        if (data.screening_type) notes.push(`Screening Type: ${data.screening_type}`);
        if (data.screening_results) notes.push(`Results: ${data.screening_results}`);
        if (data.risk_factors) notes.push(`Risk Factors: ${data.risk_factors}`);
        break;
      case 'medical_procedures':
        if (data.procedure_performed) notes.push(`Procedure: ${data.procedure_performed}`);
        if (data.procedure_outcome) notes.push(`Outcome: ${data.procedure_outcome}`);
        if (data.complications) notes.push(`Complications: ${data.complications}`);
        break;
      case 'postpartum':
        if (data.delivery_date) notes.push(`Delivery Date: ${data.delivery_date}`);
        if (data.postpartum_findings) notes.push(`Findings: ${data.postpartum_findings}`);
        if (data.breastfeeding_status) notes.push(`Breastfeeding: ${data.breastfeeding_status}`);
        break;
      default:
        if (data.chief_complaint) notes.push(`Chief Complaint: ${data.chief_complaint}`);
        if (data.diagnosis) notes.push(`Diagnosis: ${data.diagnosis}`);
        if (data.treatment_given) notes.push(`Treatment: ${data.treatment_given}`);
    }

    return notes.join('\n') || `${category.replace('_', ' ')} appointment completed.`;
  };

  const generateServiceNotes = (data, category) => {
    const notes = [];

    switch (category) {
      case 'lab_results':
        if (data.test_type) notes.push(`Test Type: ${data.test_type}`);
        if (data.test_category) notes.push(`Category: ${data.test_category}`);
        if (data.test_date) notes.push(`Test Date: ${data.test_date}`);
        if (data.result_value) notes.push(`Result: ${data.result_value} ${data.unit || ''}`);
        if (data.normal_range) notes.push(`Normal Range: ${data.normal_range}`);
        if (data.status) notes.push(`Status: ${data.status}`);
        if (data.interpretation) notes.push(`Interpretation: ${data.interpretation}`);
        if (data.notes) notes.push(`Notes: ${data.notes}`);
        break;

      case 'immunizations':
        if (data.vaccine_type) notes.push(`Vaccine Type: ${data.vaccine_type}`);
        if (data.date_given) notes.push(`Date Given: ${data.date_given}`);
        if (data.dose_number) notes.push(`Dose Number: ${data.dose_number}`);
        if (data.injection_site) notes.push(`Injection Site: ${data.injection_site}`);
        if (data.healthcare_provider) notes.push(`Healthcare Provider: ${data.healthcare_provider}`);
        if (data.next_due_date) notes.push(`Next Due Date: ${data.next_due_date}`);
        if (data.batch_number) notes.push(`Batch Number: ${data.batch_number}`);
        if (data.manufacturer) notes.push(`Manufacturer: ${data.manufacturer}`);
        if (data.notes) notes.push(`Notes: ${data.notes}`);
        break;

      case 'screening':
        if (data.test_type) notes.push(`Test Type: ${data.test_type}`);
        if (data.date_performed) notes.push(`Date Performed: ${data.date_performed}`);
        if (data.result) notes.push(`Result: ${data.result}`);
        if (data.status) notes.push(`Status: ${data.status}`);
        if (data.healthcare_provider) notes.push(`Healthcare Provider: ${data.healthcare_provider}`);
        if (data.equipment_used) notes.push(`Equipment Used: ${data.equipment_used}`);
        if (data.test_location) notes.push(`Test Location: ${data.test_location}`);
        if (data.follow_up_required) notes.push(`Follow-up Required: Yes`);
        if (data.follow_up_date) notes.push(`Follow-up Date: ${data.follow_up_date}`);
        if (data.notes) notes.push(`Notes: ${data.notes}`);
        break;

      case 'medical_procedures':
        if (data.procedure_type) notes.push(`Procedure Type: ${data.procedure_type}`);
        if (data.date_performed) notes.push(`Date Performed: ${data.date_performed}`);
        if (data.status) notes.push(`Status: ${data.status}`);
        if (data.healthcare_provider) notes.push(`Healthcare Provider: ${data.healthcare_provider}`);
        if (data.location) notes.push(`Location: ${data.location}`);
        if (data.duration_minutes) notes.push(`Duration: ${data.duration_minutes} minutes`);
        if (data.anesthesia_type) notes.push(`Anesthesia Type: ${data.anesthesia_type}`);
        if (data.cost) notes.push(`Cost: $${data.cost}`);
        if (data.complications) notes.push(`Complications: ${data.complications}`);
        if (data.outcome) notes.push(`Outcome: ${data.outcome}`);
        if (data.follow_up_required) notes.push(`Follow-up Required: Yes`);
        if (data.next_appointment) notes.push(`Next Appointment: ${data.next_appointment}`);
        if (data.insurance_covered) notes.push(`Insurance Covered: Yes`);
        if (data.notes) notes.push(`Notes: ${data.notes}`);
        break;

      default:
        // For other categories, include all available data
        Object.entries(data).forEach(([key, value]) => {
          if (value && key !== 'notes') {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            notes.push(`${label}: ${value}`);
          }
        });
        if (data.notes) notes.push(`Notes: ${data.notes}`);
        break;
    }

    return notes.join('\n') || `${categoryConfig.name} appointment completed.`;
  };

  const renderField = (field) => {
    const value = completionData[field.key] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCompletionDataChange(field.key, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.placeholder}
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleCompletionDataChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCompletionDataChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCompletionDataChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {modalConfig.title}
            </h2>
            {modalConfig.description && (
              <p className="text-sm text-gray-600 mb-4 italic">
                {modalConfig.description}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Patient: {appointment.patient_name} | Service: {serviceTypeName}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Category: {categoryConfig.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Render vital signs for any category that requires them */}
          {categoryConfig.requiresVitalSigns && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Vital Signs
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vitalSignsFields.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={vitalSigns[field.key] || ''}
                      onChange={(e) => handleVitalSignsChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render dynamic form based on service category */}
          {serviceCategory === 'lab_results' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Type *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., CBC, Urinalysis, Blood Sugar, Pregnancy Test"
                    value={formData.test_type || ''}
                    onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.test_category || 'Blood Test'}
                    onChange={(e) => setFormData({ ...formData, test_category: e.target.value, test_category_other: '' })}
                    required
                  >
                    <option value="Blood Test">Blood Test</option>
                    <option value="Urine Test">Urine Test</option>
                    <option value="Cervical Screening">Cervical Screening</option>
                    <option value="Pregnancy Test">Pregnancy Test</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="Imaging">Imaging</option>
                    <option value="General Screening">General Screening</option>
                    <option value="Other">Other</option>
                  </select>
                  {formData.test_category === 'Other' && (
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 mt-2"
                      placeholder="Please specify category..."
                      value={formData.test_category_other || ''}
                      onChange={(e) => setFormData({ ...formData, test_category_other: e.target.value })}
                      required
                      autoFocus
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Date *</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={formData.test_date || ''}
                  onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Result Value</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.result_value || ''}
                    onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Normal Range</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., 70-100"
                    value={formData.normal_range || ''}
                    onChange={(e) => setFormData({ ...formData, normal_range: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., mg/dL"
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.status || 'Completed'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Abnormal">Abnormal</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interpretation</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Clinical interpretation of results..."
                  value={formData.interpretation || ''}
                  onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Additional notes or observations..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>
            </>
          )}

          {/* Immunizations Form */}
          {serviceCategory === 'immunizations' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vaccine Type *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.vaccine_type || ''}
                    onChange={(e) => setFormData({ ...formData, vaccine_type: e.target.value, vaccine_type_other: '' })}
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
                    <option value="Other">Other</option>
                  </select>
                  {formData.vaccine_type === 'Other' && (
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 mt-2"
                      placeholder="Please specify vaccine..."
                      value={formData.vaccine_type_other || ''}
                      onChange={(e) => setFormData({ ...formData, vaccine_type_other: e.target.value })}
                      required
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Given *</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={formData.date_given || ''}
                    onChange={(e) => setFormData({ ...formData, date_given: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dose Number</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., 1st dose, 2nd dose, Booster"
                    value={formData.dose_number || ''}
                    onChange={(e) => setFormData({ ...formData, dose_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Injection Site</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.injection_site || ''}
                    onChange={(e) => setFormData({ ...formData, injection_site: e.target.value, injection_site_other: '' })}
                  >
                    <option value="">Select Site</option>
                    <option value="Left Arm">Left Arm</option>
                    <option value="Right Arm">Right Arm</option>
                    <option value="Left Thigh">Left Thigh</option>
                    <option value="Right Thigh">Right Thigh</option>
                    <option value="Other">Other</option>
                  </select>
                  {formData.injection_site === 'Other' && (
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 mt-2"
                      placeholder="Please specify injection site..."
                      value={formData.injection_site_other || ''}
                      onChange={(e) => setFormData({ ...formData, injection_site_other: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Healthcare Provider</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.healthcare_provider || ''}
                    onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Next Due Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={formData.next_due_date || ''}
                    onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Batch Number</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.batch_number || ''}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Any additional notes or reactions..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>
            </>
          )}

          {/* Screening Form */}
          {serviceCategory === 'screening' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Type *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.test_type || ''}
                    onChange={(e) => setFormData({ ...formData, test_type: e.target.value, test_type_other: '' })}
                    required
                  >
                    <option value="">Select Test Type</option>
                    <option value="Newborn Screening Test">Newborn Screening Test</option>
                    <option value="Newborn Hearing Test">Newborn Hearing Test</option>
                    <option value="Metabolic Screening">Metabolic Screening</option>
                    <option value="Genetic Screening">Genetic Screening</option>
                    <option value="Other">Other</option>
                  </select>
                  {formData.test_type === 'Other' && (
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 mt-2"
                      placeholder="Please specify test type..."
                      value={formData.test_type_other || ''}
                      onChange={(e) => setFormData({ ...formData, test_type_other: e.target.value })}
                      required
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Performed *</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={formData.date_performed || ''}
                    onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Result</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Test result"
                    value={formData.result || ''}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.status || 'Normal'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                    <option value="Pending">Pending</option>
                    <option value="Inconclusive">Inconclusive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Healthcare Provider</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Provider name"
                    value={formData.healthcare_provider || ''}
                    onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Equipment Used</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Equipment/device used"
                    value={formData.equipment_used || ''}
                    onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Location</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Where the test was performed"
                  value={formData.test_location || ''}
                  onChange={(e) => setFormData({ ...formData, test_location: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.follow_up_required || false}
                  onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                />
                <label className="text-sm font-medium">Follow-up Required</label>
              </div>
              {formData.follow_up_required && (
                <div>
                  <label className="block text-sm font-medium mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={formData.follow_up_date || ''}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Additional notes or observations"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Medical Procedures Form */}
          {serviceCategory === 'medical_procedures' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Procedure Type *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Name of procedure"
                    value={formData.procedure_type || ''}
                    onChange={(e) => setFormData({ ...formData, procedure_type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Performed *</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={formData.date_performed || ''}
                    onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.status || 'Scheduled'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Postponed">Postponed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Healthcare Provider</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Provider name"
                    value={formData.healthcare_provider || ''}
                    onChange={(e) => setFormData({ ...formData, healthcare_provider: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Procedure location"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Duration in minutes"
                    value={formData.duration_minutes || ''}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Anesthesia Type</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Type of anesthesia used"
                    value={formData.anesthesia_type || ''}
                    onChange={(e) => setFormData({ ...formData, anesthesia_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Procedure cost"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Complications</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                  placeholder="Any complications during procedure"
                  value={formData.complications || ''}
                  onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Outcome</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                  placeholder="Results and success of procedure"
                  value={formData.outcome || ''}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.follow_up_required || false}
                  onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                />
                <label className="text-sm font-medium">Follow-up Required</label>
              </div>
              {formData.follow_up_required && (
                <div>
                  <label className="block text-sm font-medium mb-1">Next Appointment</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="When to return for follow-up"
                    value={formData.next_appointment || ''}
                    onChange={(e) => setFormData({ ...formData, next_appointment: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.insurance_covered || false}
                  onChange={(e) => setFormData({ ...formData, insurance_covered: e.target.checked })}
                />
                <label className="text-sm font-medium">Insurance Covered</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Additional notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Default form for other categories */}
          {!['lab_results', 'immunizations', 'screening', 'medical_procedures'].includes(serviceCategory) && (
            <>
              {/* Render category-specific form sections */}
              {modalConfig.sections?.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {serviceCategory === 'prenatal_care' && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pregnancy Cycle</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Assignment</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={completionData.cycle_choice || 'auto'}
                      onChange={(e) => handleCompletionDataChange('cycle_choice', e.target.value)}
                    >
                      <option value="auto">Automatic (based on records)</option>
                      <option value="current">Current cycle</option>
                      <option value="new">Start new cycle</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Medication Administration</h3>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={addMedication} onChange={(e) => setAddMedication(e.target.checked)} />
                <span>Record medications for this visit</span>
              </label>
            </div>
            {addMedication && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input type="date" className="w-full border rounded px-3 py-2" value={medAdminDate} onChange={(e) => setMedAdminDate(e.target.value)} />
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
                      {medEntries.map((e, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2"><input type="time" className="w-full border rounded px-2 py-1" value={e.time_administered} onChange={(ev) => updateMedRow(i, 'time_administered', ev.target.value)} /></td>
                          <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.medication_name} onChange={(ev) => updateMedRow(i, 'medication_name', ev.target.value)} required /></td>
                          <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.dose} onChange={(ev) => updateMedRow(i, 'dose', ev.target.value)} /></td>
                          <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.route} onChange={(ev) => updateMedRow(i, 'route', ev.target.value)} /></td>
                          <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.administered_by} onChange={(ev) => updateMedRow(i, 'administered_by', ev.target.value)} /></td>
                          <td className="p-2"><input type="text" className="w-full border rounded px-2 py-1" value={e.notes} onChange={(ev) => updateMedRow(i, 'notes', ev.target.value)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3">
                    <button type="button" onClick={addMedRow} className="px-3 py-1 bg-gray-100 rounded">Add Row</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Saving...' : 'Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmartCompletionModal;
