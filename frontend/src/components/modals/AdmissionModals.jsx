/**
 * Shared Admission Modal Components
 * Used by both PatientRecordEnhanced (online patients) and WalkInPatientEnhanced (walk-in patients)
 * 
 * Props patterns:
 * - For online patients: { patientId, profile, onClose, onSuccess }
 * - For walk-in patients: { walkInName, walkInContact, onClose, onSuccess }
 * 
 * The component detects which type based on the presence of patientId vs walkInName
 */

import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

// Helper to determine if this is a walk-in patient
const isWalkInPatient = (props) => !props.patientId && (props.walkInName || props.walkInContact);

// Helper to get patient display info
const getPatientInfo = (props) => {
    if (isWalkInPatient(props)) {
        return {
            name: props.walkInName || '',
            contact: props.walkInContact || '',
            type: 'walk-in',
            typeLabel: 'Walk-in Patient',
            typeBgColor: 'bg-orange-50',
            typeTextColor: 'text-orange-800'
        };
    } else {
        const profile = props.profile || {};
        const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ');
        return {
            name: fullName || '',
            contact: profile.phone || '',
            email: profile.email || '',
            userId: profile.user_id || props.patientId,
            type: 'registered',
            typeLabel: 'Registered Patient',
            typeBgColor: 'bg-blue-50',
            typeTextColor: 'text-blue-800'
        };
    }
};

/**
 * Add Admission Modal - Works for both online and walk-in patients
 */
