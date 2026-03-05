// Simple PDF Generation using browser's print functionality
// This creates a printable/exportable version without external dependencies

export const generateMedicalRecordHTML = (patientData, medicalRecords, logoUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Medical Records - ${patientData.name || 'Patient'}</title>
        <meta charset="utf-8" />
        <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111; }
            .header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
            .logo-box { width: 24mm; height: 24mm; display: flex; align-items: center; justify-content: center; background: #111; border-radius: 2mm; }
            .logo { width: 22mm; height: 22mm; object-fit: contain; }
            .clinic { font-weight: 700; font-size: 12pt; }
            .sub { font-size: 10pt; color: #555; }
            .title { font-weight: 700; text-align: center; margin: 6mm 0 4mm; }
            .panel { border: 1px solid #999; padding: 8px; margin-bottom: 8px; }
            .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
            .label { font-weight: 700; color: #000; white-space: nowrap; }
            .value { color: #000; font-weight: 700; }
            .box { border: 1px solid #aaa; padding: 6px; white-space: pre-line; }
        </style>
    </head>
    <body>
        <div class="header">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class="clinic">N.B. SEGOROYNE LYING-IN CLINIC</div><div class="sub">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class="sub">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div>
        <div class="title">MEDICAL RECORDS</div>

        <div class="panel">
          <div class="row-2"><div><span class="label">Patient:</span> <span class="value">${patientData.name || 'N/A'}</span></div><div><span class="label">Age/Gender:</span> <span class="value">${patientData.age || ''} ${patientData.gender ? '/ ' + patientData.gender : ''}</span></div></div>
          <div class="row-2"><div><span class="label">Contact:</span> <span class="value">${patientData.phone || 'N/A'}</span></div><div><span class="label">Email:</span> <span class="value">${patientData.email || 'N/A'}</span></div></div>
          <div><span class="label">Address:</span> <span class="value">${patientData.address || 'N/A'}</span></div>
        </div>

        ${medicalRecords.map(record => `
          <div class="panel">
            <div class="row-2"><div><span class="label">Date:</span> <span class="value">${new Date(record.appointment_date).toLocaleDateString()}</span></div><div><span class="label">Service:</span> <span class="value">${record.service_type || 'General Consultation'}</span></div></div>
            <div class="row-2">
              <div>
                ${record.doctor_notes ? `<div class="label">Doctor's Notes</div><div class="box">${record.doctor_notes}</div>` : ''}
                ${record.diagnosis ? `<div class="label">Diagnosis</div><div class="box">${record.diagnosis}</div>` : ''}
                ${record.treatment_given ? `<div class="label">Treatment Given</div><div class="box">${record.treatment_given}</div>` : ''}
              </div>
              <div>
                ${record.recommendations ? `<div class="label">Recommendations</div><div class="box">${record.recommendations}</div>` : ''}
                ${record.next_appointment_suggestion ? `<div class="label">Next Appointment</div><div class="box">${record.next_appointment_suggestion}</div>` : ''}
                ${record.vital_signs && Object.values(record.vital_signs).some(v => v) ? `
                  <div class="label">Vital Signs</div>
                  <div class="box">
                    ${record.vital_signs.blood_pressure ? `Blood Pressure: ${record.vital_signs.blood_pressure}\n` : ''}
                    ${record.vital_signs.heart_rate ? `Heart Rate: ${record.vital_signs.heart_rate}\n` : ''}
                    ${record.vital_signs.temperature ? `Temperature: ${record.vital_signs.temperature}\n` : ''}
                    ${record.vital_signs.weight ? `Weight: ${record.vital_signs.weight}\n` : ''}
                    ${record.vital_signs.height ? `Height: ${record.vital_signs.height}\n` : ''}
                    ${record.vital_signs.gravida || record.vital_signs.para ? `Gravida/Para: ${record.vital_signs.gravida || 0}/${record.vital_signs.para || 0}\n` : ''}
                    ${record.vital_signs.gestational_age ? `Gestational Age: ${record.vital_signs.gestational_age}\n` : ''}
                    ${record.vital_signs.lmp ? `LMP: ${new Date(record.vital_signs.lmp).toLocaleDateString()}\n` : ''}
                    ${record.vital_signs.edd ? `EDD: ${new Date(record.vital_signs.edd).toLocaleDateString()}\n` : ''}
                    ${record.vital_signs.fetal_heart_rate ? `Fetal Heart Rate: ${record.vital_signs.fetal_heart_rate}\n` : ''}
                    ${record.vital_signs.fundal_height ? `Fundal Height: ${record.vital_signs.fundal_height}\n` : ''}
                    ${record.vital_signs.fetal_movement ? `Fetal Movement: ${record.vital_signs.fetal_movement}\n` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
    </body>
    </html>
  `;
  return html;
};

export const generateSingleMedicalRecordHTML = (patientData, medicalRecord, logoUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Medical Record - ${patientData.name || 'Patient'} - ${(() => { const d = medicalRecord.appointment_date || medicalRecord.test_date || medicalRecord.screening_date || medicalRecord.date_given || medicalRecord.date_performed || medicalRecord.next_appointment || medicalRecord.follow_up_date; try { const dt = new Date(d); return !d || Number.isNaN(dt.getTime()) ? String(d || '') : dt.toLocaleDateString(); } catch { return String(d || ''); } })()}</title>
        <meta charset="utf-8" />
        <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111; }
            .header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
            .logo-box { width: 24mm; height: 24mm; display: flex; align-items: center; justify-content: center; background: #111; border-radius: 2mm; }
            .logo { width: 22mm; height: 22mm; object-fit: contain; }
            .clinic { font-weight: 700; font-size: 12pt; }
            .sub { font-size: 10pt; color: #555; }
            .title { font-weight: 700; text-align: center; margin: 6mm 0 4mm; }
            .panel { border: 1px solid #999; padding: 8px; margin-bottom: 8px; }
            .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
            .label { font-weight: 700; color: #000; white-space: nowrap; }
            .value { color: #000; font-weight: 700; }
            .box { border: 1px solid #aaa; padding: 6px; white-space: pre-line; }
        </style>
    </head>
    <body>
        <div class="header">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class="clinic">N.B. SEGOROYNE LYING-IN CLINIC</div><div class="sub">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class="sub">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div>
        <div class="title">MEDICAL RECORD</div>

        <div class="panel">
          <div class="row-2"><div><span class="label">Patient:</span> <span class="value">${patientData.name || 'N/A'}</span></div><div><span class="label">Age/Gender:</span> <span class="value">${patientData.age || ''} ${patientData.gender ? '/ ' + patientData.gender : ''}</span></div></div>
          <div class="row-2"><div><span class="label">Contact:</span> <span class="value">${patientData.phone || 'N/A'}</span></div><div><span class="label">Email:</span> <span class="value">${patientData.email || 'N/A'}</span></div></div>
          <div><span class="label">Address:</span> <span class="value">${patientData.address || 'N/A'}</span></div>
        </div>

        <div class="panel">
          <div class="row-2"><div><span class="label">Date:</span> <span class="value">${(() => { const d = medicalRecord.appointment_date || medicalRecord.test_date || medicalRecord.screening_date || medicalRecord.date_given || medicalRecord.date_performed || medicalRecord.next_appointment || medicalRecord.follow_up_date; try { const dt = new Date(d); return !d || Number.isNaN(dt.getTime()) ? String(d || '') : dt.toLocaleDateString(); } catch { return String(d || ''); } })()}</span></div><div><span class="label">Service:</span> <span class="value">${medicalRecord.service_type || 'General Consultation'}</span></div></div>
          <div class="row-2">
            <div>
              ${medicalRecord.doctor_notes ? `<div class="label">Doctor's Notes</div><div class="box">${medicalRecord.doctor_notes}</div>` : ''}
              ${medicalRecord.diagnosis ? `<div class="label">Diagnosis</div><div class="box">${medicalRecord.diagnosis}</div>` : ''}
              ${medicalRecord.treatment_given ? `<div class="label">Treatment Given</div><div class="box">${medicalRecord.treatment_given}</div>` : ''}
              ${medicalRecord.test_name ? `<div class="label">Test Name</div><div class="box">${medicalRecord.test_name}</div>` : (medicalRecord.test_type ? `<div class="label">Test Name</div><div class="box">${medicalRecord.test_type}</div>` : '')}
              ${typeof medicalRecord.result !== 'undefined' ? `<div class="label">Result</div><div class="box">${medicalRecord.result}</div>` : ((typeof medicalRecord.result_value !== 'undefined' || medicalRecord.unit) ? `<div class="label">Result</div><div class="box">${medicalRecord.result_value || ''}${medicalRecord.unit ? ' ' + medicalRecord.unit : ''}</div>` : '')}
              ${medicalRecord.reference_range ? `<div class="label">Reference Range</div><div class="box">${medicalRecord.reference_range}</div>` : ''}
              ${medicalRecord.status ? `<div class="label">Status</div><div class="box">${medicalRecord.status}</div>` : ''}
              ${medicalRecord.test_category ? `<div class="label">Category</div><div class="box">${medicalRecord.test_category}</div>` : ''}
              ${medicalRecord.notes ? `<div class="label">Notes</div><div class="box">${medicalRecord.notes}</div>` : ''}
              ${medicalRecord.lab_name ? `<div class="label">Lab Name</div><div class="box">${medicalRecord.lab_name}</div>` : ''}
              ${medicalRecord.ordered_by ? `<div class="label">Ordered By</div><div class="box">${medicalRecord.ordered_by}</div>` : ''}
              ${medicalRecord.screening_type ? `<div class="label">Screening Type</div><div class="box">${medicalRecord.screening_type}</div>` : ''}
              ${medicalRecord.risk_level ? `<div class="label">Risk Level</div><div class="box">${medicalRecord.risk_level}</div>` : ''}
              ${medicalRecord.next_screening_date ? `<div class="label">Next Screening Due</div><div class="box">${(() => { try { const dt = new Date(medicalRecord.next_screening_date); return Number.isNaN(dt.getTime()) ? String(medicalRecord.next_screening_date) : dt.toLocaleDateString(); } catch { return String(medicalRecord.next_screening_date); } })()}</div>` : ''}
              ${medicalRecord.recommendations ? `<div class="label">Recommendations</div><div class="box">${medicalRecord.recommendations}</div>` : ''}
              ${medicalRecord.healthcare_provider ? `<div class="label">Healthcare Provider</div><div class="box">${medicalRecord.healthcare_provider}</div>` : ''}
              ${medicalRecord.lab_name ? `<div class="label">Lab Name</div><div class="box">${medicalRecord.lab_name}</div>` : ''}
              ${medicalRecord.interpretation ? `<div class="label">Interpretation</div><div class="box">${medicalRecord.interpretation}</div>` : ''}
              ${(typeof medicalRecord.follow_up_required !== 'undefined') ? `<div class="label">Follow-up Required</div><div class="box">${medicalRecord.follow_up_required ? 'Yes' : 'No'}</div>` : ''}
              ${medicalRecord.follow_up_date ? `<div class="label">Follow-up Date</div><div class="box">${(() => { try { const dt = new Date(medicalRecord.follow_up_date); return Number.isNaN(dt.getTime()) ? String(medicalRecord.follow_up_date) : dt.toLocaleDateString(); } catch { return String(medicalRecord.follow_up_date); } })()}</div>` : ''}
              ${medicalRecord.equipment_used ? `<div class="label">Equipment Used</div><div class="box">${medicalRecord.equipment_used}</div>` : ''}
              ${(medicalRecord.test_location) ? `<div class="label">Test Location</div><div class="box">${medicalRecord.test_location}</div>` : ''}
            </div>
            <div>
              ${medicalRecord.procedure_name ? `<div class="label">Procedure Name</div><div class="box">${medicalRecord.procedure_name}</div>` : ''}
              ${medicalRecord.description ? `<div class="label">Description</div><div class="box">${medicalRecord.description}</div>` : ''}
              ${medicalRecord.outcome ? `<div class="label">Outcome</div><div class="box">${medicalRecord.outcome}</div>` : ''}
              ${medicalRecord.complications ? `<div class="label">Complications</div><div class="box">${medicalRecord.complications}</div>` : ''}
              ${medicalRecord.healthcare_provider ? `<div class="label">Healthcare Provider</div><div class="box">${medicalRecord.healthcare_provider}</div>` : ''}
              ${medicalRecord.location ? `<div class="label">Location</div><div class="box">${medicalRecord.location}</div>` : ''}
              ${(typeof medicalRecord.duration_minutes !== 'undefined') ? `<div class="label">Duration (minutes)</div><div class="box">${medicalRecord.duration_minutes}</div>` : ''}
              ${medicalRecord.anesthesia_type ? `<div class="label">Anesthesia Type</div><div class="box">${medicalRecord.anesthesia_type}</div>` : ''}
              ${(typeof medicalRecord.follow_up_required !== 'undefined') ? `<div class="label">Follow-up Required</div><div class="box">${medicalRecord.follow_up_required ? 'Yes' : 'No'}</div>` : ''}
              ${medicalRecord.next_appointment ? `<div class="label">Next Appointment</div><div class="box">${(() => { try { const dt = new Date(medicalRecord.next_appointment); return Number.isNaN(dt.getTime()) ? String(medicalRecord.next_appointment) : dt.toLocaleDateString(); } catch { return String(medicalRecord.next_appointment); } })()}</div>` : ''}
              ${medicalRecord.notes ? `<div class="label">Notes</div><div class="box">${medicalRecord.notes}</div>` : ''}
              ${(typeof medicalRecord.cost !== 'undefined') ? `<div class="label">Cost</div><div class="box">${medicalRecord.cost}</div>` : ''}
              ${(typeof medicalRecord.insurance_covered !== 'undefined') ? `<div class="label">Insurance Covered</div><div class="box">${medicalRecord.insurance_covered ? 'Yes' : 'No'}</div>` : ''}
              ${(medicalRecord.vaccine_name || medicalRecord.vaccine_type) ? `<div class="label">Vaccine Name</div><div class="box">${medicalRecord.vaccine_name || medicalRecord.vaccine_type}</div>` : ''}
              ${typeof medicalRecord.dose_number !== 'undefined' ? `<div class="label">Dose Number</div><div class="box">${medicalRecord.dose_number}</div>` : ''}
              ${medicalRecord.lot_number ? `<div class="label">Lot Number</div><div class="box">${medicalRecord.lot_number}</div>` : ''}
              ${medicalRecord.manufacturer ? `<div class="label">Manufacturer</div><div class="box">${medicalRecord.manufacturer}</div>` : ''}
              ${medicalRecord.healthcare_provider ? `<div class="label">Healthcare Provider</div><div class="box">${medicalRecord.healthcare_provider}</div>` : ''}
              ${medicalRecord.batch_number ? `<div class="label">Batch Number</div><div class="box">${medicalRecord.batch_number}</div>` : ''}
              ${(medicalRecord.site_given || medicalRecord.injection_site) ? `<div class="label">Site Given</div><div class="box">${medicalRecord.site_given || medicalRecord.injection_site}</div>` : ''}
              ${(medicalRecord.next_dose_due || medicalRecord.next_due_date) ? `<div class="label">Next Dose Due</div><div class="box">${(() => { const d = medicalRecord.next_dose_due || medicalRecord.next_due_date; try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(); } catch { return String(d); } })()}</div>` : ''}
              ${(medicalRecord.reactions || medicalRecord.adverse_reactions) ? `<div class="label">Reactions</div><div class="box">${medicalRecord.reactions || medicalRecord.adverse_reactions}</div>` : ''}
              ${medicalRecord.gestational_age ? `<div class="label">Gestational Age</div><div class="box">${medicalRecord.gestational_age}</div>` : ''}
              ${medicalRecord.next_visit_date ? `<div class="label">Next Visit</div><div class="box">${(() => { try { const dt = new Date(medicalRecord.next_visit_date); return Number.isNaN(dt.getTime()) ? String(medicalRecord.next_visit_date) : dt.toLocaleDateString(); } catch { return String(medicalRecord.next_visit_date); } })()}</div>` : ''}
              ${medicalRecord.assessment ? `<div class="label">Assessment</div><div class="box">${medicalRecord.assessment}</div>` : ''}
              ${medicalRecord.plan ? `<div class="label">Plan</div><div class="box">${medicalRecord.plan}</div>` : ''}
              ${medicalRecord.assessment_notes ? `<div class="label">Assessment Notes</div><div class="box">${medicalRecord.assessment_notes}</div>` : ''}
              ${medicalRecord.recovery_status ? `<div class="label">Recovery Status</div><div class="box">${medicalRecord.recovery_status}</div>` : ''}
              ${medicalRecord.follow_up_plan ? `<div class="label">Follow-up Plan</div><div class="box">${medicalRecord.follow_up_plan}</div>` : ''}
              ${medicalRecord.method_chosen ? `<div class="label">Method Chosen</div><div class="box">${medicalRecord.method_chosen}</div>` : ''}
              ${medicalRecord.method_category ? `<div class="label">Method Category</div><div class="box">${medicalRecord.method_category}</div>` : ''}
              ${medicalRecord.method_started_date ? `<div class="label">Started Date</div><div class="box">${(() => { try { const dt = new Date(medicalRecord.method_started_date); return Number.isNaN(dt.getTime()) ? String(medicalRecord.method_started_date) : dt.toLocaleDateString(); } catch { return String(medicalRecord.method_started_date); } })()}</div>` : ''}
              ${typeof medicalRecord.counseling_done !== 'undefined' ? `<div class="label">Counseling Done</div><div class="box">${medicalRecord.counseling_done ? 'Yes' : 'No'}</div>` : ''}
              ${medicalRecord.follow_up_date ? `<div class="label">Follow-up Date</div><div class="box">${(() => { try { const dt = new Date(medicalRecord.follow_up_date); return Number.isNaN(dt.getTime()) ? String(medicalRecord.follow_up_date) : dt.toLocaleDateString(); } catch { return String(medicalRecord.follow_up_date); } })()}</div>` : ''}
              ${(medicalRecord.first_name || medicalRecord.last_name) ? `<div class="label">Baby Name</div><div class="box">${[medicalRecord.first_name, medicalRecord.middle_name, medicalRecord.last_name].filter(Boolean).join(' ')}</div>` : ''}
              ${typeof medicalRecord.weight_kg !== 'undefined' ? `<div class="label">Weight</div><div class="box">${medicalRecord.weight_kg} kg</div>` : ''}
              ${typeof medicalRecord.length_cm !== 'undefined' ? `<div class="label">Length</div><div class="box">${medicalRecord.length_cm} cm</div>` : ''}
              ${typeof medicalRecord.head_circumference_cm !== 'undefined' ? `<div class="label">Head Circumference</div><div class="box">${medicalRecord.head_circumference_cm} cm</div>` : ''}
              ${medicalRecord.feeding_type ? `<div class="label">Feeding Type</div><div class="box">${medicalRecord.feeding_type}</div>` : ''}
            </div>
          </div>
        </div>
    </body>
    </html>
  `;

  return html;
};

export const downloadHTMLAsPDF = (html, filename) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    try { document.body.removeChild(iframe); } catch (e) { void e }
    try { window.focus && window.focus(); } catch (e) { void e }
    try { window.dispatchEvent && window.dispatchEvent(new Event('focus')); } catch (e) { void e }
    try { window.dispatchEvent && window.dispatchEvent(new Event('afterprint')); } catch (e) { void e }
  };

  if (iframe.contentWindow && typeof iframe.contentWindow.addEventListener === 'function') {
    iframe.contentWindow.addEventListener('afterprint', cleanup);
    iframe.contentWindow.addEventListener('beforeunload', cleanup);
  }

  const onReady = () => {
    try { doc.title = filename; } catch (e) { void e }
    const imgs = Array.from(doc.images || []);
    let remaining = imgs.filter(img => !img.complete).length;
    const trigger = () => {
      try {
        iframe.contentWindow && iframe.contentWindow.focus && iframe.contentWindow.focus();
        iframe.contentWindow && iframe.contentWindow.print && iframe.contentWindow.print();
      } catch (e) { void e }
    };
    if (!imgs.length) { setTimeout(trigger, 200); return; }
    const tryPrint = () => {
      remaining -= 1;
      if (remaining <= 0) setTimeout(trigger, 200);
    };
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener('load', tryPrint, { once: true });
      img.addEventListener('error', tryPrint, { once: true });
    });
    if (remaining === 0) setTimeout(trigger, 200);
  };

  if (doc.readyState === 'complete') onReady();
  else iframe.onload = onReady;
};

export const generateAppointmentReportHTML = (appointments, filters = {}) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Appointment History Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2563eb; color: white; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .summary { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .summary h3 { color: #1e40af; margin-top: 0; }
            @media print { body { margin: 20px; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Appointment History Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary">
            <h3>Report Summary</h3>
            <p><strong>Total Appointments:</strong> ${appointments.length}</p>
            <p><strong>Date Range:</strong> ${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'}</p>
            ${filters.status ? `<p><strong>Status Filter:</strong> ${filters.status}</p>` : ''}
        </div>

        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Request Status</th>
                    <th>Appointment Status</th>
                </tr>
            </thead>
            <tbody>
                ${appointments.map(apt => `
                    <tr>
                        <td>${new Date(apt.date).toLocaleDateString()}</td>
                        <td>${apt.time_slot}</td>
                        <td>${apt.patient_name}</td>
                        <td>${apt.service_type}</td>
                        <td>${apt.request_status}</td>
                        <td>${apt.appointment_status || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>
  `;

  return html;
};

export const generatePrenatalBookletHTML = (patientData, visits = [], logoUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Prenatal Booklet - ${patientData.name || ''}</title>
        <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, Helvetica, sans-serif; color: #111; }
            .header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
            .logo-box { width: 24mm; height: 24mm; display: flex; align-items: center; justify-content: center; background: #111; border-radius: 2mm; }
            .logo { width: 22mm; height: 22mm; object-fit: contain; }
            .clinic { font-weight: 700; font-size: 12pt; }
            .sub { font-size: 10pt; color: #555; }
            .title { font-weight: 700; text-align: center; margin: 6mm 0 4mm; }
            .patient { border: 1px solid #999; padding: 8px; border-radius: 3px; margin-bottom: 8px; }
            .card { border: 1px solid #999; border-radius: 3px; padding: 8px; margin: 8px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .field { margin-bottom: 6px; }
            .label { font-weight: 700; color: #000; }
            .box { min-height: 48px; border: 1px solid #aaa; border-radius: 3px; padding: 8px; background: #fafafa; white-space: pre-line; }
            .footer { margin-top: 12px; text-align: center; color: #6b7280; }
            @media print { .card { page-break-inside: avoid; } }
        </style>
    </head>
    <body>
        <div class="header">${logoUrl ? `<div class='logo-box'><img class='logo' src='${logoUrl}'/></div>` : ''}<div><div class="clinic">N.B. SEGOROYNE LYING-IN CLINIC</div><div class="sub">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div><div class="sub">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div></div></div>
        <div class="title">PRENATAL VISIT RECORD</div>
        <div class="patient">
            <div><strong>Patient:</strong> ${patientData.name || 'N/A'}</div>
            <div><strong>Phone:</strong> ${patientData.phone || 'N/A'}</div>
            ${(() => { try { return patientData.lmp ? `<div><strong>LMP:</strong> ${(() => { const d = new Date(patientData.lmp); return Number.isNaN(d.getTime()) ? String(patientData.lmp) : d.toLocaleDateString(); })()}</div>` : ''; } catch { return patientData.lmp ? `<div><strong>LMP:</strong> ${String(patientData.lmp)}</div>` : ''; } })()}
            ${(() => { try { return patientData.edd ? `<div><strong>EDD:</strong> ${(() => { const d = new Date(patientData.edd); return Number.isNaN(d.getTime()) ? String(patientData.edd) : d.toLocaleDateString(); })()}</div>` : ''; } catch { return patientData.edd ? `<div><strong>EDD:</strong> ${String(patientData.edd)}</div>` : ''; } })()}
            ${(() => { const g = patientData.gravida; const p = patientData.para; return (typeof g !== 'undefined' || typeof p !== 'undefined') ? `<div><strong>Gravida/Para:</strong> ${(g ?? '')}/${(p ?? '')}</div>` : '' })()}
        </div>
        ${visits.map(v => `
          <div class="card">
            <div class="title">Visit #${v.visit_number || ''} ${v.trimester ? `(Trimester ${v.trimester})` : ''}</div>
            <div class="grid">
              <div class="field"><span class="label">Date of Visit:</span> ${(() => { const d = v.scheduled_date || v.visit_date || v.completed_date || v.appointment_date; try { const dt = new Date(d); return !d || Number.isNaN(dt.getTime()) ? String(d || '') : dt.toLocaleDateString(); } catch { return String(d || ''); } })()}</div>
              <div class="field"><span class="label">AOG (weeks):</span> ${v.gestational_age || v.aog || ''}</div>
              <div class="field"><span class="label">Weight:</span> ${(typeof v.weight_kg !== 'undefined' && v.weight_kg !== null)
      ? `${v.weight_kg} kg`
      : (typeof v.weight !== 'undefined' && v.weight !== null)
        ? `${v.weight} kg`
        : ''
    }</div>
              <div class="field"><span class="label">Blood Pressure:</span> ${v.blood_pressure || ''}</div>
              <div class="field"><span class="label">Fundal Height:</span> ${(typeof v.fundal_height_cm !== 'undefined' && v.fundal_height_cm !== null)
      ? `${v.fundal_height_cm} cm`
      : (typeof v.fundal_height !== 'undefined' && v.fundal_height !== null)
        ? `${v.fundal_height} cm`
        : ''
    }</div>
              <div class="field"><span class="label">Fetal Heart Rate:</span> ${(typeof v.fetal_heart_rate !== 'undefined' && v.fetal_heart_rate !== null)
      ? `${v.fetal_heart_rate} bpm`
      : ''
    }</div>
              ${typeof v.fetal_movement !== 'undefined' && v.fetal_movement !== '' ? `<div class="field"><span class="label">Fetal Movement:</span> ${v.fetal_movement}</div>` : ''}
              ${typeof v.temperature_c !== 'undefined' && v.temperature_c !== '' ? `<div class="field"><span class="label">Temperature:</span> ${v.temperature_c} °C</div>` : ''}
              ${typeof v.maternal_heart_rate !== 'undefined' && v.maternal_heart_rate !== '' ? `<div class="field"><span class="label">Maternal Heart Rate:</span> ${v.maternal_heart_rate} bpm</div>` : ''}
              ${typeof v.respiratory_rate !== 'undefined' && v.respiratory_rate !== '' ? `<div class="field"><span class="label">Respiratory Rate:</span> ${v.respiratory_rate} breaths/min</div>` : ''}
            </div>
            <div class="field"><span class="label">Symptoms:</span><div class="box">${v.complaints || v.visit_notes || v.notes || ''}</div></div>
            <div class="field"><span class="label">Essential PE findings:</span><div class="box">${v.visit_notes || v.assessment || ''}</div></div>
            <div class="field"><span class="label">Assessment:</span><div class="box">${v.assessment || v.visit_notes || ''}</div></div>
            <div class="field"><span class="label">Healthcare Professional Recommendations:</span><div class="box">${v.plan || v.follow_up_plan || ''}</div></div>
            <div class="field"><span class="label">Schedule of Next Visit:</span> ${v.next_visit_date
      ? new Date(v.next_visit_date).toLocaleDateString()
      : (v.follow_up_date ? new Date(v.follow_up_date).toLocaleDateString() : '')
    }</div>
          </div>
        `).join('')}
        <div class="footer">This printable booklet mirrors clinic prenatal cards using system data.</div>
    </body>
    </html>
  `;
  return html;
};

export const generateAdmissionFormHTML = (admissionData, patientData = {}, prenatalData = {}, logoUrl) => {
  const lastName = (patientData.last_name || '').trim();
  const firstName = (patientData.first_name || '').trim();
  const middleName = (patientData.middle_name || '').trim();
  const admittedAt = admissionData.admitted_at ? new Date(admissionData.admitted_at) : null;
  const dateStr = admittedAt ? admittedAt.toLocaleDateString() : 'N/A';
  const timeStr = admittedAt ? admittedAt.toLocaleTimeString() : 'N/A';
  const complaints = admissionData.admission_reason || 'LABOR PAIN';
  const aog = prenatalData.aog || prenatalData.gestational_age || 'N/A';
  const bp = prenatalData.vitals?.blood_pressure || '';
  const hr = prenatalData.vitals?.heart_rate || '';
  const rr = prenatalData.vitals?.respiratory_rate || '';
  const temp = prenatalData.vitals?.temperature || '';
  const weight = prenatalData.vitals?.weight || '';
  const sex = (patientData.gender || admissionData.patient_gender || '').toString().toUpperCase();
  const civilStatus = (patientData.civil_status || (typeof patientData.married !== 'undefined' && patientData.married !== null ? (patientData.married ? 'MARRIED' : 'SINGLE') : ''));
  const allergies = admissionData.allergies || admissionData.patient_allergies || patientData.allergies || '';
  const dischargedAt = admissionData.discharged_at ? new Date(admissionData.discharged_at) : null;
  const dischargeDate = dischargedAt ? dischargedAt.toLocaleDateString() : '';
  const dischargeTime = dischargedAt ? dischargedAt.toLocaleTimeString() : '';
  const spouseName = patientData.partner_name || '';
  const spouseAge = patientData.partner_age || '';
  const spouseOccupation = patientData.partner_occupation || '';
  const spouseReligion = patientData.partner_religion || '';
  const clinicName = 'N.B. SEGOROYNE LYING-IN CLINIC';
  const defaultLogo = logoUrl || (typeof window !== 'undefined' ? `${window.location.origin}/vite.svg` : '');
  const religion = patientData.religion || '';
  const occupation = patientData.occupation || '';
  const placeOfBirth = patientData.place_of_birth || clinicName;
  const terminalNo = 'Terminal#578-1004';
  let dobStr = '';
  if (patientData.date_of_birth) {
    try { dobStr = new Date(patientData.date_of_birth).toLocaleDateString(); } catch { dobStr = String(patientData.date_of_birth); }
  }
  const ageDisplay = (patientData.age && String(patientData.age).trim() !== '') ? patientData.age : '';
  let physSkin = '';
  let physConjunctiva = '';
  let physBreast = '';
  let physAbdomen = '';
  let physExtremities = '';
  const parseNotes = (n) => {
    if (!n) return null;
    if (typeof n === 'string') {
      try { return JSON.parse(n); } catch { return null; }
    }
    return (typeof n === 'object') ? n : null;
  };
  const parsed = parseNotes(admissionData.notes);
  const pe = (parsed && parsed.physical_exam) ? parsed.physical_exam : {};
  physSkin = pe.skin || '';
  physConjunctiva = pe.conjunctiva || '';
  physBreast = pe.breast || '';
  physAbdomen = pe.abdomen || '';
  physExtremities = pe.extremities || '';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${clinicName} Admission Form</title>
        <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; font-size: 10pt; line-height: 1.1; }
            .sheet { width: 100%; min-height: calc(297mm - 16mm); }
            .header { display: flex; align-items: center; gap: 8px; }
            .logo-box { width: 20mm; height: 20mm; display:flex; align-items:center; justify-content:center; background:#111; border-radius:1mm; }
            .logo { width: 18mm; height: 18mm; object-fit: contain; }
            .clinic { font-weight: 700; font-size: 11pt; }
            .sub { font-size: 9pt; }
            .title { text-align: center; font-weight: 700; margin: 2mm 0 2mm; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            td { border-bottom: 1px solid #666; padding: 1.2mm; vertical-align: middle; }
            .label { font-weight: 700; color: #000; padding-right: 3mm; white-space: nowrap; text-transform: uppercase; }
            .value { color: #000; text-transform: none; font-weight: 700; }
            .tiny { font-size: 9.5pt; }
            .no-border td { border-bottom: none; }
            .mono { letter-spacing: 0.05mm; }
            .nowrap { white-space: nowrap; }
            .row-gap { height: 3mm; }
            .row-gap-lg { height: 4mm; }
        </style>
    </head>
    <body>
        <div class="sheet">
          <div class="header">
            ${logoUrl || defaultLogo ? `<div class="logo-box"><img class="logo" src="${logoUrl || defaultLogo}" alt=""/></div>` : '<div style="width:18mm;height:18mm"></div>'}
            <div>
              <div class="clinic">${clinicName}</div>
              <div class="sub">BLK12 LOT 9 BRGY. G. DE JESUS IN D.M.CAVITE</div>
              <div class="sub">Contact No.: (093) 382-54-81 / (0919) 646-24-53</div>
              <div class="sub">${terminalNo}</div>
            </div>
          </div>
          <div class="title">ADMISSION FORM</div>
          <table>
            <tr>
              <td style="width:22%"><span class="label">LAST NAME</span> <span class="value">${lastName}</span></td>
              <td style="width:22%"><span class="label">FIRST NAME</span> <span class="value">${firstName}</span></td>
              <td style="width:12%"><span class="label">M.I.</span> <span class="value">${middleName}</span></td>
              <td style="width:10%"><span class="label">AGE</span> <span class="value">${ageDisplay}</span></td>
              <td style="width:12%"><span class="label">SEX</span> <span class="value">${sex || ''}</span></td>
              <td style="width:22%"><span class="label">CIVIL STATUS</span> <span class="value">${civilStatus}</span></td>
            </tr>
            <tr>
              <td colspan="3"><span class="label">ADDRESS</span> <span class="value">${patientData.address || ''}</span></td>
              <td><span class="label">RELIGION</span> <span class="value">${religion}</span></td>
              <td colspan="2"><span class="label">OCCUPATION</span> <span class="value">${occupation}</span></td>
            </tr>
            <tr>
              <td colspan="3"><span class="label">DATE OF ADMISSION</span> <span class="value">${dateStr}</span></td>
              <td colspan="3"><span class="label">TIME OF ADMISSION</span> <span class="value">${timeStr}</span></td>
            </tr>
            <tr>
              <td colspan="3"><span class="label">PLACE OF BIRTH</span> <span class="value">${placeOfBirth}</span></td>
              <td colspan="3"><span class="label">DATE OF BIRTH</span> <span class="value">${dobStr}</span></td>
            </tr>
            <tr>
              <td colspan="3"><span class="label">NAME OF SPOUSE</span> <span class="value">${spouseName}</span></td>
              <td><span class="label">AGE</span> <span class="value">${spouseAge}</span></td>
              <td><span class="label">OCCUPATION</span> <span class="value">${spouseOccupation}</span></td>
              <td><span class="label">RELIGION</span> <span class="value">${spouseReligion}</span></td>
            </tr>
            <tr>
              <td style="width:16%"><span class="label">WEIGHT</span> <span class="value">${weight}</span></td>
              <td style="width:16%"><span class="label">BLOOD PRESSURE</span> <span class="value">${bp}</span></td>
              <td style="width:16%"><span class="label">TEMPERATURE</span> <span class="value">${temp}</span></td>
              <td style="width:16%"><span class="label">PULSE RATE</span> <span class="value">${hr}</span></td>
              <td style="width:16%"><span class="label">RESPIRATORY RATE</span> <span class="value">${rr}</span></td>
              <td style="width:20%"><span class="label"></span> <span class="value"></span></td>
            </tr>
            <tr>
              <td colspan="3"><span class="label">ADMITTING MOTHER</span> <span class="value">${admissionData.display_patient_name || [firstName, middleName, lastName].filter(Boolean).join(' ')}</span></td>
              <td colspan="3"><span class="label">ADMITTING STAFF</span> <span class="value"></span></td>
            </tr>
            <tr>
              <td colspan="3"><span class="label">CHIEF COMPLAINTS</span> <span class="value mono">${complaints}</span></td>
              <td colspan="3"><span class="label">PREVIOUS ADMISSIONS</span> <span class="value"></span></td>
            </tr>
            <tr>
              <td colspan="6"><span class="label">ADMITTING DIAGNOSIS</span> 
                <span class="value mono">G_${(prenatalData.gravida ?? '')} P_${(prenatalData.para ?? '')} __ PU WKS AOG BY LMP ${aog ? aog : ''} CEPHALIC IN LABOR</span>
              </td>
            </tr>
            <tr>
              <td colspan="6"><span class="label">ALLERGIES</span> <span class="value">${allergies}</span></td>
            </tr>
            <tr>
              <td colspan="6" class="tiny"><span class="label">CLINICAL HISTORY</span></td>
            </tr>
            <tr class="no-border"><td colspan="6" class="row-gap"></td></tr>
            <tr class="no-border"><td colspan="6" class="row-gap"></td></tr>
            <tr>
              <td colspan="6" class="tiny"><span class="label">PHYSICAL EXAMINATION</span></td>
            </tr>
            <tr><td colspan="6"><span class="label">SKIN:</span> <span class="value">${physSkin}</span></td></tr>
            <tr><td colspan="6"><span class="label">CONJUNCTIVA:</span> <span class="value">${physConjunctiva}</span></td></tr>
            <tr><td colspan="6"><span class="label">BREAST:</span> <span class="value">${physBreast}</span></td></tr>
            <tr><td colspan="6"><span class="label">ABDOMEN:</span> <span class="value">${physAbdomen}</span></td></tr>
            <tr><td colspan="6"><span class="label">EXTREMITIES:</span> <span class="value">${physExtremities}</span></td></tr>
            <tr class="no-border"><td colspan="6" class="row-gap"></td></tr>
            <tr class="no-border"><td colspan="6" class="row-gap"></td></tr>
            <tr>
              <td colspan="6"><span class="label">FINAL DIAGNOSIS:</span> <span class="value">${admissionData.outcome || ''}</span></td>
            </tr>
            <tr>
              <td colspan="6">
                <span class="value mono">G_${(prenatalData.gravida ?? '')} P_${(prenatalData.para ?? '')} __ PU WKS AOG BY LMP ${aog ? aog : ''} FULLTERM BABY DELIVERED VIA ${admissionData.delivery_type || 'NSD'}</span>
              </td>
            </tr>
            <tr>
              <td colspan="3"><span class="label">DATE OF DISCHARGE</span> <span class="value">${dischargeDate}</span></td>
              <td colspan="3"><span class="label">TIME OF DISCHARGE</span> <span class="value">${dischargeTime}</span></td>
            </tr>
            <tr class="no-border"><td colspan="6" class="row-gap-lg"></td></tr>
            <tr class="no-border"><td colspan="6" class="row-gap-lg"></td></tr>
            <tr class="no-border"><td colspan="6" class="row-gap-lg"></td></tr>
          </table>
        </div>
    </body>
    </html>
  `;
  return html;
};

export const generateBirthPlanHTML = (birthPlan = {}, patientData = {}, prenatalData = {}, logoUrl) => {
  const clinicName = 'N.B. SEGODINE LYING-IN CLINIC';
  const clinicAddress = 'PAGLALAGYAN (ACCREDITED)';
  const clinicSubAddress = 'MDRROCOCOS/BPJS/CAO VALIJO';

  const firstName = patientData.first_name || '';
  const middleName = patientData.middle_name || '';
  const lastName = patientData.last_name || '';
  const patientName = birthPlan.display_patient_name || patientData.name || [firstName, middleName, lastName].filter(Boolean).join(' ');
  const age = patientData.age || '';
  const phone = patientData.phone || '';
  const gravida = prenatalData?.gravida ?? '';
  const para = prenatalData?.para ?? '';

  const partnerName = birthPlan.partner_name || '';
  const partnerPhone = birthPlan.partner_phone || '';
  const partnerAge = birthPlan.partner_age || patientData.partner_age || '';
  const transportMode = birthPlan.transport_mode || '';
  const donorName = birthPlan.donor_name || '';
  const donorPhone = birthPlan.donor_phone || '';
  const philhealthStatus = birthPlan.philhealth_status || '';
  const married = birthPlan.married;
  const emergencyFacility = birthPlan.emergency_facility || '';

  // Always use default checklist items (ignore database values)
  const motherItems = [
    'Damit (duster, t shirt, pajama, medyas at undies)',
    'Kumot',
    'Adult diaper at napkin',
    'Iba pang kailangan dalhin:',
    'Pagkain',
    'Thermos',
    'Baso, pinggan at kutsara (disposables)',
    'Under pads o lumang tshirt (at least 10 pcs.)',
    'Garbage bag (5 pcs.)',
    'Sanitex (maternity pads)'
  ];

  const babyItems = [
    'Damit ng bata (baru-baruan)',
    'Lampin (5 pcs o higit pa)',
    'Pambalot ng bata (pranela)',
    'Twalya',
    'baby wipes',
    'baby soap',
    'baby oil',
    'baby diaper',
    'Pambalot sa ulo, kamay at paa',
    'Bulak at alcohol (70%)'
  ];

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Birth Plan Chart</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 9pt; 
          line-height: 1.3; 
          color: #000;
          padding: 6px;
        }
        .header { 
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
          padding-bottom: 3px;
        }
        .logo-container {
          width: 45px;
          height: 45px;
          flex-shrink: 0;
        }
        .logo-container img { 
          width: 100%; 
          height: 100%; 
          object-fit: contain; 
        }
        .clinic-info {
          flex: 1;
        }
        .clinic { 
          font-weight: bold; 
          font-size: 10.5pt;
          line-height: 1.1;
        }
        .sub { 
          font-size: 7.5pt; 
          color: #333;
          line-height: 1.1;
        }
        .title { 
          text-align: center; 
          font-weight: bold; 
          font-size: 10.5pt; 
          margin: 3px 0 6px;
          letter-spacing: 0.5px;
        }
        
        .form-section {
          margin-bottom: 5px;
        }
        
        .form-row {
          display: flex;
          margin-bottom: 3px;
          font-size: 8.5pt;
        }
        
        .form-field {
          flex: 1;
          display: flex;
          align-items: baseline;
        }
        
        .form-label {
          font-size: 8pt;
          margin-right: 2px;
          white-space: nowrap;
        }
        
        .form-value {
          border-bottom: 1px solid #000;
          flex: 1;
          min-height: 14px;
          padding: 0 2px;
          font-size: 8.5pt;
        }
        
        .form-value-short {
          display: inline-block;
          border-bottom: 1px solid #000;
          min-width: 50px;
          padding: 0 2px;
        }
        
        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 6px;
        }
        
        .column-header {
          font-weight: bold;
          font-size: 9pt;
          margin-bottom: 3px;
          padding-bottom: 2px;
          border-bottom: 1px solid #666;
        }
        
        .checklist-item {
          display: flex;
          align-items: baseline;
          margin-bottom: 2px;
          font-size: 8pt;
          line-height: 1.2;
        }
        
        .checkbox {
          width: 9px;
          height: 9px;
          border: 1px solid #000;
          display: inline-block;
          margin-right: 3px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .kasali-section {
          margin-top: 6px;
          font-size: 8pt;
          line-height: 1.2;
        }
        
        .kasali-header {
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .expenses-list {
          margin-left: 10px;
          margin-top: 2px;
        }
        
        .signature-section {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .signature-box {
          font-size: 7.5pt;
        }
        
        .signature-text {
          margin-bottom: 18px;
          line-height: 1.2;
        }
        
        .signature-line {
          border-top: 1px solid #000;
          padding-top: 2px;
          text-align: center;
          font-size: 8pt;
        }
        
        .inline-label {
          font-size: 8pt;
        }
        
        .spacer {
          margin: 0 3px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoUrl ? `<div class="logo-container"><img src="${logoUrl}" alt="Logo" /></div>` : ''}
        <div class="clinic-info">
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicSubAddress}</div>
        </div>
      </div>
      
      <div class="title">BIRTH PLAN CHART</div>

      <div class="form-section">
        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Pangalan:</span>
            <div class="form-value">${patientName || ''}</div>
          </div>
          <div class="form-field" style="max-width: 120px; margin-left: 8px;">
            <span class="form-label">Edad:</span>
            <div class="form-value">${age || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Pangalan ng Asawa o ka-live in:</span>
            <div class="form-value">${partnerName || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Telepono:</span>
            <div class="form-value">${phone || ''}</div>
          </div>
          <div class="form-field" style="margin-left: 8px;">
            <span class="form-label">Cellphone Number:</span>
            <div class="form-value">${partnerPhone || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Doctor ng ipagliliwang kung may sakit:</span>
            <div class="form-value"></div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Ospital na pagdadalhan kung may emerghensya:</span>
            <div class="form-value">${emergencyFacility || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <span class="form-label">May Pambili:</span>
            <div class="form-value"></div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Kasamahan sa panganganak:</span>
            <div class="form-value">${partnerName || ''}</div>
          </div>
          <div class="form-field" style="max-width: 120px; margin-left: 8px;">
            <span class="form-label">Relasyon:</span>
            <div class="form-value"></div>
          </div>
        </div>

        <div class="form-row">
          <span class="inline-label">Gravida:</span>
          <span class="form-value-short">${gravida || ''}</span>
          <span class="spacer"></span>
          <span class="inline-label">Para:</span>
          <span class="form-value-short">${para || ''}</span>
        </div>





        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Mga pangangailangan dalin:</span>
          </div>
        </div>
      </div>

      <div class="two-columns">
        <div>
          <div class="column-header">Mga Kailangan ng Ina:</div>
          ${motherItems.map(item => `
            <div class="checklist-item">
              <span class="checkbox"></span>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>

        <div>
          <div class="column-header">Mga Kailangan ng Sanggol:</div>
          ${babyItems.map(item => `
            <div class="checklist-item">
              <span class="checkbox"></span>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="kasali-section">
        <div class="kasali-header">✓ KASALI: Marriage Contract (Xerox)</div>
        <div style="margin-left: 10px; margin-bottom: 3px;">
          <div>• PhilHealth #: ${philhealthStatus || ''}</div>
        </div>
        
        <div class="kasali-header">✗ HINDI KASALI: Cedula ng mag asawa</div>
        
        <div style="margin-top: 3px;">
          <div class="kasali-header">Mga Gastusin:</div>
          <div class="expenses-list">
            <div>1. 6 at pa</div>
            <div>2. 8 at pa</div>
          </div>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-text">
            Ito ay aking binasa, nauunawaan at pinaghahawakan. Katunayan nito ay ang aking lagda sa ibaba.
          </div>
          <div class="signature-line">lagda ng pasyente</div>
        </div>

        <div class="signature-box">
          <div class="signature-text">
            Bayad na ba ang NURSE/MIDWIFE/CLERK/PHYSICIAN sa 2nd pa
          </div>
          <div class="signature-line">
            NURSE/MIDWIFE
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

export const generateDeliveryRoomRecordHTML = (mother = {}, baby = {}, admission = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk 11, Lot 10, Pcs-04-010643, Salawag, Dasmariñas Cavite';
  const clinicContact = 'Contact No.: (093) 382-54-81 / (0919) 646-24-53';
  const terminalNo = 'Terminal#578-1004';

  const patientName = mother.name || '';
  const patientAge = mother.age || '';
  const patientAddress = mother.address || '';
  let attendingMidwife = admission.attending_midwife || '';
  const notesRaw = admission.notes;
  let notesObj = {};
  try {
    notesObj = typeof notesRaw === 'string' ? JSON.parse(notesRaw) : (notesRaw || {});
  } catch {
    notesObj = {};
  }
  const dd = notesObj && notesObj.delivery_details ? notesObj.delivery_details : {};
  const gravida = mother.gravida || dd.gravida || '';
  const para = mother.para || dd.para || '';

  const fluidCharacter = dd.fluid_character || admission.fluid_character || '';
  const fmtDateTime = (d) => (d ? (() => { try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleString(); } catch { return String(d); } })() : '');
  const fullyDilatedAt = fmtDateTime(dd.fully_dilated_at || admission.fully_dilated_at || '');
  const deliveredAt = fmtDateTime(dd.delivered_at || admission.delivered_at || '');
  const deliveryType = dd.delivery_type || admission.delivery_type || 'NATURAL SPONTANEOUS DELIVERY (NSD)';
  const placentaDeliveredAt = fmtDateTime(dd.placenta_delivered_at || admission.placenta_delivered_at || '');
  const repair = dd.repair || admission.repair || '';
  const packing = dd.packing || admission.packing || '';
  const motherRemarks = dd.remarks || admission.remarks || '';
  const bpOnDischarge = dd.bp_on_discharge || admission.bp_on_discharge || '';
  const temperatureMother = dd.temperature || admission.temperature || '';

  const ddBaby = dd.baby_details || {};
  const babyName = ddBaby.full_name || baby.full_name || baby.baby_name || '';
  const birthOrder = baby.birth_order || '';
  const generalCondition = ddBaby.general_condition || baby.general_condition || '';
  const apgar1 = ddBaby.apgar_1min || ddBaby.apgar1 || baby.apgar_1min || baby.apgar1 || admission.apgar1 || '';
  const apgar5 = ddBaby.apgar_5min || ddBaby.apgar5 || baby.apgar_5min || baby.apgar5 || admission.apgar5 || '';
  const eyeProphylaxis = ddBaby.eye_prophylaxis || baby.eye_prophylaxis || '';
  const injuries = ddBaby.injuries || baby.injuries || '';
  const sex = (ddBaby.gender || baby.gender || '').toString().toUpperCase();
  const weightKg = ddBaby.birth_weight_kg || ddBaby.birth_weight || baby.birth_weight_kg || baby.birth_weight || admission.baby_weight_kg || '';
  const lengthCm = ddBaby.birth_length_cm || baby.birth_length_cm || baby.birth_length || '';
  const tempBaby = ddBaby.temperature || baby.temperature || '';
  const headCirc = ddBaby.head_circumference || ddBaby.head_circumference_cm || baby.head_circumference || baby.head_circumference_cm || '';
  const chest = ddBaby.chest || baby.chest || '';
  const abdomen = ddBaby.abdomen || baby.abdomen || '';
  const heartRate = ddBaby.heart_rate || baby.heart_rate || '';
  const respiratoryRate = ddBaby.respiratory_rate || baby.respiratory_rate || '';
  const babyRemarks = ddBaby.remarks || baby.remarks || baby.notes || '';

  const show = (v) => (v === undefined || v === null || String(v).trim() === '' ? 'N/A' : String(v));
  const unit = (v, s) => (v === undefined || v === null || String(v).trim() === '' ? 'N/A' : `${v}${s}`);
  const gpDisplay = [gravida, para].filter(v => v !== undefined && v !== null && String(v).trim() !== '').join(' - ') || 'N/A';
  const placenta = dd.placenta || admission.placenta || '';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Delivery Room Record</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #000; }
        .header { display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; margin-bottom: 8px; }
        .logo-box { width: 72px; height: 72px; background: #222; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .clinic { font-weight: bold; font-size: 12pt; }
        .sub { font-size: 9pt; color: #444; }
        .title { text-align: center; font-weight: bold; font-size: 13pt; margin: 6px 0 8px; }
        .section-title { font-weight: bold; margin-top: 8px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .label { color: #555; font-size: 9pt; margin-right: 4px; }
        .value { font-weight: bold; font-size: 11pt; }
        .line { border-top: 1px solid #aaa; margin: 8px 0; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; }
        .muted { color: #555; font-size: 9pt; }
        .sig { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; }
        .sig-line { margin-top: 30px; border-top: 1px solid #999; text-align: center; padding-top: 4px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box"><img src="${logoUrl}" alt="Clinic Logo" /></div>
        <div>
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicContact}</div>
          <div class="sub">${terminalNo}</div>
        </div>
      </div>
      <div class="title">DELIVERY ROOM RECORD</div>

      <div class="section-title">MOTHER</div>
      <div class="row"><div><span class="label">Patient:</span> <span class="value">${show(patientName)}</span></div><div><span class="label">Age:</span> <span class="value">${show(patientAge)}</span></div></div>
      <div class="row"><div><span class="label">Address:</span> <span class="value">${show(patientAddress)}</span></div><div><span class="label">G - P:</span> <span class="value">${gpDisplay}</span></div></div>
      <div class="row"><div><span class="label">Attending Midwife:</span> <span class="value">${show(attendingMidwife)}</span></div><div></div></div>
      <div class="row"><div><span class="label">Character of amniotic fluid:</span> <span class="value">${show(fluidCharacter)}</span></div><div></div></div>
      <div class="row"><div><span class="label">Fully dilated at:</span> <span class="value">${show(fullyDilatedAt)}</span></div><div><span class="label">Delivered at:</span> <span class="value">${show(deliveredAt)}</span></div></div>
      <div class="row"><div><span class="label">Type of delivery:</span> <span class="value">${show(deliveryType)}</span></div><div></div></div>
      <div class="row"><div><span class="label">Placenta:</span> <span class="value">${show(placenta)}</span></div><div><span class="label">Delivered at:</span> <span class="value">${show(placentaDeliveredAt)}</span></div></div>
      <div class="row"><div><span class="label">Repair:</span> <span class="value">${show(repair)}</span></div><div><span class="label">Packing:</span> <span class="value">${show(packing)}</span></div></div>
      <div class="row"><div><span class="label">Remarks:</span> <span class="value">${show(motherRemarks)}</span></div><div></div></div>
      <div class="row"><div><span class="label">BP on discharged:</span> <span class="value">${show(bpOnDischarge)}</span></div><div><span class="label">Temperature:</span> <span class="value">${show(temperatureMother)}</span></div></div>

      <div class="line"></div>
      <div class="section-title">BABY</div>
      <div class="row"><div><span class="label">Name:</span> <span class="value">${show(babyName)}</span></div><div><span class="label">Birth order:</span> <span class="value">${show(birthOrder)}</span></div></div>
      <div class="row"><div><span class="label">General condition:</span> <span class="value">${show(generalCondition)}</span></div><div><span class="label">Eye prophylaxis:</span> <span class="value">${show(eyeProphylaxis)}</span></div></div>
      <div class="row"><div><span class="label">APGAR score:</span> <span class="value">${show(apgar1)}${apgar1 || apgar5 ? ' / ' : ' / '}${show(apgar5)}</span></div><div><span class="label">Injuries:</span> <span class="value">${show(injuries)}</span></div></div>
      <div class="row"><div><span class="label">Sex:</span> <span class="value">${show(sex)}</span></div><div><span class="label">Weight:</span> <span class="value">${unit(weightKg, ' kg')}</span></div></div>
      <div class="row"><div><span class="label">Length:</span> <span class="value">${unit(lengthCm, ' cm')}</span></div><div><span class="label">Temp.:</span> <span class="value">${show(tempBaby)}</span></div></div>
      <div class="row"><div><span class="label">Head circumference:</span> <span class="value">${unit(headCirc, ' cm')}</span></div><div><span class="label">Chest:</span> <span class="value">${show(chest)}</span></div></div>
      <div class="row"><div><span class="label">Abdomen:</span> <span class="value">${show(abdomen)}</span></div><div><span class="label">Heart rate:</span> <span class="value">${show(heartRate)}</span></div></div>
      <div class="row"><div><span class="label">Respiratory rate:</span> <span class="value">${show(respiratoryRate)}</span></div><div></div></div>
      <div class="row"><div><span class="label">Remarks:</span> <span class="value">${show(babyRemarks)}</span></div><div></div></div>

      <div class="sig">
        <div><div class="sig-line">Narcisa B. Segodine\nMidwife On Duty</div></div>
        <div><div class="sig-line">Staff On Duty</div></div>
      </div>
    </body>
  </html>`;
};

export const generateNewbornAdmissionFormHTML = (mother = {}, baby = {}, admission = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk.7B Lot 9 Brgy. G. De Jesu G.M.A., Cavite';
  const clinicContact = 'Contact No. (02) 893-26-48 / 0919-665-23-25';
  const subtitle = 'PHILHEALTH ACCREDITED AND DOH LICENSED';

  const rawName = (baby.full_name || baby.baby_name || '').trim();
  const motherLast = ((mother.name || '').trim().split(/\s+/).pop()) || '';
  const hasComma = rawName.includes(',');
  const parts = hasComma
    ? rawName.split(',').map(s => s.trim())
    : rawName.split(/\s+/).filter(Boolean);
  let pFirst = '';
  let pMiddle = '';
  let pLast = '';
  if (hasComma) {
    pLast = parts[0] || '';
    const rest = parts[1] || '';
    const restParts = rest.split(/\s+/).filter(Boolean);
    pFirst = restParts[0] || '';
    pMiddle = restParts.slice(1).join(' ') || '';
  } else if (parts.length >= 3) {
    pFirst = parts[0];
    pMiddle = parts.slice(1, -1).join(' ');
    pLast = parts[parts.length - 1];
  } else if (parts.length === 2) {
    pFirst = parts[0];
    pLast = parts[1];
  } else if (parts.length === 1) {
    pFirst = parts[0];
  }
  const lastName = baby.last_name || pLast || motherLast;
  const firstName = baby.first_name || pFirst;
  const middleName = baby.middle_name || pMiddle;
  const address = mother.address || '';
  const placeOfBirth = clinicName;
  const apgar1 = baby.apgar_1min || baby.apgar1 || admission.apgar1 || '';
  const apgar5 = baby.apgar_5min || baby.apgar5 || admission.apgar5 || '';
  const apgarScore = [apgar1, apgar5].filter(Boolean).join(' / ');
  const ballardScore = admission.ballard_score || '';
  const dateOfBirth = (() => { const raw = baby.birth_date || ''; if (!raw) return ''; try { const dt = new Date(raw); return Number.isNaN(dt.getTime()) ? String(raw) : dt.toLocaleDateString(); } catch { return String(raw); } })();
  const fatherName = baby.father_name || '';
  const motherName = mother.name || '';
  const weight = baby.birth_weight_kg || baby.birth_weight || admission.baby_weight_kg || '';
  const height = baby.birth_length_cm || baby.birth_length || '';
  const temperature = baby.temperature || '';
  const rr = baby.respiratory_rate || '';
  const pr = baby.heart_rate || '';
  const headCircumference = baby.head_circumference_cm || baby.head_circumference || '';
  const chest = baby.chest || '';
  const abdomen = baby.abdomen || '';
  const admittingStaff = admission.attending_midwife || '';
  const dischargeRaw = admission.date_discharge || '';
  const dateOfDischarge = dischargeRaw ? (() => { try { const dt = new Date(dischargeRaw); return Number.isNaN(dt.getTime()) ? String(dischargeRaw) : dt.toLocaleDateString(); } catch { return String(dischargeRaw); } })() : '';
  const timeOfDischarge = dischargeRaw ? (() => { try { const dt = new Date(dischargeRaw); return Number.isNaN(dt.getTime()) ? ((dischargeRaw.includes(' ') ? dischargeRaw.split(' ')[1] : '')) : dt.toLocaleTimeString(); } catch { return (dischargeRaw.includes(' ') ? dischargeRaw.split(' ')[1] : ''); } })() : '';
  const show = (v) => (v === undefined || v === null || String(v).trim() === '' ? 'N/A' : String(v));
  const unit = (v, s) => (v === undefined || v === null || String(v).trim() === '' ? 'N/A' : `${v}${s}`);

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Newborn Admission</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #000; }
        .header { display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; margin-bottom: 8px; }
        .logo-box { width: 72px; height: 72px; background: #222; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .clinic { font-weight: bold; font-size: 12pt; }
        .sub { font-size: 9pt; color: #444; }
        .title { text-align: center; font-weight: bold; font-size: 13pt; margin: 6px 0 8px; }
        .panel { border: 1px solid #999; padding: 8px; }
        .row { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .row-1 { margin-bottom: 6px; }
        .label { color: #555; font-size: 9pt; }
        .value { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #aaa; display: inline-block; min-width: 120px; }
        .line { border-top: 1px solid #aaa; margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box"><img src="${logoUrl}" alt="Clinic Logo" /></div>
        <div>
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicContact}</div>
          <div class="sub">${subtitle}</div>
        </div>
      </div>

      <div class="title">ADMISSION FORM — NEWBORN PATIENT</div>

      <div class="panel">
        <div class="row">
          <div><span class="label">LAST NAME:</span> <span class="value">${show(lastName)}</span></div>
          <div><span class="label">FIRST NAME:</span> <span class="value">${show(firstName)}</span></div>
          <div><span class="label">MIDDLE NAME:</span> <span class="value">${show(middleName)}</span></div>
        </div>
        <div class="row-1"><span class="label">ADDRESS:</span> <span class="value" style="min-width: 300px;">${show(address)}</span></div>
        <div class="row-2">
          <div><span class="label">PLACE OF BIRTH:</span> <span class="value" style="min-width: 280px;">${show(placeOfBirth)}</span></div>
          <div></div>
        </div>
        <div class="row">
          <div><span class="label">APGAR SCORE:</span> <span class="value">${show(apgarScore)}</span></div>
          <div><span class="label">BALLARD SCORE:</span> <span class="value">${show(ballardScore)}</span></div>
          <div><span class="label">DATE OF BIRTH:</span> <span class="value">${show(dateOfBirth)}</span></div>
        </div>
        <div class="row-2">
          <div><span class="label">NAME OF FATHER:</span> <span class="value" style="min-width: 260px;">${show(fatherName)}</span></div>
          <div><span class="label">NAME OF MOTHER:</span> <span class="value" style="min-width: 260px;">${show(motherName)}</span></div>
        </div>
        <div class="row">
          <div><span class="label">WEIGHT:</span> <span class="value">${unit(weight, ' kg')}</span></div>
          <div><span class="label">HEIGHT:</span> <span class="value">${unit(height, ' cm')}</span></div>
          <div><span class="label">TEMPERATURE:</span> <span class="value">${show(temperature)}</span></div>
        </div>
        <div class="row">
          <div><span class="label">RR:</span> <span class="value">${show(rr)}</span></div>
          <div><span class="label">PR:</span> <span class="value">${show(pr)}</span></div>
          <div></div>
        </div>
        <div class="row">
          <div><span class="label">HEAD CIRCUMFERENCE:</span> <span class="value">${unit(headCircumference, ' cm')}</span></div>
          <div><span class="label">CHEST:</span> <span class="value">${show(chest)}</span></div>
          <div><span class="label">ABDOMEN:</span> <span class="value">${show(abdomen)}</span></div>
        </div>
        <div class="row-1"><span class="label">ADMITTING MIDWIFE/STAFF:</span> <span class="value" style="min-width: 300px;">${show(admittingStaff)}</span></div>
        <div class="row-2">
          <div><span class="label">DATE OF DISCHARGE:</span> <span class="value">${show(dateOfDischarge)}</span></div>
          <div><span class="label">TIME OF DISCHARGE:</span> <span class="value">${show(timeOfDischarge)}</span></div>
        </div>
      </div>

      <div style="margin-top: 28px; text-align: right;">
        <div style="display: inline-block; min-width: 220px;">
          <div style="border-top: 1px solid #999; padding-top: 4px;">NARCISA B. SEGODINE, R.M.</div>
        </div>
      </div>
    </body>
  </html>`;
};

export const generateNewbornDischargeSummaryHTML = (mother = {}, baby = {}, admission = {}, maternal = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk.7B Lot 9 Brgy. G. De Jesu G.M.A., Cavite';
  const clinicContact = 'Contact No. (02) 893-26-48 / 0919-665-23-25';
  const subtitle = 'PHILHEALTH ACCREDITED AND DOH LICENSED';

  const babyName = baby.full_name || baby.baby_name || [baby.first_name, baby.middle_name, baby.last_name].filter(Boolean).join(' ') || 'Baby';
  const sex = (baby.gender || '').toString().toUpperCase();
  const fmtDate = (d) => (d ? (() => { try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(); } catch { return String(d); } })() : '');
  const fmtTime = (d) => (d ? (() => { try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? ((String(d).includes(' ') ? String(d).split(' ')[1] : '')) : dt.toLocaleTimeString(); } catch { return (String(d).includes(' ') ? String(d).split(' ')[1] : ''); } })() : '');
  const dateAdmitted = fmtDate(admission.date_admitted || '');
  const timeAdmitted = fmtTime(admission.date_admitted || '');
  const dateDischarge = fmtDate(admission.date_discharge || '');
  const timeDischarge = fmtTime(admission.date_discharge || '');
  const admittingDiagnosis = admission.admitting_diagnosis || '';
  const fullTermNote = 'FULL TERM BABY';
  const via = maternal.delivery_type ? maternal.delivery_type : (admission.delivery_type || 'VIA NSD');
  const bw = baby.birth_weight_kg || baby.birth_weight || admission.baby_weight_kg || '';
  const apgar1 = baby.apgar_1min || baby.apgar1 || admission.apgar1 || '';
  const apgar5 = baby.apgar_5min || baby.apgar5 || admission.apgar5 || '';
  const apgar = [apgar1, apgar5].filter(Boolean).join(' / ');
  const aog = maternal.aog || '';
  const gravida = mother.gravida || '';
  const para = mother.para || '';
  const homeMedication = admission.home_medication || '';
  const followUp = admission.follow_up || '';
  const screeningDate = fmtDate(admission.screening_date || '');
  const screeningTime = fmtTime(admission.screening_date || '');
  const filterCardNo = admission.screening_filter_card_no || '';
  const vitKDate = admission.vitamin_k_date || '';
  const bcgDate = admission.bcg_date || '';
  const hepbDate = admission.hepb_date || '';
  const dischargedBy = admission.discharged_by || '';
  const show = (v) => (v === undefined || v === null || String(v).trim() === '' ? 'N/A' : String(v));
  const unit = (v, s) => (v === undefined || v === null || String(v).trim() === '' ? 'N/A' : `${v}${s}`);
  const homeFollow = [homeMedication, followUp].filter(v => v && String(v).trim() !== '').join(' | ');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Newborn Discharge Summary</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #000; }
        .header { display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; margin-bottom: 8px; }
        .logo-box { width: 72px; height: 72px; background: #222; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .clinic { font-weight: bold; font-size: 12pt; }
        .sub { font-size: 9pt; color: #444; }
        .title { text-align: center; font-weight: bold; font-size: 13pt; margin: 6px 0 8px; }
        .panel { border: 1px solid #999; padding: 8px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .row-1 { margin-bottom: 6px; }
        .label { color: #555; font-size: 9pt; }
        .value { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #aaa; display: inline-block; min-width: 160px; }
        .sig { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; }
        .sig-line { margin-top: 30px; border-top: 1px solid #999; text-align: center; padding-top: 4px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box"><img src="${logoUrl}" alt="Clinic Logo" /></div>
        <div>
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicContact}</div>
          <div class="sub">${subtitle}</div>
        </div>
      </div>

      <div class="title">DISCHARGE SUMMARY — NEWBORN PATIENT</div>

      <div class="panel">
        <div class="row-2"><div><span class="label">NAME:</span> <span class="value">${show(babyName)}</span></div><div><span class="label">SEX:</span> <span class="value">${show(sex)}</span></div></div>
        <div class="row-3">
          <div><span class="label">DATE ADMITTED:</span> <span class="value">${show(dateAdmitted)}</span></div>
          <div><span class="label">TIME:</span> <span class="value">${show(timeAdmitted)}</span></div>
          <div><span class="label">DATE DISCHARGE:</span> <span class="value">${show(dateDischarge)}</span></div>
        </div>
        <div class="row-2"><div><span class="label">TIME:</span> <span class="value">${show(timeDischarge)}</span></div><div></div></div>
        <div class="row-1"><span class="label">ADMITTING DIAGNOSIS:</span> <span class="value" style="min-width: 400px;">${show(admittingDiagnosis)}</span></div>
        <div class="row-1"><span class="label">${fullTermNote}:</span> <span class="value" style="min-width: 240px;">${show(via)}</span></div>
        <div class="row-3">
          <div><span class="label">BW:</span> <span class="value">${unit(bw, ' kg')}</span></div>
          <div><span class="label">AS:</span> <span class="value">${show(apgar)}</span></div>
          <div><span class="label">AOG:</span> <span class="value">${show(aog)}</span></div>
        </div>
        <div class="row-2"><div><span class="label">G:</span> <span class="value">${show(gravida)}</span></div><div><span class="label">P:</span> <span class="value">${show(para)}</span></div></div>
        <div class="row-1"><span class="label">HOME MEDICATION / FOLLOW-UP CHECK-UP:</span> <span class="value" style="min-width: 420px;">${show(homeFollow)}</span></div>
        <div class="row-1"><span class="label">FOR NEWBORN SCREENING — DATE OF COLLECTION:</span> <span class="value">${show(screeningDate)}</span></div>
        <div class="row-2"><div><span class="label">TIME OF COLLECTION:</span> <span class="value">${show(screeningTime)}</span></div><div><span class="label">FILTER CARD NO.:</span> <span class="value">${show(filterCardNo)}</span></div></div>
        <div class="row-1"><span class="label">IMMUNIZATION</span></div>
        <div class="row-2"><div><span class="label">VITA K — DATE:</span> <span class="value">${show(vitKDate)}</span></div><div><span class="label">SIGNATURE:</span> <span class="value"></span></div></div>
        <div class="row-2"><div><span class="label">BCG — DATE:</span> <span class="value">${show(bcgDate)}</span></div><div><span class="label">SIGNATURE:</span> <span class="value"></span></div></div>
        <div class="row-2"><div><span class="label">HEPA B VACCINE — DATE:</span> <span class="value">${show(hepbDate)}</span></div><div><span class="label">SIGNATURE:</span> <span class="value"></span></div></div>
      </div>

      <div class="sig">
        <div></div>
        <div><div class="sig-line">${dischargedBy || 'NARCISA B. SEGODINE, REG. MIDWIFE'}</div></div>
      </div>
    </body>
  </html>`;
};

export const generateMotherDischargeSummaryHTML = (patient = {}, admission = {}, prenatal = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk.7B Lot 9 Brgy. G. De Jesu G.M.A., Cavite';
  const clinicContact = 'Contact No. (02) 893-26-48 / 0919-665-23-25';
  const subtitle = 'PHILHEALTH ACCREDITED AND DOH LICENSED';

  const name = patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ') || admission.display_patient_name || admission.patient_name || 'Patient';
  const age = patient.age || admission.patient_age || '';
  const sex = (patient.gender || admission.patient_gender || 'female').toString().toUpperCase();
  const address = patient.address || admission.patient_address || '';

  const admittedRaw = admission.admitted_at || admission.admission_date || '';
  let dateAdmitted = '';
  let timeAdmitted = '';
  if (admittedRaw) {
    try { const dt = new Date(admittedRaw); dateAdmitted = dt.toLocaleDateString(); timeAdmitted = dt.toLocaleTimeString(); } catch { dateAdmitted = admittedRaw; }
  }
  const dischargedRaw = admission.discharged_at || admission.discharge_date || admission.date_discharge || '';
  let dateDischarge = '';
  let timeDischarge = '';
  if (dischargedRaw) {
    try { const dt = new Date(dischargedRaw); dateDischarge = dt.toLocaleDateString(); timeDischarge = dt.toLocaleTimeString(); } catch { dateDischarge = dischargedRaw; }
  }

  const notesRaw = admission.notes;
  let notesObj = {};
  try {
    notesObj = typeof notesRaw === 'string' ? JSON.parse(notesRaw) : (notesRaw || {});
  } catch {
    notesObj = {};
  }
  const dd = notesObj && notesObj.delivery_details ? notesObj.delivery_details : {};
  const admittingDiagnosis = admission.admitting_diagnosis || admission.admission_reason || '';
  const deliveryType = dd.delivery_type || admission.delivery_type || '';
  const outcome = dd.outcome || admission.outcome || '';
  const complications = dd.complications || admission.complications || '';
  const aog = prenatal.aog || prenatal.gestational_age || admission.pregnancy_cycle || '';
  const gravida = prenatal.gravida || dd.gravida || '';
  const para = prenatal.para || dd.para || '';
  const disposition = admission.disposition || '';
  const dischargeNotes = dd.discharge_notes || admission.discharge_notes || '';
  const followUp = dd.follow_up || admission.follow_up || '';
  const dischargedBy = admission.discharged_by || '';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Maternal Discharge Summary</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #000; }
        .header { display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; margin-bottom: 8px; }
        .logo-box { width: 72px; height: 72px; background: #222; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .clinic { font-weight: bold; font-size: 12pt; }
        .sub { font-size: 9pt; color: #444; }
        .title { text-align: center; font-weight: bold; font-size: 13pt; margin: 6px 0 8px; }
        .panel { border: 1px solid #999; padding: 8px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .row-1 { margin-bottom: 6px; }
        .label { color: #555; font-size: 9pt; }
        .value { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #aaa; display: inline-block; min-width: 160px; }
        .box { border: 1px solid #aaa; padding: 6px; min-height: 40px; }
        .sig { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; }
        .sig-line { margin-top: 30px; border-top: 1px solid #999; text-align: center; padding-top: 4px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box"><img src="${logoUrl}" alt="Clinic Logo" /></div>
        <div>
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicContact}</div>
          <div class="sub">${subtitle}</div>
        </div>
      </div>

      <div class="title">DISCHARGE SUMMARY — MOTHER PATIENT</div>

      <div class="panel">
        <div class="row-2"><div><span class="label">NAME:</span> <span class="value">${name}</span></div><div><span class="label">SEX:</span> <span class="value">${sex}</span></div></div>
        <div class="row-2"><div><span class="label">AGE:</span> <span class="value">${age}</span></div><div><span class="label">ADDRESS:</span> <span class="value" style="min-width: 260px;">${address}</span></div></div>
        <div class="row-3">
          <div><span class="label">DATE ADMITTED:</span> <span class="value">${dateAdmitted}</span></div>
          <div><span class="label">TIME:</span> <span class="value">${timeAdmitted}</span></div>
          <div><span class="label">DATE DISCHARGE:</span> <span class="value">${dateDischarge}</span></div>
        </div>
        <div class="row-2"><div><span class="label">TIME:</span> <span class="value">${timeDischarge}</span></div><div></div></div>
        <div class="row-1"><span class="label">ADMITTING DIAGNOSIS / REASON:</span> <span class="value" style="min-width: 420px;">${admittingDiagnosis}</span></div>
        <div class="row-3">
          <div><span class="label">DELIVERY TYPE:</span> <span class="value">${deliveryType}</span></div>
          <div><span class="label">OUTCOME:</span> <span class="value">${outcome}</span></div>
          <div><span class="label">COMPLICATIONS:</span> <span class="value">${complications}</span></div>
        </div>
        <div class="row-3">
          <div><span class="label">AOG:</span> <span class="value">${aog}</span></div>
          <div><span class="label">G:</span> <span class="value">${gravida}</span></div>
          <div><span class="label">P:</span> <span class="value">${para}</span></div>
        </div>
        <div class="row-1"><span class="label">DISPOSITION:</span> <span class="value" style="min-width: 420px;">${disposition}</span></div>
        <div class="row-1"><span class="label">DISCHARGE NOTES:</span></div>
        <div class="box">${dischargeNotes}</div>
        ${followUp ? `<div class="row-1"><span class="label">FOLLOW-UP:</span> <span class="value" style="min-width: 420px;">${followUp}</span></div>` : ''}
      </div>

      <div class="sig">
        <div></div>
        <div><div class="sig-line">${dischargedBy || 'NARCISA B. SEGODINE, REG. MIDWIFE'}</div></div>
      </div>
    </body>
  </html>`;
};

export const generatePostpartumRecordHTML = (patient = {}, delivery = {}, within24h = {}, within7d = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk.7B Lot 9 Brgy. G. De Jesu G.M.A., Cavite';
  const clinicContact = 'Contact No. (02) 893-26-48 / 0919-665-23-25';
  const subtitle = 'PHILHEALTH ACCREDITED AND DOH LICENSED';

  const name = patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ') || 'Patient';
  const deliveryDate = delivery.baby_birth_date || delivery.delivery_date || delivery.admitted_at || '';
  const delStr = deliveryDate ? (() => { try { return new Date(deliveryDate).toLocaleDateString(); } catch { return String(deliveryDate); } })() : '';
  const vitADate = within24h.vitamin_a_date || within7d.vitamin_a_date || '';
  const ironDate = within24h.iron_supplement_date || within7d.iron_supplement_date || '';

  const fmtDate = (d) => (d ? (() => { try { return new Date(d).toLocaleDateString(); } catch { return String(d); } })() : '');

  const yesNo = (v) => (v ? 'YES' : 'NO');
  const inferBreastfeedingYN = (s) => {
    const t = (s || '').toString().toLowerCase();
    if (!t) return '';
    return /exclusive|mixed|yes|breast|bf/.test(t) ? 'YES' : 'NO';
  };
  const inferFeverYN = (objOrTemp) => {
    if (objOrTemp && typeof objOrTemp === 'object') {
      if (typeof objOrTemp.fever !== 'undefined' && objOrTemp.fever !== null) return objOrTemp.fever ? 'YES' : 'NO';
      const n = Number(objOrTemp.temperature);
      if (!isFinite(n)) return '';
      return n >= 38 ? 'YES' : 'NO';
    }
    const n = Number(objOrTemp);
    if (!isFinite(n)) return '';
    return n >= 38 ? 'YES' : 'NO';
  };
  const inferBleedingYN = (obj) => {
    if (typeof obj.vaginal_bleeding !== 'undefined' && obj.vaginal_bleeding !== null) return obj.vaginal_bleeding ? 'YES' : 'NO';
    const amt = (obj.lochia_amount || '').toString().toLowerCase();
    const status = (obj.bleeding_status || '').toString().toLowerCase();
    if (status) return /present|heavy|moderate|spot|spotting/.test(status) ? 'YES' : 'NO';
    if (amt) return /heavy|moderate/.test(amt) ? 'YES' : 'NO';
    return '';
  };
  const fpMethod = (obj, fallback) => (obj.family_planning_method || fallback || '');
  const foulYN = (obj) => {
    if (typeof obj.foul_smell_discharge !== 'undefined' && obj.foul_smell_discharge !== null) return yesNo(!!obj.foul_smell_discharge);
    return '';
  };

  const d24 = {
    visit_date: fmtDate(within24h.assessment_date),
    breastfeeding: inferBreastfeedingYN(within24h.breastfeeding_status),
    fever: inferFeverYN(within24h),
    vaginal_bleeding: inferBleedingYN(within24h),
    foul_discharge: foulYN(within24h),
    fp_use: fpMethod(within24h)
  };
  const d7 = {
    visit_date: fmtDate(within7d.assessment_date),
    breastfeeding: inferBreastfeedingYN(within7d.breastfeeding_status),
    fever: inferFeverYN(within7d),
    vaginal_bleeding: inferBleedingYN(within7d),
    foul_discharge: foulYN(within7d),
    fp_use: fpMethod(within7d)
  };

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Postpartum Record</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #000; }
        .header { display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; margin-bottom: 8px; }
        .logo-box { width: 72px; height: 72px; background: #222; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .clinic { font-weight: bold; font-size: 12pt; }
        .sub { font-size: 9pt; color: #444; }
        .title { text-align: center; font-weight: bold; font-size: 13pt; margin: 6px 0 8px; }
        .panel { border: 1px solid #999; padding: 8px; margin-bottom: 10px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .label { color: #555; font-size: 9pt; }
        .value { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #aaa; display: inline-block; min-width: 160px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #999; padding: 6px; font-size: 10pt; }
        th { background: #f3f4f6; }
        .notes { min-height: 80px; border: 1px solid #999; padding: 6px; }
        .sig { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; }
        .sig-line { margin-top: 30px; border-top: 1px solid #999; text-align: center; padding-top: 4px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box"><img src="${logoUrl}" alt="Clinic Logo" /></div>
        <div>
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicContact}</div>
          <div class="sub">${subtitle}</div>
        </div>
      </div>

      <div class="title">POST PARTUM RECORD</div>

      <div class="panel">
        <div class="row-2"><div><span class="label">Name of Patient:</span> <span class="value">${name}</span></div><div><span class="label">Date of Delivery:</span> <span class="value">${delStr}</span></div></div>
        <div class="row-2"><div><span class="label">Date Vit. A 200,000 IU Given:</span> <span class="value">${fmtDate(vitADate)}</span></div><div><span class="label">Date Supplement Iron Given:</span> <span class="value">${fmtDate(ironDate)}</span></div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th>DATE/TIME OF VISIT</th>
            <th>WITHIN 24 HOURS</th>
            <th>WITHIN 7 DAYS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DATE/TIME OF VISIT</td>
            <td>${d24.visit_date}</td>
            <td>${d7.visit_date}</td>
          </tr>
          <tr>
            <td>BREASTFEEDING (Y/N)</td>
            <td>${d24.breastfeeding}</td>
            <td>${d7.breastfeeding}</td>
          </tr>
          <tr>
            <td>FEVER (Y/N)</td>
            <td>${d24.fever}</td>
            <td>${d7.fever}</td>
          </tr>
          <tr>
            <td>VAGINAL BLEEDING (Y/N)</td>
            <td>${d24.vaginal_bleeding}</td>
            <td>${d7.vaginal_bleeding}</td>
          </tr>
          <tr>
            <td>FOUL SMELLING VAGINAL DISCHARGE (Y/N)</td>
            <td>${d24.foul_discharge}</td>
            <td>${d7.foul_discharge}</td>
          </tr>
          <tr>
            <td>FAMILY PLANNING TO BE USED:</td>
            <td>${d24.fp_use}</td>
            <td>${d7.fp_use}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 12px;" class="label">Problems Identified, Actions and Referrals made during Post-Partum Visit:</div>
      <div class="notes">${(within24h.notes || '')}${within7d.notes ? ('\n' + within7d.notes) : ''}</div>

      <div class="sig">
        <div></div>
        <div><div class="sig-line">NARCISA B. SEGODINE, R.M.</div></div>
      </div>
    </body>
  </html>`;
};

export const generateClinicalLabReportsHTML = (patient = {}, sections = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk.7B Lot 9 Brgy. G. De Jesu G.M.A., Cavite';
  const clinicContact = 'Contact No. (02) 893-26-48 / 0919-665-23-25';
  const subtitle = 'PHILHEALTH ACCREDITED AND DOH LICENSED';

  const name = patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ') || 'Patient';
  const age = patient.age || '';
  const sex = (patient.gender || 'female').toString().toUpperCase();
  const fmt = (d) => (d ? (() => { try { return new Date(d).toLocaleDateString(); } catch { return String(d); } })() : '');
  const toArr = (d) => Array.isArray(d) ? d : (d ? [d] : []);
  const secArr = (k) => toArr(sections[k]);

  const renderSection = (title, dataOrArray) => {
    const items = toArr(dataOrArray);
    if (!items.length) return '';
    const sorted = items.slice().sort((a, b) => {
      const ad = a?.test_date ? new Date(a.test_date).getTime() : 0;
      const bd = b?.test_date ? new Date(b.test_date).getTime() : 0;
      return ad - bd;
    });
    const groupsMap = {};
    sorted.forEach((d) => {
      const dt = d?.test_date ? new Date(d.test_date) : null;
      const key = dt ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}` : 'nodate';
      if (!groupsMap[key]) groupsMap[key] = [];
      groupsMap[key].push(d);
    });
    const keys = Object.keys(groupsMap).sort((a, b) => {
      if (a === 'nodate') return 1;
      if (b === 'nodate') return -1;
      return a.localeCompare(b);
    });
    const inner = keys.map((key) => {
      const label = key === 'nodate' ? 'No Date' : (() => { try { return new Date(key + '-01').toLocaleString(undefined, { month: 'long', year: 'numeric' }); } catch { return key; } })();
      const block = groupsMap[key].map((data) => {
        const lines = [
          data?.summary || (data?.result_value ? `${data?.result_value}${data?.unit ? ' ' + data?.unit : ''}` : ''),
          data?.details || data?.interpretation || '',
          data?.notes || ''
        ].filter(Boolean).join('\n');
        const dateStr = fmt(data?.test_date);
        const nameStr = data?.test_name || '';
        return `
          <div class="row-2"><div class="sub">${nameStr ? `Test: ${nameStr}` : ''}</div><div style="text-align:right" class="sub">${dateStr ? `Date: ${dateStr}` : ''}</div></div>
          ${lines ? `<div class="box">${lines}</div>` : ''}
        `;
      }).join('');
      return `
        <div class="group">
          <div class="group-title">${label}</div>
          ${block}
        </div>
      `;
    }).join('');
    return `
      <div class="panel">
        <div class="row-2"><div><span class="label">${title}</span></div><div></div></div>
        ${inner}
      </div>
    `;
  };

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Clinical and Laboratory Reports</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #000; }
        .header { display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; margin-bottom: 8px; }
        .logo-box { width: 72px; height: 72px; background: #222; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .clinic { font-weight: bold; font-size: 12pt; }
        .sub { font-size: 9pt; color: #444; }
        .title { text-align: center; font-weight: bold; font-size: 13pt; margin: 6px 0 8px; }
        .panel { border: 1px solid #999; padding: 8px; margin-bottom: 8px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .label { font-weight: bold; }
        .value { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #aaa; display: inline-block; min-width: 160px; }
        .box { border: 1px solid #aaa; padding: 6px; min-height: 48px; white-space: pre-line; }
        .group { margin-bottom: 6px; }
        .group-title { font-weight: bold; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box"><img src="${logoUrl}" alt="Clinic Logo" /></div>
        <div>
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicContact}</div>
          <div class="sub">${subtitle}</div>
        </div>
      </div>

      <div class="title">CLINICAL AND LABORATORY REPORTS</div>

      <div class="panel">
        <div class="row-2"><div><span class="label">Patient:</span> <span class="value">${name}</span></div><div><span class="label">Age/Sex:</span> <span class="value">${age} / ${sex}</span></div></div>
      </div>

      ${renderSection('ULTRASOUND RESULT', secArr('ultrasound'))}
      ${renderSection('URINALYSIS RESULT', secArr('urinalysis'))}
      ${renderSection('CERVICAL SCREENING RESULT', secArr('cervical_screening'))}
      ${renderSection('PREGNANCY TESTS', secArr('pregnancy'))}
      ${(() => {
      const cItems = secArr('cbc');
      const bItems = secArr('blood_typing');
      if (!cItems.length && !bItems.length) return '';
      const inner = [
        ...cItems.map(ci => ({ test_name: ci.test_name || 'CBC', test_date: ci.test_date, summary: ci.result_value ? `CBC: ${ci.result_value}${ci.unit ? ' ' + ci.unit : ''}` : '', notes: ci.notes || '' })),
        ...bItems.map(bi => ({ test_name: bi.test_name || 'Blood Typing', test_date: bi.test_date, summary: bi.result_value ? `Blood Type: ${bi.result_value}` : '', notes: bi.notes || '' }))
      ];
      return renderSection('CBC AND BLOOD TYPING', inner);
    })()}
      ${(() => {
      const vItems = secArr('vdrl');
      const hItems = secArr('hepa_b');
      if (!vItems.length && !hItems.length) return '';
      const inner = [
        ...vItems.map(vi => ({ test_name: vi.test_name || 'VDRL/RPR', test_date: vi.test_date, summary: vi.result_value ? `VDRL/RPR: ${vi.result_value}` : '', notes: vi.interpretation || vi.notes || '' })),
        ...hItems.map(hi => ({ test_name: hi.test_name || 'HBsAg', test_date: hi.test_date, summary: hi.result_value ? `HBsAg: ${hi.result_value}` : '', notes: hi.interpretation || hi.notes || '' }))
      ];
      return renderSection('VDRL AND HEPA B SCREENING TEST RESULT', inner);
    })()}
      ${renderSection('OTHER LAB TESTS', secArr('others'))}

    </body>
  </html>`;
};

export const generateSinglePostpartumAssessmentHTML = (patient = {}, assessment = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk.7B Lot 9 Brgy. G. De Jesu G.M.A., Cavite';
  const clinicContact = 'Contact No. (02) 893-26-48 / 0919-665-23-25';
  const subtitle = 'PHILHEALTH ACCREDITED AND DOH LICENSED';
  const name = patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ') || patient.name || 'Patient';
  const fmtDate = (d) => (d ? (() => { try { return new Date(d).toLocaleDateString(); } catch { return String(d); } })() : '');
  const yesNo = (v) => (v ? 'YES' : 'NO');
  const bleeding = (() => {
    if (typeof assessment.vaginal_bleeding !== 'undefined' && assessment.vaginal_bleeding !== null) return yesNo(!!assessment.vaginal_bleeding);
    if (typeof assessment.bleeding_status !== 'undefined' && assessment.bleeding_status !== null) return String(assessment.bleeding_status);
    return '';
  })();
  const feverYN = (() => {
    if (typeof assessment.fever !== 'undefined' && assessment.fever !== null) return yesNo(!!assessment.fever);
    const n = Number(assessment.temperature);
    if (!isFinite(n)) return '';
    return n >= 38 ? 'YES' : 'NO';
  })();
  const foul = (() => {
    if (typeof assessment.foul_smell_discharge !== 'undefined' && assessment.foul_smell_discharge !== null) return yesNo(!!assessment.foul_smell_discharge);
    return '';
  })();
  const fp = assessment.family_planning_method || assessment.fp_use || '';
  const dateStr = fmtDate(assessment.assessment_date);
  const breastfeeding = assessment.breastfeeding_status || '';
  const notes = assessment.notes || '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${clinicName} Postpartum Assessment</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;font-size:11pt;color:#000} .header{display:grid;grid-template-columns:80px 1fr;align-items:center;column-gap:12px;margin-bottom:8px} .logo-box{width:72px;height:72px;background:#222;display:flex;align-items:center;justify-content:center;border-radius:6px;overflow:hidden} .logo-box img{max-width:100%;max-height:100%;object-fit:contain} .clinic{font-weight:bold;font-size:12pt} .sub{font-size:10pt;color:#555} .sub2{font-size:10pt;color:#222} 
  .title{font-weight:bold;text-align:center;margin:8px 0 12px} table{width:100%;border-collapse:collapse} td{border:1px solid #888;padding:6px;vertical-align:top} .label{font-weight:bold;color:#111} .value{color:#000;font-weight:bold} .row-gap{height:8px} .box{border:1px solid #999;padding:8px;white-space:pre-line}</style></head><body><div class="header">${logoUrl ? `<div class='logo-box'><img src='${logoUrl}'/></div>` : ''}<div><div class="clinic">${clinicName}</div><div class="sub">${clinicAddress}</div><div class="sub2">${clinicContact}</div><div class="sub">${subtitle}</div></div></div><div class="title">POSTPARTUM ASSESSMENT</div><table><tr><td class="label" style="width:28%">PATIENT NAME</td><td class="value">${name}</td></tr><tr><td class="label">DATE OF ASSESSMENT</td><td class="value">${dateStr}</td></tr><tr><td class="label">DAY POSTPARTUM</td><td class="value">${assessment.day_postpartum ?? ''}</td></tr><tr><td class="label">BREASTFEEDING</td><td class="value">${breastfeeding}</td></tr><tr><td class="label">FEVER</td><td class="value">${feverYN}</td></tr><tr><td class="label">VAGINAL BLEEDING</td><td class="value">${bleeding}</td></tr><tr><td class="label">FOUL-SMELLED DISCHARGE</td><td class="value">${foul}</td></tr><tr><td class="label">FAMILY PLANNING METHOD</td><td class="value">${fp}</td></tr></table><div class="row-gap"></div><div class="label">NOTES</div><div class="box">${notes}</div></body></html>`;
};

export const generateSingleLabTestHTML = (patient = {}, test = {}, logoUrl) => {
  const clinicName = 'N.B. Segodine Lying-In Clinic';
  const clinicAddress = 'Blk.7B Lot 9 Brgy. G. De Jesu G.M.A., Cavite';
  const clinicContact = 'Contact No. (02) 893-26-48 / 0919-665-23-25';
  const subtitle = 'PHILHEALTH ACCREDITED AND DOH LICENSED';

  const name = patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ') || 'Patient';
  const age = patient.age || '';
  const sex = (patient.gender || 'female').toString().toUpperCase();
  const fmt = (d) => (d ? (() => { try { return new Date(d).toLocaleDateString(); } catch { return String(d); } })() : '');
  const tName = test.test_name || test.test_type || 'Lab Test';
  const dateStr = fmt(test.test_date);
  const valueStr = test.result_value ? `${test.result_value}${test.unit ? ' ' + test.unit : ''}` : '';
  const refRange = test.reference_range || test.normal_range || '';
  const labName = test.lab_name || '';
  const orderedBy = test.ordered_by || '';
  const category = (() => {
    const raw = test.test_category || '';
    if (!raw) return '';
    const s = String(raw).replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  const unitOnly = test.unit || '';
  const status = (() => {
    const v = test.status || '';
    if (!v) return '';
    const map = { Normal: 'Normal', Abnormal: 'Abnormal', Critical: 'Critical', Pending: 'Pending' };
    const lower = String(v).toLowerCase();
    const lowerMap = { normal: 'Normal', abnormal: 'Abnormal', critical: 'Critical', pending: 'Pending', completed: 'Normal' };
    return map[v] || lowerMap[lower] || v;
  })();
  const notes = test.notes || test.details || test.interpretation || '';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${clinicName} Lab Test Result</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #000; }
        .header { display: grid; grid-template-columns: 80px 1fr; align-items: center; column-gap: 12px; margin-bottom: 8px; }
        .logo-box { width: 72px; height: 72px; background: #222; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .clinic { font-weight: bold; font-size: 12pt; }
        .sub { font-size: 9pt; color: #444; }
        .title { text-align: center; font-weight: bold; font-size: 13pt; margin: 6px 0 8px; }
        .panel { border: 1px solid #999; padding: 8px; margin-bottom: 8px; }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 12px; margin-bottom: 6px; }
        .row-1 { display: grid; grid-template-columns: 1fr; margin-bottom: 6px; }
        .label { font-weight: bold; }
        .value { font-weight: bold; font-size: 11pt; border-bottom: 1px solid #aaa; display: inline-block; min-width: 160px; }
        .box { border: 1px solid #aaa; padding: 6px; min-height: 48px; white-space: pre-line; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box"><img src="${logoUrl}" alt="Clinic Logo" /></div>
        <div>
          <div class="clinic">${clinicName}</div>
          <div class="sub">${clinicAddress}</div>
          <div class="sub">${clinicContact}</div>
          <div class="sub">${subtitle}</div>
        </div>
      </div>

      <div class="title">LAB TEST RESULT</div>

      <div class="panel">
        <div class="row-2"><div><span class="label">Patient:</span> <span class="value">${name}</span></div><div><span class="label">Age/Sex:</span> <span class="value">${age} / ${sex}</span></div></div>
      </div>

      <div class="panel">
        <div class="row-2"><div><span class="label">Test:</span> <span class="value">${tName}</span></div><div style="text-align:right" class="sub">${dateStr ? `Date: ${dateStr}` : ''}</div></div>
        ${category ? `<div class="row-1"><span class="label">Category:</span> <span class="value">${category}</span></div>` : ''}
        ${valueStr ? `<div class="row-1"><span class="label">Result:</span> <span class="value">${valueStr}</span></div>` : ''}
        ${refRange ? `<div class="row-1"><span class="label">Reference Range:</span> <span class="value">${refRange}</span></div>` : ''}
        ${unitOnly && !valueStr ? `<div class="row-1"><span class="label">Unit:</span> <span class="value">${unitOnly}</span></div>` : ''}
        ${status ? `<div class="row-1"><span class="label">Status:</span> <span class="value">${status}</span></div>` : ''}
        ${labName || orderedBy ? `<div class="row-2"><div><span class="label">Laboratory:</span> <span class="value">${labName}</span></div><div><span class="label">Ordered By:</span> <span class="value">${orderedBy}</span></div></div>` : ''}
        ${notes ? `<div class="box">${notes}</div>` : ''}
      </div>

    </body>
  </html>`;
};
