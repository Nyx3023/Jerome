// Service Category Configuration for Smart Appointment Completion
// This defines what fields and modals are needed for each service category

export const SERVICE_CATEGORIES = {
  prenatal_care: {
    name: 'Prenatal Care',
    requiresVitalSigns: true,
    vitalSignsType: 'obstetric',
    completionModal: 'prenatal',
    requiredFields: ['lmp', 'edd', 'gestational_age'],
    optionalFields: ['gravida', 'para', 'fetal_heart_rate', 'fundal_height', 'fetal_movement']
  },
  family_planning: {
    name: 'Family Planning',
    requiresVitalSigns: true,
    vitalSignsType: 'basic',
    completionModal: 'family_planning',
    requiredFields: ['blood_pressure'],
    optionalFields: ['height', 'heart_rate']
  },
  lab_results: {
    name: 'Lab Results',
    requiresVitalSigns: false,
    vitalSignsType: null,
    completionModal: 'lab_results',
    requiredFields: [],
    optionalFields: []
  },
  immunizations: {
    name: 'Immunizations',
    requiresVitalSigns: true,
    vitalSignsType: 'basic',
    completionModal: 'immunizations',
    requiredFields: ['temperature'],
    optionalFields: ['blood_pressure', 'heart_rate']
  },
  screening: {
    name: 'Screening',
    requiresVitalSigns: true,
    vitalSignsType: 'basic',
    completionModal: 'screening',
    requiredFields: [],
    optionalFields: ['heart_rate', 'temperature']
  },
  medical_procedures: {
    name: 'Medical Procedures',
    requiresVitalSigns: true,
    vitalSignsType: 'full',
    completionModal: 'medical_procedures',
    requiredFields: ['blood_pressure'],
    optionalFields: ['height']
  },
  postpartum: {
    name: 'Postpartum Care',
    requiresVitalSigns: true,
    vitalSignsType: 'obstetric',
    completionModal: 'postpartum',
    requiredFields: ['blood_pressure'],
    optionalFields: ['heart_rate', 'fundal_height']
  },
  general: {
    name: 'General Consultation',
    requiresVitalSigns: true,
    vitalSignsType: 'basic',
    completionModal: 'general',
    requiredFields: ['blood_pressure'],
    optionalFields: ['heart_rate', 'weight', 'height']
  },
  birth_plan: {
    name: 'Birth Plan',
    requiresVitalSigns: false,
    vitalSignsType: null,
    completionModal: 'birth_plan',
    requiredFields: [],
    optionalFields: []
  }
};

