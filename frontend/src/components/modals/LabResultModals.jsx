/**
 * Shared Lab Result Modal Components
 * Used by both PatientRecordEnhanced (online patients) and WalkInPatientEnhanced (walk-in patients)
 */

import React, { useState } from 'react';
import axios from '../../utils/axiosConfig';

/**
 * Add Lab Result Modal - Works for both online and walk-in patients
 * Props:
 * - patientId: For registered patients
 * - patientName: Patient name (used for walk-in detection)
 * - contactNumber: Contact number
 * - profile: Full patient profile (NEW - for medical safety info)
 * - walkInId: For walk-in patients (optional)
 * - initialData: Pre-fill data
 * - onClose: Close handler
 * - onSuccess: Success callback
 */
export const AddLabResultModal = ({ patientId, patientName, contactNumber, profile, walkInId, initialData = {}, onClose, onSuccess }) => {
    // Determine if this is a walk-in patient
    const isWalkIn = !patientId || (patientName && contactNumber && !patientId);

    const [formData, setFormData] = useState({
        test_name: initialData.test_name || '',
        test_category: initialData.category || 'blood',
        custom_category: '',
        test_date: '',
        result_value: '',
        reference_range: '',
        unit: '',
        status: 'completed',
        lab_name: '',
        ordered_by: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            if (isWalkIn) {
                // Walk-in patient API
                const submissionData = {
                    patient_name: patientName,
                    contact_number: contactNumber,
                    test_name: formData.test_name,
                    test_category: formData.test_category === 'other' ? formData.custom_category : formData.test_category,
                    test_date: formData.test_date,
                    result_value: formData.result_value,
                    unit: formData.unit,
                    reference_range: formData.reference_range,
                    status: formData.status,
                    lab_name: formData.lab_name || null,
                    notes: formData.notes
                };
                await axios.post('/api/admin/walkin/lab-results', submissionData);
            } else {
                // Registered patient API
                const clinicPayload = {
                    patient_id: patientId,
                    test_type: formData.test_name,
                    test_category: formData.test_category === 'other' ? formData.custom_category : formData.test_category,
                    test_date: formData.test_date,
                    result_value: formData.result_value,
                    normal_range: formData.reference_range,
                    unit: formData.unit,
                    status: formData.status,
                    notes: formData.notes
                };
                await axios.post('/api/clinic/lab-results', clinicPayload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding lab result:', error);
            const server = error?.response?.data;
            const message = (server && (server.error || server.message)) || error.message || 'Failed to add lab result';
            setErrorMsg(String(message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Lab Result</h2>
            <p className="text-sm text-gray-600 mb-4 italic">
                Enter detailed laboratory test data to add to the patient's medical record.
            </p>

            {/* Medical Safety Alerts - For Registered Patients */}
            {!isWalkIn && profile && (profile.blood_type || profile.allergies || profile.age || profile.gender) && (
                <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <h3 className="text-sm font-bold text-yellow-900 mb-2 flex items-center gap-2">
                        🔬 PATIENT INFO FOR LAB WORK
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {profile.blood_type && (
                            <div>
                                <span className="text-gray-600 text-xs">Blood Type:</span>
                                <div className="px-2 py-1 bg-red-100 text-red-900 font-bold rounded inline-block">
                                    {profile.blood_type}
                                </div>
                            </div>
                        )}
                        {profile.age && (
                            <div>
                                <span className="text-gray-600 text-xs">Age:</span>
                                <div className="font-semibold text-gray-900">{profile.age} years</div>
                            </div>
                        )}
                        {profile.gender && (
                            <div>
                                <span className="text-gray-600 text-xs">Gender:</span>
                                <div className="font-semibold text-gray-900 capitalize">{profile.gender}</div>
                            </div>
                        )}
                    </div>
                    {profile.allergies && (
                        <div className="mt-2 pt-2 border-t border-yellow-300">
                            <span className="text-xs text-yellow-900 font-semibold">⚠️ Allergies:</span>
                            <div className="text-red-800 font-medium">{profile.allergies}</div>
                        </div>
                    )}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                    <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{errorMsg}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Test Type *</label>
                        {formData.test_category === 'cervical_screening' ? (
                            <select
                                className="w-full border rounded px-3 py-2"
                                value={formData.test_name}
                                onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                                required
                            >
                                <option value="">Select Cervical Screening Test</option>
                                <option value="Pap Smear">Pap Smear</option>
                                <option value="HPV Test">HPV Test</option>
                                <option value="Colposcopy">Colposcopy</option>
                                <option value="Cervical Biopsy">Cervical Biopsy</option>
                                <option value="LEEP">LEEP (Loop Electrosurgical Excision)</option>
                                <option value="Cone Biopsy">Cone Biopsy</option>
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2"
                                placeholder="e.g., CBC, Urinalysis, Blood Sugar, Pregnancy Test"
                                value={formData.test_name}
                                onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.test_category}
                            onChange={(e) => setFormData({ ...formData, test_category: e.target.value, test_name: '' })}
                            required
                        >
                            <option value="blood">Blood Test</option>
                            <option value="urine">Urine Test</option>
                            <option value="cervical_screening">Cervical Screening</option>
                            <option value="pregnancy">Pregnancy Test</option>
                            <option value="ultrasound">Ultrasound</option>
                            <option value="imaging">Imaging</option>
                            <option value="screening">General Screening</option>
                            <option value="other">Other</option>
                        </select>
                        {formData.test_category === 'other' && (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 mt-2"
                                placeholder="Specify category..."
                                value={formData.custom_category}
                                onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                                required
                            />
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Test Date *</label>
                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={formData.test_date}
                        onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                        required
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Result Value</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.result_value}
                            onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reference Range</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="e.g., 70-100"
                            value={formData.reference_range}
                            onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="e.g., mg/dL"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="abnormal">Abnormal</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Laboratory</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Laboratory name"
                            value={formData.lab_name}
                            onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ordered By</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Doctor/Provider name"
                            value={formData.ordered_by}
                            onChange={(e) => setFormData({ ...formData, ordered_by: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="2"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                </div>
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                        {loading ? 'Saving...' : 'Add Lab Result'}
                    </button>
                </div>
            </form>
        </div>
    );
};

/**
 * View Lab Result Modal
 */
export const ViewLabResultModal = ({ result, labResult, onClose, onPrint }) => {
    const data = result || labResult;

    const formatDate = (d) => {
        if (!d) return 'N/A';
        try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            abnormal: 'bg-red-100 text-red-800',
            critical: 'bg-red-600 text-white'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Lab Result Details</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Test Type:</span>
                        <div className="font-medium">{data?.test_type || data?.test_name || 'N/A'}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Category:</span>
                        <div className="font-medium capitalize">{data?.test_category || 'N/A'}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Test Date:</span>
                        <div className="font-medium">{formatDate(data?.test_date)}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <div><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(data?.status)}`}>{data?.status || 'N/A'}</span></div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Result Value:</span>
                        <div className="font-medium">{data?.result_value || 'N/A'}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Reference Range:</span>
                        <div className="font-medium">{data?.reference_range || data?.normal_range || 'N/A'}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Unit:</span>
                        <div className="font-medium">{data?.unit || 'N/A'}</div>
                    </div>
                </div>
                <div>
                    <span className="text-sm text-gray-600">Laboratory:</span>
                    <div className="font-medium">{data?.lab_name || 'N/A'}</div>
                </div>
                {data?.notes && (
                    <div>
                        <span className="text-sm text-gray-600">Notes:</span>
                        <div className="font-medium whitespace-pre-wrap">{data.notes}</div>
                    </div>
                )}
            </div>
            <div className="flex gap-2 justify-end mt-6">
                {onPrint && (
                    <button onClick={() => onPrint(data)} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Print
                    </button>
                )}
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    Close
                </button>
            </div>
        </div>
    );
};

/**
 * Edit Lab Result Modal
 */
export const EditLabResultModal = ({ result, labResult, onClose, onSuccess }) => {
    const data = result || labResult;
    const isWalkIn = data?.patient_type === 'walk-in' || (!data?.patient_id && data?.patient_name);

    const [formData, setFormData] = useState({
        test_name: data?.test_type || data?.test_name || '',
        test_category: data?.test_category || 'blood',
        test_date: data?.test_date ? new Date(data.test_date).toISOString().split('T')[0] : '',
        result_value: data?.result_value || '',
        reference_range: data?.reference_range || data?.normal_range || '',
        unit: data?.unit || '',
        status: data?.status || 'completed',
        lab_name: data?.lab_name || '',
        notes: data?.notes || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isWalkIn) {
                await axios.put(`/api/admin/walkin/lab-results/${data.id}`, {
                    test_name: formData.test_name,
                    test_category: formData.test_category,
                    test_date: formData.test_date,
                    result_value: formData.result_value,
                    reference_range: formData.reference_range,
                    unit: formData.unit,
                    status: formData.status,
                    lab_name: formData.lab_name,
                    notes: formData.notes
                });
            } else {
                await axios.put(`/api/clinic/lab-results/${data.id}`, {
                    test_type: formData.test_name,
                    test_category: formData.test_category,
                    test_date: formData.test_date,
                    result_value: formData.result_value,
                    normal_range: formData.reference_range,
                    unit: formData.unit,
                    status: formData.status,
                    notes: formData.notes
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating lab result:', error);
            alert(error.response?.data?.error || 'Failed to update lab result');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Edit Lab Result</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Test Type *</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.test_name}
                            onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.test_category}
                            onChange={(e) => setFormData({ ...formData, test_category: e.target.value })}
                        >
                            <option value="blood">Blood Test</option>
                            <option value="urine">Urine Test</option>
                            <option value="cervical_screening">Cervical Screening</option>
                            <option value="pregnancy">Pregnancy Test</option>
                            <option value="ultrasound">Ultrasound</option>
                            <option value="imaging">Imaging</option>
                            <option value="screening">General Screening</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Test Date *</label>
                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={formData.test_date}
                        onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                        required
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Result Value</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.result_value}
                            onChange={(e) => setFormData({ ...formData, result_value: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reference Range</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.reference_range}
                            onChange={(e) => setFormData({ ...formData, reference_range: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="abnormal">Abnormal</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Laboratory</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.lab_name}
                            onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="2"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                </div>
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default {
    AddLabResultModal,
    ViewLabResultModal,
    EditLabResultModal
};
