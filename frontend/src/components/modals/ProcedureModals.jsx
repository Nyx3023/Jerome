/**
 * Shared Procedure Modal Components
 * Used by both PatientRecordEnhanced and WalkInPatientEnhanced
 */

import React, { useState } from 'react';
import axios from '../../utils/axiosConfig';

/**
 * Add Procedure Modal
 */
export const AddProcedureModal = ({
    patientId,
    patientName,
    contactNumber,
    profile,
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
        procedure_name: '',
        custom_procedure_name: '',
        procedure_date: new Date().toISOString().split('T')[0],
        performed_by: '',
        diagnosis: '',
        findings: '',
        notes: '',
        status: 'completed',
        follow_up_date: ''
    });
    const [loading, setLoading] = useState(false);

    const commonProcedures = [
        'Pelvic Examination',
        'Breast Examination',
        'Pap Smear',
        'IUD Insertion',
        'IUD Removal',
        'Implant Insertion',
        'Implant Removal',
        'Prenatal Checkup',
        'Postpartum Checkup',
        'Vaccination',
        'Wound Care',
        'Minor Surgery',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const procedureNameToSubmit = formData.procedure_name === 'Other' ? formData.custom_procedure_name : formData.procedure_name;
            if (isWalkIn) {
                await axios.post('/api/admin/walkin/procedures', {
                    patient_name: name,
                    contact_number: contact,
                    ...formData,
                    procedure_name: procedureNameToSubmit
                });
            } else {
                await axios.post('/api/clinic/procedures', {
                    patient_id: patientId,
                    patient_name: name,
                    contact_number: contact,
                    ...formData,
                    procedure_name: procedureNameToSubmit
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding procedure:', error);
            alert(error.response?.data?.error || 'Failed to add procedure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Add Procedure Record</h2>

            {/* Medical Safety Alerts - For Registered Patients */}
            {!isWalkIn && profile && (profile.blood_type || profile.allergies) && (
                <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                    <h3 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                        🏥 CRITICAL PATIENT INFO FOR PROCEDURE
                    </h3>
                    <div className="space-y-2 text-sm">
                        {profile.blood_type && (
                            <div>
                                <span className="text-gray-600 text-xs">Blood Type:</span>
                                <div className="px-2 py-1 bg-red-100 text-red-900 font-bold rounded inline-block">
                                    {profile.blood_type}
                                </div>
                            </div>
                        )}
                        {profile.allergies && (
                            <div className="pt-2 border-t border-purple-300">
                                <span className="text-xs text-purple-900 font-semibold">⚠️ Known Allergies:</span>
                                <div className="text-red-800 font-medium">{profile.allergies}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Procedure Name *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.procedure_name}
                            onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
                            required
                        >
                            <option value="">Select procedure</option>
                            {commonProcedures.map(proc => (
                                <option key={proc} value={proc}>{proc}</option>
                            ))}
                        </select>
                        {formData.procedure_name === 'Other' && (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 mt-2"
                                placeholder="Specify procedure name..."
                                value={formData.custom_procedure_name}
                                onChange={(e) => setFormData({ ...formData, custom_procedure_name: e.target.value })}
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Procedure Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.procedure_date}
                            onChange={(e) => setFormData({ ...formData, procedure_date: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Performed By</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Healthcare provider name"
                            value={formData.performed_by}
                            onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                        />
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
                <div>
                    <label className="block text-sm font-medium mb-1">Diagnosis</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        placeholder="Primary diagnosis"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Findings</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="3"
                        placeholder="Procedure findings"
                        value={formData.findings}
                        onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        rows="2"
                        placeholder="Additional notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                </div>
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                        {loading ? 'Saving...' : 'Add Procedure'}
                    </button>
                </div>
            </form>
        </div>
    );
};

/**
 * Edit Procedure Modal
 */
export const EditProcedureModal = ({ procedure, onClose, onSuccess }) => {
    const isWalkIn = procedure?.patient_type === 'walk-in' || (!procedure?.patient_id && procedure?.patient_name);

    const [formData, setFormData] = useState({
        procedure_name: procedure?.procedure_name || '',
        custom_procedure_name: '',
        procedure_date: procedure?.procedure_date ? new Date(procedure.procedure_date).toISOString().split('T')[0] : '',
        performed_by: procedure?.performed_by || '',
        diagnosis: procedure?.diagnosis || '',
        findings: procedure?.findings || '',
        notes: procedure?.notes || '',
        status: procedure?.status || 'completed',
        follow_up_date: procedure?.follow_up_date ? new Date(procedure.follow_up_date).toISOString().split('T')[0] : ''
    });
    const [loading, setLoading] = useState(false);

    const commonProcedures = [
        'Pelvic Examination',
        'Breast Examination',
        'Pap Smear',
        'IUD Insertion',
        'IUD Removal',
        'Implant Insertion',
        'Implant Removal',
        'Prenatal Checkup',
        'Postpartum Checkup',
        'Vaccination',
        'Wound Care',
        'Minor Surgery',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const procedureNameToSubmit = formData.procedure_name === 'Other' ? formData.custom_procedure_name : formData.procedure_name;
            if (isWalkIn) {
                await axios.put(`/api/admin/walkin/procedures/${procedure.id}`, { ...formData, procedure_name: procedureNameToSubmit });
            } else {
                await axios.put(`/api/clinic/procedures/${procedure.id}`, { ...formData, procedure_name: procedureNameToSubmit });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating procedure:', error);
            alert(error.response?.data?.error || 'Failed to update procedure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Edit Procedure Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Procedure Name *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.procedure_name}
                            onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
                            required
                        >
                            <option value="">Select procedure</option>
                            {commonProcedures.map(proc => (
                                <option key={proc} value={proc}>{proc}</option>
                            ))}
                        </select>
                        {formData.procedure_name === 'Other' && (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 mt-2"
                                placeholder="Specify procedure name..."
                                value={formData.custom_procedure_name}
                                onChange={(e) => setFormData({ ...formData, custom_procedure_name: e.target.value })}
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Procedure Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.procedure_date}
                            onChange={(e) => setFormData({ ...formData, procedure_date: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Performed By</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.performed_by}
                            onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                        />
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
                <div>
                    <label className="block text-sm font-medium mb-1">Diagnosis</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Findings</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="3"
                        value={formData.findings}
                        onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    ></textarea>
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
    AddProcedureModal,
    EditProcedureModal
};