// Vital Signs Field Definitions
export const VITAL_SIGNS_FIELDS = {
  basic: [
    { key: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g., 120/80 mmHg', type: 'text' },
    { key: 'heart_rate', label: 'Heart Rate', placeholder: 'e.g., 72 bpm', type: 'text' },
    { key: 'temperature', label: 'Temperature', placeholder: 'e.g., 36.5°C', type: 'text' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g., 65 kg', type: 'text' },
    { key: 'height', label: 'Height', placeholder: 'e.g., 165 cm', type: 'text' }
  ],
  obstetric: [
    { key: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g., 120/80 mmHg', type: 'text' },
    { key: 'heart_rate', label: 'Heart Rate', placeholder: 'e.g., 72 bpm', type: 'text' },
    { key: 'temperature', label: 'Temperature', placeholder: 'e.g., 36.5°C', type: 'text' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g., 65 kg', type: 'text' },
    { key: 'height', label: 'Height', placeholder: 'e.g., 165 cm', type: 'text' },
    { key: 'lmp', label: 'Last Menstrual Period (LMP)', placeholder: 'YYYY-MM-DD', type: 'date' },
    { key: 'edd', label: 'Estimated Due Date (EDD)', placeholder: 'YYYY-MM-DD', type: 'date' },
    { key: 'gravida', label: 'Gravida (G)', placeholder: 'e.g., G3', type: 'text' },
    { key: 'para', label: 'Para (P)', placeholder: 'e.g., P2', type: 'text' },
    { key: 'gestational_age', label: 'Gestational Age', placeholder: 'e.g., 24w 3d', type: 'text' },
    { key: 'fetal_heart_rate', label: 'Fetal Heart Rate', placeholder: 'e.g., 140 bpm', type: 'text' },
    { key: 'fundal_height', label: 'Fundal Height', placeholder: 'e.g., 24 cm', type: 'text' },
    { key: 'fetal_movement', label: 'Fetal Movement', placeholder: 'Active/Reduced/None', type: 'text' }
  ],
  full: [
    { key: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g., 120/80 mmHg', type: 'text' },
    { key: 'heart_rate', label: 'Heart Rate', placeholder: 'e.g., 72 bpm', type: 'text' },
    { key: 'temperature', label: 'Temperature', placeholder: 'e.g., 36.5°C', type: 'text' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g., 65 kg', type: 'text' },
    { key: 'height', label: 'Height', placeholder: 'e.g., 165 cm', type: 'text' },
    { key: 'respiratory_rate', label: 'Respiratory Rate', placeholder: 'e.g., 16/min', type: 'text' },
    { key: 'oxygen_saturation', label: 'Oxygen Saturation', placeholder: 'e.g., 98%', type: 'text' }
  ]
};

// Completion Modal Field Definitions
export const COMPLETION_MODAL_FIELDS = {
  prenatal: {
    title: 'Complete Prenatal Care Appointment',
    sections: [
      {
        title: 'Prenatal Assessment',
        fields: [
          { key: 'prenatal_findings', label: 'Prenatal Findings', type: 'textarea', placeholder: 'Current pregnancy status, fetal development...' },
          { key: 'risk_assessment', label: 'Risk Assessment', type: 'textarea', placeholder: 'Any identified risks or concerns...' },
          { key: 'prenatal_education', label: 'Education Provided', type: 'textarea', placeholder: 'Topics discussed with patient...' }
        ]
      },
      {
        title: 'Next Steps',
        fields: [
          { key: 'next_visit_plan', label: 'Next Visit Plan', type: 'textarea', placeholder: 'Schedule for next prenatal visit...' },
          { key: 'next_visit_date', label: 'Next Visit Date', type: 'date' },
          { key: 'recommendations', label: 'Recommendations', type: 'textarea', placeholder: 'Dietary, lifestyle, medication recommendations...' }
        ]
      }
    ]
  },
  family_planning: {
    title: 'Complete Family Planning Consultation',
    sections: [
      {
        title: 'Family Planning Assessment',
        fields: [
          { key: 'contraceptive_method', label: 'Contraceptive Method Discussed', type: 'select', options: ['Pills', 'IUD', 'Implant', 'Injection', 'Condoms', 'Natural Methods', 'Other'] },
          { key: 'method_chosen', label: 'Method Chosen', type: 'text', placeholder: 'Selected contraceptive method...' },
          { key: 'counseling_provided', label: 'Counseling Provided', type: 'textarea', placeholder: 'Topics discussed during counseling...' }
        ]
      },
      {
        title: 'Follow-up',
        fields: [
          { key: 'follow_up_needed', label: 'Follow-up Required', type: 'select', options: ['Yes', 'No'] },
          { key: 'follow_up_plan', label: 'Follow-up Plan', type: 'textarea', placeholder: 'When and why follow-up is needed...' }
        ]
      }
    ]
  },
  lab_results: {
    title: 'Add New Lab Result',
    description: 'Enter detailed laboratory test data to add to the patient\'s medical record.',
    sections: [
      {
        title: 'Test Information',
        fields: [
          { key: 'test_type', label: 'Test Type', type: 'text', placeholder: 'e.g., CBC, Urinalysis, Blood Sugar, Pregnancy Test' },
          { key: 'test_category', label: 'Category', type: 'select', options: ['Blood Test', 'Urine Test', 'Cervical Screening', 'Pregnancy Test', 'Ultrasound', 'Imaging', 'General Screening', 'Other'] },
          { key: 'test_date', label: 'Test Date', type: 'date' }
        ]
      },
      {
        title: 'Results',
        fields: [
          { key: 'result_value', label: 'Result Value', type: 'text', placeholder: 'Enter test result value' },
          { key: 'normal_range', label: 'Normal Range', type: 'text', placeholder: 'e.g., 70-100' },
          { key: 'unit', label: 'Unit', type: 'text', placeholder: 'e.g., mg/dL' },
          { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed', 'Abnormal', 'Critical'] }
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { key: 'interpretation', label: 'Interpretation', type: 'textarea', placeholder: 'Clinical interpretation of results...' },
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes or observations...' }
        ]
      }
    ]
  },
  immunizations: {
    title: 'Complete Immunization Appointment',
    description: 'Document the immunization session and provide guidance for future vaccinations.',
    sections: [
      {
        title: 'Immunization Record',
        fields: [
          { key: 'vaccines_given', label: 'Vaccines Administered', type: 'textarea', placeholder: 'List of vaccines given during this appointment...' },
          { key: 'batch_numbers', label: 'Batch/Lot Numbers', type: 'textarea', placeholder: 'Vaccine batch numbers for documentation...' },
          { key: 'adverse_reactions', label: 'Adverse Reactions', type: 'textarea', placeholder: 'Any immediate reactions observed during visit...' }
        ]
      },
      {
        title: 'Next Immunizations',
        fields: [
          { key: 'next_vaccines_due', label: 'Next Vaccines Due', type: 'textarea', placeholder: 'Upcoming immunizations scheduled and discussed...' },
          { key: 'next_visit_date', label: 'Next Visit Date', type: 'date', placeholder: 'When to return for next vaccines...' }
        ]
      }
    ]
  },
  screening: {
    title: 'Complete Screening Appointment',
    description: 'Document the screening results and provide recommendations based on findings.',
    sections: [
      {
        title: 'Screening Results',
        fields: [
          { key: 'screening_type', label: 'Type of Screening', type: 'text', placeholder: 'e.g., Cervical cancer, Breast cancer, Diabetes screening...' },
          { key: 'screening_results', label: 'Screening Results', type: 'textarea', placeholder: 'Results of screening tests performed during visit...' },
          { key: 'risk_factors', label: 'Risk Factors Identified', type: 'textarea', placeholder: 'Any risk factors discussed with patient...' }
        ]
      },
      {
        title: 'Follow-up Plan',
        fields: [
          { key: 'follow_up_screening', label: 'Next Screening Due', type: 'date', placeholder: 'When next screening is recommended...' },
          { key: 'recommendations', label: 'Recommendations', type: 'textarea', placeholder: 'Lifestyle or medical recommendations discussed...' }
        ]
      }
    ]
  },
  medical_procedures: {
    title: 'Complete Medical Procedure',
    sections: [
      {
        title: 'Procedure Details',
        fields: [
          { key: 'procedure_performed', label: 'Procedure Performed', type: 'text', placeholder: 'Name of procedure...' },
          { key: 'procedure_outcome', label: 'Procedure Outcome', type: 'textarea', placeholder: 'Results and success of procedure...' },
          { key: 'complications', label: 'Complications', type: 'textarea', placeholder: 'Any complications during procedure...' }
        ]
      },
      {
        title: 'Post-Procedure Care',
        fields: [
          { key: 'post_procedure_instructions', label: 'Post-Procedure Instructions', type: 'textarea', placeholder: 'Care instructions for patient...' },
          { key: 'follow_up_required', label: 'Follow-up Required', type: 'select', options: ['Yes', 'No'] },
          { key: 'follow_up_timeline', label: 'Follow-up Timeline', type: 'text', placeholder: 'When to return for follow-up...' }
        ]
      }
    ]
  },
  postpartum: {
    title: 'Complete Postpartum Care',
    sections: [
      {
        title: 'Postpartum Assessment',
        fields: [
          { key: 'delivery_date', label: 'Delivery Date', type: 'date', placeholder: 'Date of delivery...' },
          { key: 'postpartum_findings', label: 'Postpartum Findings', type: 'textarea', placeholder: 'Physical examination findings...' },
          { key: 'breastfeeding_status', label: 'Breastfeeding Status', type: 'select', options: ['Exclusively breastfeeding', 'Mixed feeding', 'Formula feeding', 'Not applicable'] }
        ]
      },
      {
        title: 'Care Plan',
        fields: [
          { key: 'postpartum_education', label: 'Education Provided', type: 'textarea', placeholder: 'Topics discussed with patient...' },
          { key: 'family_planning_discussed', label: 'Family Planning Discussed', type: 'select', options: ['Yes', 'No'] },
          { key: 'next_visit_plan', label: 'Next Visit Plan', type: 'textarea', placeholder: 'Follow-up care plan...' }
        ]
      }
    ]
  },
  general: {
    title: 'Complete General Consultation',
    sections: [
      {
        title: 'General Assessment',
        fields: [
          { key: 'chief_complaint', label: 'Chief Complaint', type: 'textarea', placeholder: 'Main reason for visit...' },
          { key: 'diagnosis', label: 'Diagnosis', type: 'textarea', placeholder: 'Clinical diagnosis...' },
          { key: 'treatment_given', label: 'Treatment Given', type: 'textarea', placeholder: 'Medications, procedures, treatments...' }
        ]
      },
      {
        title: 'Follow-up',
        fields: [
          { key: 'recommendations', label: 'Recommendations', type: 'textarea', placeholder: 'Follow-up care, lifestyle changes...' },
          { key: 'next_appointment_suggestion', label: 'Next Appointment', type: 'text', placeholder: 'When to return if needed...' }
        ]
      }
    ]
  },
  birth_plan: {
    title: 'Complete Birth Plan Consultation',
    description: 'Document the birth plan details including partner info, emergency contacts, and delivery checklist.',
    sections: [
      {
        title: 'Partner & Support Person',
        fields: [
          { key: 'partner_name', label: 'Partner/Support Person Name', type: 'text', placeholder: 'Name of partner or support person...' },
          { key: 'partner_phone', label: 'Partner Phone Number', type: 'text', placeholder: 'Contact number...' }
        ]
      },
      {
        title: 'Emergency & Transport',
        fields: [
          { key: 'transport_mode', label: 'Mode of Transport to Facility', type: 'select', options: ['Private Vehicle', 'Public Transport', 'Ambulance', 'Walking', 'Other'] },
          { key: 'emergency_facility', label: 'Emergency Facility', type: 'text', placeholder: 'Preferred hospital or birthing facility...' }
        ]
      },
      {
        title: 'Blood Donor Information',
        fields: [
          { key: 'donor_name', label: 'Blood Donor Name', type: 'text', placeholder: 'Name of potential blood donor...' },
          { key: 'donor_phone', label: 'Blood Donor Phone', type: 'text', placeholder: 'Donor contact number...' }
        ]
      },
      {
        title: 'Status & Checklist',
        fields: [
          { key: 'philhealth_status', label: 'PhilHealth Status', type: 'select', options: ['Active Member', 'Dependent', 'Indigent', 'Not Enrolled'] },
          { key: 'married', label: 'Marital Status', type: 'select', options: ['Married', 'Single', 'Widowed', 'Separated'] },
          { key: 'checklist_mother', label: 'Mother\'s Checklist Items', type: 'textarea', placeholder: 'Items prepared for mother (clothes, toiletries, documents)...' },
          { key: 'checklist_baby', label: 'Baby\'s Checklist Items', type: 'textarea', placeholder: 'Items prepared for baby (clothes, diapers, blankets)...' }
        ]
      },
      {
        title: 'Consent',
        fields: [
          { key: 'consent_signed', label: 'Consent Signed', type: 'select', options: ['Yes', 'No'] },
          { key: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any additional notes or special requests...' }
        ]
      }
    ]
  }
};

// Helper function to get service category from service name
export const getServiceCategory = (serviceName, services = []) => {
  const service = services.find(s => s.name === serviceName);
  if (service && service.category) return service.category;
  const n = String(serviceName || '').toLowerCase();
  if (n.includes('birth') && n.includes('plan')) return 'birth_plan';
  if (n.includes('prenatal')) return 'prenatal_care';
  if (n.includes('postpartum')) return 'postpartum';
  if (n.includes('immun')) return 'immunizations';
  if (n.includes('screen')) return 'screening';
  if (n.includes('ultrasound') || n.includes('imaging') || n.includes('pregnancy test') || n.includes('lab')) return 'lab_results';
  if (n.includes('procedure')) return 'medical_procedures';
  return 'general';
};

// Helper function to get category configuration
export const getCategoryConfig = (category) => {
  return SERVICE_CATEGORIES[category] || SERVICE_CATEGORIES.general;
};

// Helper function to get required vital signs fields for a category
export const getRequiredVitalSigns = (category) => {
  const config = getCategoryConfig(category);
  if (!config.requiresVitalSigns) return [];

  const fields = VITAL_SIGNS_FIELDS[config.vitalSignsType] || [];
  return fields.filter(field => config.requiredFields.includes(field.key));
};

// Helper function to get all vital signs fields for a category
export const getAllVitalSigns = (category) => {
  const config = getCategoryConfig(category);
  if (!config.requiresVitalSigns) return [];

  return VITAL_SIGNS_FIELDS[config.vitalSignsType] || [];
};

// Helper function to validate required fields
export const validateRequiredFields = (category, vitalSigns, completionData) => {
  const config = getCategoryConfig(category);
  const errors = [];

  // Check required vital signs
  if (config.requiresVitalSigns) {
    config.requiredFields.forEach(field => {
      if (!vitalSigns[field] || vitalSigns[field].trim() === '') {
        const fieldConfig = getAllVitalSigns(category).find(f => f.key === field);
        errors.push(`${fieldConfig?.label || field} is required`);
      }
    });
  }

  return errors;
};
