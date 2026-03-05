import React from 'react';

export const ViewAdmissionModal = ({ admission, onClose, onPrintForm, onPrintDischarge, onPrintNewbornDischarge, onPrintDelivery }) => {
  if (!admission) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admission Details</h2>
        <div className="flex items-center gap-2">
          {onPrintForm && (
            <button onClick={onPrintForm} className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600">Print Form</button>
          )}
          {onPrintDischarge && (
            <button onClick={onPrintDischarge} className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Discharge PDF</button>
          )}
          {onPrintNewbornDischarge && (
            <button onClick={onPrintNewbornDischarge} className="px-2 py-1 text-xs bg-yellow-700 text-white rounded hover:bg-yellow-600">Newborn Discharge</button>
          )}
          {onPrintDelivery && (
            <button onClick={onPrintDelivery} className="px-2 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600">Delivery Record</button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="font-medium"><span className="text-sm text-gray-600">Patient:</span> {admission.display_patient_name || 'Unknown'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Contact:</span> {admission.display_contact_number || '—'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Admission ID:</span> {admission.id}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> {admission.status}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Admitted:</span> {admission.admitted_at ? new Date(admission.admitted_at).toLocaleString() : '—'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Room:</span> {admission.room || 'Not assigned'}</div>
        {admission.pregnancy_cycle && (
          <div className="font-medium"><span className="text-sm text-gray-600">Cycle of Pregnancy:</span> {admission.pregnancy_cycle}</div>
        )}
        <div className="md:col-span-2 font-medium"><span className="text-sm text-gray-600">Reason:</span> {admission.admission_reason || '—'}</div>
        {admission.emergency_contact_name && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="font-medium"><span className="text-sm text-gray-600">Emergency Contact:</span> {admission.emergency_contact_name}</div>
            <div className="font-medium"><span className="text-sm text-gray-600">Phone:</span> {admission.emergency_contact_phone || '—'}</div>
          </div>
        )}
        {(admission.discharged_at || admission.discharge_notes || admission.disposition) && (
          <div className="md:col-span-2 space-y-1">
            {admission.discharged_at && (
              <div className="font-medium"><span className="text-sm text-gray-600">Discharged At:</span> {new Date(admission.discharged_at).toLocaleString()}</div>
            )}
            {admission.disposition && (
              <div className="font-medium"><span className="text-sm text-gray-600">Disposition:</span> {admission.disposition}</div>
            )}
            {admission.discharge_notes && (
              <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {admission.discharge_notes}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
