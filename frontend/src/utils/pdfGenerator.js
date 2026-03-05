// PDF Generation utility using jsPDF
// Note: You'll need to install jsPDF: npm install jspdf jspdf-autotable

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateMedicalRecordPDF = (patientData, medicalRecords) => {
  const doc = new jsPDF();
  const margin = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 116, 166);
  doc.text('Medical Records Report', margin, 30);
  
  // Patient Information
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Patient Information', margin, 50);
  
  doc.setFontSize(11);
  const patientInfo = [
    ['Patient Name:', patientData.name || 'N/A'],
    ['Email:', patientData.email || 'N/A'],
    ['Phone:', patientData.phone || 'N/A'],
    ['Age:', patientData.age || 'N/A'],
    ['Gender:', patientData.gender || 'N/A'],
    ['Report Generated:', new Date().toLocaleDateString()]
  ];

  let yPosition = 60;
  patientInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), margin + 80, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
  });

  // Medical Records Table
  if (medicalRecords && medicalRecords.length > 0) {
    yPosition += 20;
    doc.setFontSize(14);
    doc.text('Medical Records History', margin, yPosition);
    
    const tableData = medicalRecords.map(record => [
      new Date(record.appointment_date).toLocaleDateString(),
      record.service_type || 'N/A',
      record.diagnosis || 'N/A',
      record.doctor_notes || 'N/A',
      record.treatment_given || 'N/A'
    ]);

    doc.autoTable({
      startY: yPosition + 10,
      head: [['Date', 'Service', 'Diagnosis', 'Notes', 'Treatment']],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 116, 166] },
      columnStyles: {
        3: { cellWidth: 40 }, // Notes column wider
        4: { cellWidth: 40 }  // Treatment column wider
      }
    });
  }

  return doc;
};

export const generateAppointmentHistoryPDF = (appointments, filters = {}) => {
  const doc = new jsPDF();
  const margin = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 116, 166);
  doc.text('Appointment History Report', margin, 30);
  
  // Report Info
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated on:', margin, 45);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date().toLocaleDateString(), margin + 60, 45);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Appointments:', margin, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(String(appointments.length), margin + 80, 55);
  doc.setFont('helvetica', 'normal');

  // Filters applied
  let yPos = 65;
  if (filters.dateFrom || filters.dateTo) {
    doc.setFont('helvetica', 'normal');
    doc.text('Date Range:', margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'}`, margin + 70, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
  }
  if (filters.status) {
    doc.setFont('helvetica', 'normal');
    doc.text('Status Filter:', margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(String(filters.status), margin + 70, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
  }

  // Appointments Table
  if (appointments && appointments.length > 0) {
    const tableData = appointments.map(apt => [
      new Date(apt.date).toLocaleDateString(),
      apt.time_slot,
      apt.patient_name,
      apt.service_type,
      apt.request_status,
      apt.appointment_status || 'N/A'
    ]);

    doc.autoTable({
      startY: yPos + 10,
      head: [['Date', 'Time', 'Patient', 'Service', 'Request Status', 'Appointment Status']],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 116, 166] }
    });
  }

  return doc;
};

export const generateDoctorPerformancePDF = (doctorData, performanceMetrics) => {
  const doc = new jsPDF();
  const margin = 20;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 116, 166);
  doc.text('Doctor Performance Report', margin, 30);
  
  // Report period
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Report Period:', margin, 45);
  doc.setFont('helvetica', 'bold');
  doc.text(String(performanceMetrics.period || 'All Time'), margin + 70, 45);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated on:', margin, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date().toLocaleDateString(), margin + 70, 55);
  doc.setFont('helvetica', 'normal');

  // Performance Metrics
  doc.setFontSize(14);
  doc.text('Performance Summary', margin, 75);
  
  const metrics = [
    ['Total Appointments:', performanceMetrics.totalAppointments || 0],
    ['Completed Appointments:', performanceMetrics.completedAppointments || 0],
    ['Completion Rate:', `${performanceMetrics.completionRate || 0}%`],
    ['Average Rating:', `${performanceMetrics.averageRating || 'N/A'}/5`],
    ['Total Patients Served:', performanceMetrics.totalPatients || 0],
    ['Medical Records Created:', performanceMetrics.medicalRecords || 0]
  ];

  let yPosition = 85;
  metrics.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), margin + 120, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
  });

  // Recent Appointments Table
  if (performanceMetrics.recentAppointments && performanceMetrics.recentAppointments.length > 0) {
    yPosition += 20;
    doc.setFontSize(14);
    doc.text('Recent Appointments', margin, yPosition);
    
    const tableData = performanceMetrics.recentAppointments.map(apt => [
      new Date(apt.date).toLocaleDateString(),
      apt.patient_name,
      apt.service_type,
      apt.appointment_status,
      apt.feedback_rating ? `${apt.feedback_rating}/5` : 'No Rating'
    ]);

    doc.autoTable({
      startY: yPosition + 10,
      head: [['Date', 'Patient', 'Service', 'Status', 'Rating']],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 116, 166] }
    });
  }

  return doc;
};

export const downloadPDF = (doc, filename) => {
  try {
    doc.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
};
