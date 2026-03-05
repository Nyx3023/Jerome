import React, { useEffect, useState } from 'react';
import axios from '../../utils/axiosConfig';

// Shared Baby View Modal that supports both registered and walk-in shapes
export const ViewBabyModal = ({ baby, onClose, onPrintAdmissionForm, onPrintDischargePDF, onPrintDeliveryRecord }) => {
  if (!baby) return null;

  const normalized = {
    name:
      baby.full_name ||
      baby.baby_name ||
      [baby.first_name, baby.middle_name, baby.last_name].filter(Boolean).join(' ') ||
      'Baby',
    birthDate: baby.birth_date || null,
    birthTime: baby.birth_time || null,
    gender: baby.gender || null,
    weightKg: baby.birth_weight_kg ?? baby.birth_weight ?? null,
    lengthCm: baby.birth_length_cm ?? baby.birth_length ?? null,
    headCircumferenceCm: baby.head_circumference_cm ?? baby.head_circumference ?? null,
    apgar1: baby.apgar_1min ?? baby.apgar_1_min ?? null,
    apgar5: baby.apgar_5min ?? baby.apgar_5_min ?? null,
    bloodType: baby.blood_type || null,
    status: baby.status || null,
    complications: baby.complications || null,
    notes: baby.notes || null,
  };

  const [admissions, setAdmissions] = useState([]);
  const [loadingAdm, setLoadingAdm] = useState(false);
  const [admError, setAdmError] = useState('');

  useEffect(() => {
    const loadAdmissions = async () => {
      try {
        setLoadingAdm(true);
        setAdmError('');
        if (baby.id) {
          const res = await axios.get(`/api/clinic/babies/${baby.id}/admissions`);
          setAdmissions(Array.isArray(res.data) ? res.data : []);
        } else {
          setAdmissions([]);
        }
      } catch (e) {
        setAdmError(e?.response?.data?.error || 'Failed to load admissions');
        setAdmissions([]);
      } finally {
        setLoadingAdm(false);
      }
    };
    loadAdmissions();
  }, [baby?.id]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold">Baby Record Details</h2>
        <div className="flex items-center gap-2">
          {onPrintAdmissionForm && (
            <button onClick={onPrintAdmissionForm} className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600">Admission Form</button>
          )}
          {onPrintDischargePDF && (
            <button onClick={onPrintDischargePDF} className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600">Discharge PDF</button>
          )}
          {onPrintDeliveryRecord && (
            <button onClick={onPrintDeliveryRecord} className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700">Delivery Room</button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Name:</span> {normalized.name}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Birth Date:</span> {normalized.birthDate ? new Date(normalized.birthDate).toLocaleDateString() : 'N/A'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Birth Time:</span> {normalized.birthTime || 'N/A'}</div>
          <div className="font-medium capitalize"><span className="text-sm text-gray-600">Gender:</span> {normalized.gender || 'N/A'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Weight:</span> {normalized.weightKg != null ? `${normalized.weightKg} kg` : 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Length:</span> {normalized.lengthCm != null ? `${normalized.lengthCm} cm` : 'N/A'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Head Circumference:</span> {normalized.headCircumferenceCm != null ? `${normalized.headCircumferenceCm} cm` : 'N/A'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">APGAR Scores:</span> {normalized.apgar1 ?? '-'} / {normalized.apgar5 ?? '-'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium"><span className="text-sm text-gray-600">Blood Type:</span> {normalized.bloodType || 'Unknown'}</div>
          <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> {normalized.status || 'active'}</div>
        </div>

        {normalized.complications && (
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Complications:</span> {normalized.complications}</div>
        )}

        {normalized.notes && (
          <div className="font-medium whitespace-pre-line"><span className="text-sm text-gray-600">Notes:</span> {normalized.notes}</div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Admission History</h3>
            {loadingAdm && <span className="text-sm text-gray-500">Loading...</span>}
          </div>
          {admError && (
            <div className="text-sm text-red-600 mb-2">{admError}</div>
          )}
          {admissions.length === 0 && !loadingAdm ? (
            <div className="text-sm text-gray-500">No newborn admissions found</div>
          ) : (
            <div className="space-y-2">
              {admissions.map((adm) => (
                <div key={adm.id} className="border rounded p-3">
                  <div className="flex justify-between">
                    <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> {adm.status || 'admitted'}</div>
                    <div className="text-sm text-gray-600">
                      <span className="text-sm text-gray-600">Admitted:</span> {adm.date_admitted ? new Date(adm.date_admitted).toLocaleDateString() : '—'}
                      {adm.date_discharge ? ` • Discharged: ${new Date(adm.date_discharge).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  {adm.admitting_diagnosis && (
                    <div className="text-sm mt-1"><span className="text-sm text-gray-600">Diagnosis:</span> {adm.admitting_diagnosis}</div>
                  )}
                  {adm.notes && (
                    <div className="text-sm text-gray-700 mt-1"><span className="text-sm text-gray-600">Notes:</span> {adm.notes}</div>
                  )}
                  {(adm.home_medication || adm.follow_up) && (
                    <div className="text-xs text-gray-600 mt-2">
                      {adm.home_medication ? `Home meds: ${adm.home_medication}` : ''}
                      {adm.home_medication && adm.follow_up ? ' • ' : ''}
                      {adm.follow_up ? `Follow-up: ${adm.follow_up}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
