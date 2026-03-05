/**
 * Shared Screening Modal Components
 * Used by both PatientRecordEnhanced and WalkInPatientEnhanced
 */

import React, { useState } from 'react';
import axios from '../../utils/axiosConfig';

/**
 * Add Screening Modal
 */
export const AddScreeningModal = ({
    patientId,
    patientName,
    contactNumber,
    walkInId,
    walkInName,
    walkInContact,
    onClose,
    onSuccess
}) => {
    const isWalkIn = !patientId && (walkInName || walkInContact);
    const name = walkInName || patientName || '';
    const contact = walkInContact || contactNumber || '';

    const [formData, setFormData] = useState({
        screening_type: '',
        custom_screening_type: '',
        screening_date: new Date().toISOString().split('T')[0],
        result: '',
        provider: '',
        notes: '',
        follow_up_date: '',
        status: 'completed'
    });
    const [loading, setLoading] = useState(false);

    const screeningTypes = [
        'Breast Cancer Screening',
        'Cervical Cancer Screening',
        'Diabetes Screening',
        'Hypertension Screening',
        'Anemia Screening',
        'STI Screening',
        'HIV Screening',
        'Tuberculosis Screening',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const screeningTypeToSubmit = formData.screening_type === 'Other' ? formData.custom_screening_type : formData.screening_type;
            if (isWalkIn) {
                await axios.post('/api/admin/walkin/screenings', {
                    patient_name: name,
                    contact_number: contact,
                    ...formData,
                    screening_type: screeningTypeToSubmit
                });
            } else {
                await axios.post('/api/clinic/screenings', {
                    patient_id: patientId,
                    patient_name: name,
                    contact_number: contact,
                    ...formData,
                    screening_type: screeningTypeToSubmit
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding screening:', error);
            alert(error.response?.data?.error || 'Failed to add screening');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Add Screening Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Screening Type *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.screening_type}
                            onChange={(e) => setFormData({ ...formData, screening_type: e.target.value })}
                            required
                        >
                            <option value="">Select screening type</option>
                            {screeningTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {formData.screening_type === 'Other' && (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 mt-2"
                                placeholder="Specify screening type..."
                                value={formData.custom_screening_type}
                                onChange={(e) => setFormData({ ...formData, custom_screening_type: e.target.value })}
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Screening Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.screening_date}
                            onChange={(e) => setFormData({ ...formData, screening_date: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Result</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.result}
                            onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                        >
                            <option value="">Select result</option>
                            <option value="Negative">Negative</option>
                            <option value="Positive">Positive</option>
                            <option value="Normal">Normal</option>
                            <option value="Abnormal">Abnormal</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Provider/Administered By</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Healthcare provider name"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Follow-up Date</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.follow_up_date}
                            onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="3"
                        placeholder="Additional notes or observations"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                </div>
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                        {loading ? 'Saving...' : 'Add Screening'}
                    </button>
                </div>
            </form>
        </div>
    );
};

/**
 * View Screening Modal
 */
export const ViewScreeningModal = ({ screening, onClose, onPrint }) => {
    const formatDate = (d) => {
        if (!d) return 'N/A';
        try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
    };

    const getResultBadge = (result) => {
        const colors = {
            'Negative': 'bg-green-100 text-green-800',
            'Normal': 'bg-green-100 text-green-800',
            'Positive': 'bg-red-100 text-red-800',
            'Abnormal': 'bg-red-100 text-red-800',
            'Pending': 'bg-yellow-100 text-yellow-800'
        };
        return colors[result] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Screening Details</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Screening Type:</span>
                        <div className="font-medium">{screening?.screening_type || 'N/A'}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Date:</span>
                        <div className="font-medium">{formatDate(screening?.screening_date)}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Result:</span>
                        <div><span className={`px-2 py-1 rounded-full text-xs ${getResultBadge(screening?.result)}`}>{screening?.result || 'N/A'}</span></div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <div className="font-medium capitalize">{screening?.status || 'N/A'}</div>
                    </div>
                </div>
                <div>
                    <span className="text-sm text-gray-600">Provider:</span>
                    <div className="font-medium">{screening?.provider || 'N/A'}</div>
                </div>
                {screening?.follow_up_date && (
                    <div>
                        <span className="text-sm text-gray-600">Follow-up Date:</span>
                        <div className="font-medium">{formatDate(screening.follow_up_date)}</div>
                    </div>
                )}
                {screening?.notes && (
                    <div>
                        <span className="text-sm text-gray-600">Notes:</span>
                        <div className="font-medium whitespace-pre-wrap">{screening.notes}</div>
                    </div>
                )}
            </div>
            <div className="flex gap-2 justify-end mt-6">
                {onPrint && (
                    <button onClick={() => onPrint(screening)} className="px-4 py-2 border rounded hover:bg-gray-100">
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
 * Edit Screening Modal
 */
export const EditScreeningModal = ({ screening, onClose, onSuccess }) => {
    const isWalkIn = screening?.patient_type === 'walk-in' || (!screening?.patient_id && screening?.patient_name);

    const [formData, setFormData] = useState({
        screening_type: screening?.screening_type || '',
        custom_screening_type: '',
        screening_date: screening?.screening_date ? new Date(screening.screening_date).toISOString().split('T')[0] : '',
        result: screening?.result || '',
        provider: screening?.provider || '',
        notes: screening?.notes || '',
        follow_up_date: screening?.follow_up_date ? new Date(screening.follow_up_date).toISOString().split('T')[0] : '',
        status: screening?.status || 'completed'
    });
    const [loading, setLoading] = useState(false);

    const screeningTypes = [
        'Breast Cancer Screening',
        'Cervical Cancer Screening',
        'Diabetes Screening',
        'Hypertension Screening',
        'Anemia Screening',
        'STI Screening',
        'HIV Screening',
        'Tuberculosis Screening',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const screeningTypeToSubmit = formData.screening_type === 'Other' ? formData.custom_screening_type : formData.screening_type;
            if (isWalkIn) {
                await axios.put(`/api/admin/walkin/screenings/${screening.id}`, { ...formData, screening_type: screeningTypeToSubmit });
            } else {
                await axios.put(`/api/clinic/screenings/${screening.id}`, { ...formData, screening_type: screeningTypeToSubmit });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating screening:', error);
            alert(error.response?.data?.error || 'Failed to update screening');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Edit Screening Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Screening Type *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.screening_type}
                            onChange={(e) => setFormData({ ...formData, screening_type: e.target.value })}
                            required
                        >
                            <option value="">Select screening type</option>
                            {screeningTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {formData.screening_type === 'Other' && (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 mt-2"
                                placeholder="Specify screening type..."
                                value={formData.custom_screening_type}
                                onChange={(e) => setFormData({ ...formData, custom_screening_type: e.target.value })}
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Screening Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.screening_date}
                            onChange={(e) => setFormData({ ...formData, screening_date: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Result</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.result}
                            onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                        >
                            <option value="">Select result</option>
                            <option value="Negative">Negative</option>
                            <option value="Positive">Positive</option>
                            <option value="Normal">Normal</option>
                            <option value="Abnormal">Abnormal</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Provider</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Follow-up Date</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.follow_up_date}
                            onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="3"
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
    AddScreeningModal,
    ViewScreeningModal,
    EditScreeningModal
};