export const AddAdmissionModal = (props) => {
    const { onClose, onSuccess, patientId, profile } = props;
    const patientInfo = getPatientInfo(props);
    const isWalkIn = patientInfo.type === 'walk-in';

    // Pre-fill Gravida and Para from profile
    const initialGravida = (!isWalkIn && profile?.gravida) ? String(profile.gravida) : '';
    const initialPara = (!isWalkIn && profile?.para) ? String(profile.para) : '';
    const initialPregnancyCycle = (initialGravida || initialPara)
        ? `G${initialGravida || '0'}P${initialPara || '0'}`
        : '';

    const [formData, setFormData] = useState({
        booking_id: '',
        user_id: patientInfo.userId || patientId || null,
        patient_name: patientInfo.name,
        contact_number: patientInfo.contact,
        admission_reason: 'In labor',
        pregnancy_cycle: initialPregnancyCycle,
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
    const [cycleOptions, setCycleOptions] = useState([]);
    const [loadingCycles, setLoadingCycles] = useState(false);
    const [physicalExam, setPhysicalExam] = useState({
        skin: '',
        conjunctiva: '',
        breast: '',
        abdomen: '',
        extremities: ''
    });

    // Load pregnancy cycles
    useEffect(() => {
        const loadCycles = async () => {
            try {
                setLoadingCycles(true);
                if (!isWalkIn && patientId) {
                    // Registered patient
                    const res = await axios.get(`/api/clinic/prenatal-schedule/${patientInfo.userId || patientId}`);
                    const records = res.data || [];
                    const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(Boolean))).sort((a, b) => a - b);
                    const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
                    setCycleOptions(opts);
                } else if (isWalkIn) {
                    // Walk-in patient
                    const name = (patientInfo.name || '').trim();
                    const contact = (patientInfo.contact || '').trim();
                    if (!name || !contact) { setCycleOptions([]); return; }
                    const res = await axios.get('/api/admin/walkin/prenatal', { params: { patient_name: name, contact_number: contact } });
                    const records = res.data || [];
                    const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(Boolean))).sort((a, b) => a - b);
                    const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
                    setCycleOptions(opts);
                }
            } catch (e) {
                console.error('Error loading cycles:', e);
                setCycleOptions([]);
            } finally {
                setLoadingCycles(false);
            }
        };
        loadCycles();
    }, [patientId, patientInfo.name, patientInfo.contact, isWalkIn, patientInfo.userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submissionData = {
                ...formData,
                baby_weight_kg: formData.baby_weight_kg ? parseFloat(formData.baby_weight_kg) : null,
                apgar1: formData.apgar1 ? parseInt(formData.apgar1) : null,
                apgar5: formData.apgar5 ? parseInt(formData.apgar5) : null,
                booking_id: formData.booking_id || null,
                patient_type: isWalkIn ? 'walk-in' : 'registered',
                existing_user_id: !isWalkIn ? formData.user_id : null
            };

            // Add physical exam notes for registered patients
            if (!isWalkIn) {
                const peHas = Object.values(physicalExam).some(v => String(v || '').trim() !== '');
                if (peHas) {
                    submissionData.notes = JSON.stringify({ physical_exam: physicalExam });
                }
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

            {/* Patient Type Display */}
            <div className={`mb-4 p-3 ${patientInfo.typeBgColor} rounded`}>
                <div className={`text-sm ${patientInfo.typeTextColor}`}>
                    <div><strong>Patient Type:</strong> {patientInfo.typeLabel}</div>
                    <div><strong>Name:</strong> {patientInfo.name || 'Not provided'}</div>
                    <div><strong>Contact:</strong> {patientInfo.contact || 'Not provided'}</div>
                    {patientInfo.email && <div><strong>Email:</strong> {patientInfo.email}</div>}
                    <div className="text-xs mt-1 opacity-75">
                        {isWalkIn ? 'Adding admission for a walk-in patient' : 'Adding admission for an existing registered patient'}
                    </div>
                </div>
            </div>

            {/* Medical Safety Alerts - For Registered Patients */}
            {!isWalkIn && profile && (profile.blood_type || profile.allergies || profile.is_high_risk) && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                        ⚠️ MEDICAL ALERTS
                    </h3>
                    <div className="space-y-2 text-sm">
                        {profile.blood_type && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-red-900">Blood Type:</span>
                                <span className="px-2 py-1 bg-red-100 text-red-900 font-bold rounded">{profile.blood_type}</span>
                            </div>
                        )}
                        {profile.allergies && (
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-red-900">Allergies:</span>
                                <span className="text-red-900 font-medium">{profile.allergies}</span>
                            </div>
                        )}
                        {profile.is_high_risk && (
                            <div className="bg-red-100 p-2 rounded border border-red-300">
                                <span className="text-red-800 font-bold">⚠️ HIGH RISK PREGNANCY</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Patient Information */}
                <div className="border-b pb-4">
                    <h3 className="font-medium text-gray-800 mb-3">Patient Information</h3>
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

                        {!isWalkIn && (
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
                        )}

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
                                {isWalkIn && <option value="Miscarriage">Miscarriage</option>}
                                {isWalkIn && <option value="Other">Other</option>}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Baby Weight (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
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

                {/* Physical Examination (Only for registered patients) */}
                {!isWalkIn && (
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
                )}

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

/**
 * Edit Admission Modal - Works for both online and walk-in patients
 */
export const EditAdmissionModal = ({ admission, profile, onClose, onSuccess }) => {
    const isWalkIn = admission?.patient_type === 'walk-in' || (!admission?.user_id && !admission?.patient_id);

    const [formData, setFormData] = useState({
        patient_name: admission?.patient_name || admission?.display_patient_name || '',
        contact_number: admission?.contact_number || admission?.display_contact_number || '',
        admission_reason: admission?.admission_reason || '',
        pregnancy_cycle: admission?.pregnancy_cycle || '',
        gravida: (() => { const m = String(admission?.pregnancy_cycle || '').match(/G(\d+)/); return m ? m[1] : ''; })(),
        para: (() => { const m = String(admission?.pregnancy_cycle || '').match(/P(\d+)/); return m ? m[1] : ''; })(),
        room: admission?.room || '',
        status: admission?.status || 'admitted',
        delivery_type: admission?.delivery_type || '',
        outcome: admission?.outcome || '',
        baby_weight_kg: admission?.baby_weight_kg || '',
        apgar1: admission?.apgar1 || '',
        apgar5: admission?.apgar5 || '',
        complications: admission?.complications || '',
        disposition: admission?.disposition || ''
    });
    const [loading, setLoading] = useState(false);
    const [cycleOptions, setCycleOptions] = useState([]);
    const [loadingCycles, setLoadingCycles] = useState(false);

    // Parse notes for physical exam (registered patients)
    const parseNotesObj = (n) => {
        if (!n) return {};
        if (typeof n === 'string') {
            try { const obj = JSON.parse(n); return (obj && typeof obj === 'object') ? obj : {}; } catch (e) { return {}; }
        }
        return (n && typeof n === 'object') ? n : {};
    };
    const initialNotesObj = parseNotesObj(admission?.notes);
    const [physicalExam, setPhysicalExam] = useState({
        skin: initialNotesObj.physical_exam?.skin || '',
        conjunctiva: initialNotesObj.physical_exam?.conjunctiva || '',
        breast: initialNotesObj.physical_exam?.breast || '',
        abdomen: initialNotesObj.physical_exam?.abdomen || '',
        extremities: initialNotesObj.physical_exam?.extremities || ''
    });

    // Load cycles
    useEffect(() => {
        const loadCycles = async () => {
            try {
                setLoadingCycles(true);
                if (!isWalkIn && admission?.user_id) {
                    const res = await axios.get(`/api/clinic/prenatal-schedule/${admission.user_id}`);
                    const records = res.data || [];
                    const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(Boolean))).sort((a, b) => a - b);
                    const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
                    setCycleOptions(opts);
                } else {
                    const name = String(admission?.patient_name || admission?.display_patient_name || '').trim();
                    const contact = String(admission?.contact_number || admission?.display_contact_number || '').trim();
                    if (!name || !contact) { setCycleOptions([]); return; }
                    const res = await axios.get('/api/admin/walkin/prenatal', { params: { patient_name: name, contact_number: contact } });
                    const records = res.data || [];
                    const uniq = Array.from(new Set(records.map(r => r.pregnancy_id).filter(Boolean))).sort((a, b) => a - b);
                    const opts = uniq.map(pid => ({ value: `Cycle ${pid}`, label: `Cycle ${pid}` }));
                    setCycleOptions(opts);
                }
            } catch (e) {
                setCycleOptions([]);
            } finally {
                setLoadingCycles(false);
            }
        };
        loadCycles();
    }, [admission, isWalkIn]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submissionData = { ...formData };

            // Add physical exam for registered patients
            if (!isWalkIn) {
                const peHas = Object.values(physicalExam).some(v => String(v || '').trim() !== '');
                if (peHas) {
                    submissionData.notes = JSON.stringify({ physical_exam: physicalExam });
                }
            }

            await axios.put(`/api/admin/admissions/${admission.id}`, submissionData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating admission:', error);
            alert(error.response?.data?.error || 'Failed to update admission');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Admission #{admission?.id}</h2>

            {/* Patient Type Display */}
            <div className={`mb-4 p-3 ${isWalkIn ? 'bg-orange-50' : 'bg-blue-50'} rounded`}>
                <div className={`text-sm ${isWalkIn ? 'text-orange-800' : 'text-blue-800'}`}>
                    <div><strong>{isWalkIn ? 'Walk-in Patient' : 'Registered Patient'}</strong></div>
                    <div><strong>Admitted:</strong> {admission?.admitted_at && new Date(admission.admitted_at).toLocaleString()}</div>
                </div>
            </div>

            {/* Medical Safety Alerts - For Registered Patients */}
            {!isWalkIn && profile && (profile.blood_type || profile.allergies || profile.is_high_risk) && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                        ⚠️ MEDICAL ALERTS
                    </h3>
                    <div className="space-y-2 text-sm">
                        {profile.blood_type && (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-red-900">Blood Type:</span>
                                <span className="px-2 py-1 bg-red-100 text-red-900 font-bold rounded">{profile.blood_type}</span>
                            </div>
                        )}
                        {profile.allergies && (
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-red-900">Allergies:</span>
                                <span className="text-red-900 font-medium">{profile.allergies}</span>
                            </div>
                        )}
                        {profile.is_high_risk && (
                            <div className="bg-red-100 p-2 rounded border border-red-300">
                                <span className="text-red-800 font-bold">⚠️ HIGH RISK PREGNANCY</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                            />
                        </div>
                    </div>
                </div>

                {/* Admission Details */}
                <div className="border-b pb-4">
                    <h3 className="font-medium text-gray-800 mb-3">Admission Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Room</label>
                            <input
                                type="text"
                                value={formData.room}
                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                className="w-full p-2 border rounded"
                                placeholder="Room number or name"
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
                            <label className="block text-sm font-medium mb-1">Cycle of Pregnancy</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="w-full p-2 border rounded"
                                    value={formData.gravida}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        gravida: e.target.value,
                                        pregnancy_cycle: `G${e.target.value || 0}P${prev.para || 0}`
                                    }))}
                                >
                                    <option value="">Gravida (G)</option>
                                    {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                                        <option key={`g-${n}`} value={String(n)}>G{n}</option>
                                    ))}
                                </select>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={formData.para}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        para: e.target.value,
                                        pregnancy_cycle: `G${prev.gravida || 0}P${e.target.value || 0}`
                                    }))}
                                >
                                    <option value="">Para (P)</option>
                                    {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                                        <option key={`p-${n}`} value={String(n)}>P{n}</option>
                                    ))}
                                </select>
                            </div>
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
                                <option value="Miscarriage">Miscarriage</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Baby Weight (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
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

                {/* Physical Examination (Only for registered patients) */}
                {!isWalkIn && (
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
                )}

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
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default {
    AddAdmissionModal,
    EditAdmissionModal
};
