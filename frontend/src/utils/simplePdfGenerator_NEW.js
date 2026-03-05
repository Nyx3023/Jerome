// Temporary file - birth plan function only
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

  const motherChecklist = (birthPlan.checklist_mother || '').trim();
  const babyChecklist = (birthPlan.checklist_baby || '').trim();

  const defaultMotherItems = [
    'Damit ( duster, shirt, pajama, medyas at underwear)',
    'Kumot',
    'Adult diaper at napkin',
    'Gamit na panlinis',
    'Mga gamit/ kutsara at kutsarita (disposables)',
    'Under pads o lampin (hindi cotton) 10 pcs',
    'Baby wipes',
    'Sanitizer (pang)',
    'Panty',
    'Sanitizer (mattress pad)'
  ];
  
  const defaultBabyItems = [
    'Damit ng baby (baro, pantalon)',
    'Lampin 5 pcs (hindi cotton)',
    'Pamunas 6 pcs (hindi cotton)',
    'baby bag',
    'diaper (newborn)',
    'baby wipes',
    'sakit',
    'Pambolbol as ulo (blanket) at paa',
    'kayo ( use)',
    'baby ( use)'
  ];

  const motherItems = motherChecklist ? motherChecklist.split(/\n|,\s*/).filter(Boolean) : defaultMotherItems;
  const babyItems = babyChecklist ? babyChecklist.split(/\n|,\s*/).filter(Boolean) : defaultBabyItems;

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
          <span class="inline-label">Gusto ko ring marinig ang:</span>
          <span class="form-value-short"></span>
          <span class="spacer"></span>
          <span class="inline-label">Gravida:</span>
          <span class="form-value-short">${gravida || ''}</span>
          <span class="spacer"></span>
          <span class="inline-label">Para:</span>
          <span class="form-value-short">${para || ''}</span>
        </div>

        <div class="form-row">
          <span class="inline-label">May handa na ba kayong pangalan ng:</span>
          <span class="spacer"></span>
          <span class="inline-label">Lalaki:</span>
          <span class="form-value-short"></span>
          <span class="spacer"></span>
          <span class="inline-label">Babae:</span>
          <span class="form-value-short"></span>
        </div>

        <div class="form-row">
          <span class="inline-label">Ida ng kapirasasyon kung may sarukusyon ng karapaanan:</span>
          <span class="form-value-short"></span>
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
