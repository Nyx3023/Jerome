import React from 'react';

export const ViewProcedureModal = ({ procedure, onClose, onPrint }) => {
  if (!procedure) return null;
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold">Procedure Details</h2>
        <div className="flex items-center gap-2">
          {onPrint && (
            <button onClick={onPrint} className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600">Print PDF</button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="font-medium"><span className="text-sm text-gray-600">Procedure Type:</span> {procedure.procedure_type || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Date Performed:</span> {procedure.date_performed ? new Date(procedure.date_performed).toLocaleDateString() : 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> {procedure.status || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Healthcare Provider:</span> {procedure.healthcare_provider || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Location:</span> {procedure.location || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Duration (minutes):</span> {procedure.duration_minutes != null ? procedure.duration_minutes : 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Anesthesia Type:</span> {procedure.anesthesia_type || 'N/A'}</div>
        <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Complications:</span> {procedure.complications || 'None'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Outcome:</span> {procedure.outcome || 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Required:</span> {procedure.follow_up_required ? 'Yes' : 'No'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Next Appointment:</span> {procedure.next_appointment ? new Date(procedure.next_appointment).toLocaleDateString() : 'N/A'}</div>
        <div className="md:col-span-2 font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {procedure.notes || 'None'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Cost:</span> {procedure.cost != null ? `₱${Number(procedure.cost).toFixed(2)}` : 'N/A'}</div>
        <div className="font-medium"><span className="text-sm text-gray-600">Insurance Covered:</span> {procedure.insurance_covered ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};
