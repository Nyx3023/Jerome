/**
 * Shared Family Planning Modal Components
 * Used by both PatientRecordEnhanced (online patients) and WalkInPatientEnhanced (walk-in patients)
 */

import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

/**
 * Add Family Planning Modal - Works for both online and walk-in patients
 */
export const AddFamilyPlanningModal = ({
    patientId,
    profile,
    walkInId,
    walkInName,
    walkInContact,
    onClose,
    onSuccess
}) => {
    const isWalkIn = !patientId && (walkInName || walkInContact);

    const [formData, setFormData] = useState({
        consultation_date: new Date().toISOString().split('T')[0],
        method_category: 'natural',
        method_chosen: '',
        method_started_date: '',
        counseling_done: false,
        side_effects: '',
        follow_up_date: '',
        notes: '',
        counseled_by: ''
    });
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCounselors = async () => {
            try {
                const { data } = await axios.get('/api/users/available-counselors');
                setCounselors(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading counselors:', err);
                setCounselors([]);
            }
        };
        if (!isWalkIn) loadCounselors();
    }, [isWalkIn]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isWalkIn) {
                await axios.post('/api/admin/walkin/family-planning', {
                    patient_name: walkInName,
                    contact_number: walkInContact,
                    ...formData,
                    counseling_done: formData.counseling_done ? 1 : 0
                });
            } else {
                const counselorId = Number(formData.counseled_by);
                await axios.post('/api/clinic/family-planning', {
                    patient_id: patientId,
                    ...formData,
                    counseling_done: formData.counseling_done ? 1 : 0,
                    counseled_by: Number.isInteger(counselorId) && counselorId > 0 ? counselorId : null
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding family planning record:', error);
            alert(error.response?.data?.error || 'Failed to add family planning record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Family Planning Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Consultation Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.consultation_date}
                            onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Method Category</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.method_category}
                            onChange={(e) => setFormData({ ...formData, method_category: e.target.value })}
                        >
                            <option value="natural">Natural</option>
                            <option value="barrier">Barrier</option>
                            <option value="hormonal">Hormonal</option>
                            <option value="iud">IUD</option>
                            <option value="permanent">Permanent</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Method Chosen</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g., Pills, IUD, Condoms, etc."
                        value={formData.method_chosen}
                        onChange={(e) => setFormData({ ...formData, method_chosen: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Method Started Date</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.method_started_date}
                            onChange={(e) => setFormData({ ...formData, method_started_date: e.target.value })}
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
                    <label className="block text-sm font-medium mb-1">Side Effects/Concerns</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="2"
                        value={formData.side_effects}
                        onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                    ></textarea>
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
                {!isWalkIn && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Counseled By</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.counseled_by || ''}
                            onChange={(e) => setFormData({ ...formData, counseled_by: e.target.value })}
                        >
                            <option value="">None</option>
                            {counselors.map((c) => (
                                <option key={`${c.user_id}-${c.role}`} value={c.user_id}>
                                    {c.name} ({c.role})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="counseling_done"
                        checked={formData.counseling_done}
                        onChange={(e) => setFormData({ ...formData, counseling_done: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <label htmlFor="counseling_done" className="text-sm font-medium">Counseling Done</label>
                </div>
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
                        {loading ? 'Saving...' : 'Add Record'}
                    </button>
                </div>
            </form>
        </div>
    );
};

/**
 * View Family Planning Modal
 */
export const ViewFamilyPlanningModal = ({ familyPlanning, onClose }) => {
    const formatDate = (d) => {
        if (!d) return 'Not set';
        try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
    };

    const yesNo = (v) => {
        if (v === 1 || v === '1' || v === true) return 'Yes';
        return 'No';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Family Planning Record Details</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium"><span className="text-sm text-gray-600">Consultation Date:</span> {formatDate(familyPlanning.consultation_date)}</div>
                    <div className="font-medium"><span className="text-sm text-gray-600">Method Chosen:</span> {familyPlanning.method_chosen || 'Not specified'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium"><span className="text-sm text-gray-600">Method Category:</span> {familyPlanning.method_category || '—'}</div>
                    <div className="font-medium"><span className="text-sm text-gray-600">Method Started:</span> {familyPlanning.method_started_date ? formatDate(familyPlanning.method_started_date) : 'Not started'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium"><span className="text-sm text-gray-600">Counseling Done:</span> {yesNo(familyPlanning.counseling_done)}</div>
                    <div className="font-medium"><span className="text-sm text-gray-600">Follow-up Date:</span> {familyPlanning.follow_up_date ? formatDate(familyPlanning.follow_up_date) : 'Not scheduled'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium"><span className="text-sm text-gray-600">Counseled By:</span> {familyPlanning.counselor_name || 'None'}</div>
                    <div className="font-medium"><span className="text-sm text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs ${familyPlanning.status === 'active' ? 'bg-green-100 text-green-800' : familyPlanning.status === 'discontinued' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{familyPlanning.status || '—'}</span></div>
                </div>
                <div className="font-medium whitespace-pre-wrap"><span className="text-sm text-gray-600">Side Effects:</span> {familyPlanning.side_effects || 'None reported'}</div>
                <div className="font-medium whitespace-pre-wrap"><span className="text-sm text-gray-600">Notes:</span> {familyPlanning.notes || '—'}</div>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
            </div>
        </div>
    );
};

/**
 * Edit Family Planning Modal
 */
export const EditFamilyPlanningModal = ({ familyPlanning, onClose, onSuccess }) => {
    const isWalkIn = familyPlanning?.patient_type === 'walk-in' || (!familyPlanning?.patient_id && familyPlanning?.patient_name);

    const [formData, setFormData] = useState({
        consultation_date: familyPlanning.consultation_date ? new Date(familyPlanning.consultation_date).toISOString().split('T')[0] : '',
        method_chosen: familyPlanning.method_chosen || '',
        method_started_date: familyPlanning.method_started_date ? new Date(familyPlanning.method_started_date).toISOString().split('T')[0] : '',
        method_category: familyPlanning.method_category || 'natural',
        counseling_done: !!(Number(familyPlanning.counseling_done) || familyPlanning.counseling_done === true),
        side_effects: familyPlanning.side_effects || '',
        follow_up_date: familyPlanning.follow_up_date ? new Date(familyPlanning.follow_up_date).toISOString().split('T')[0] : '',
        notes: familyPlanning.notes || '',
        counseled_by: familyPlanning.counseled_by || ''
    });
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCounselors = async () => {
            try {
                const { data } = await axios.get('/api/users/available-counselors');
                setCounselors(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading counselors:', err);
                setCounselors([]);
            }
        };
        if (!isWalkIn) loadCounselors();
    }, [isWalkIn]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isWalkIn) {
                await axios.put(`/api/admin/walkin/family-planning/${familyPlanning.id}`, formData);
            } else {
                const counselorId = Number(formData.counseled_by);
                const submissionData = {
                    ...formData,
                    method_chosen: formData.method_chosen?.trim() || null,
                    method_started_date: formData.method_started_date?.trim() || null,
                    follow_up_date: formData.follow_up_date?.trim() || null,
                    notes: formData.notes?.trim() || null,
                    side_effects: formData.side_effects?.trim() || null,
                    counseling_done: formData.counseling_done ? 1 : 0,
                    counseled_by: Number.isInteger(counselorId) && counselorId > 0 ? counselorId : null
                };
                await axios.put(`/api/clinic/family-planning/${familyPlanning.id}`, submissionData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating family planning record:', error);
            alert(error.response?.data?.error || 'Failed to update family planning record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Edit Family Planning Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Consultation Date *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.consultation_date}
                            onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Method Category</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.method_category}
                            onChange={(e) => setFormData({ ...formData, method_category: e.target.value })}
                        >
                            <option value="natural">Natural</option>
                            <option value="barrier">Barrier</option>
                            <option value="hormonal">Hormonal</option>
                            <option value="iud">IUD</option>
                            <option value="permanent">Permanent</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Method Chosen</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={formData.method_chosen}
                        onChange={(e) => setFormData({ ...formData, method_chosen: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Method Started Date</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.method_started_date}
                            onChange={(e) => setFormData({ ...formData, method_started_date: e.target.value })}
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
                    <label className="block text-sm font-medium mb-1">Side Effects/Concerns</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="2"
                        value={formData.side_effects}
                        onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                    ></textarea>
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
                {!isWalkIn && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Counseled By</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.counseled_by || ''}
                            onChange={(e) => setFormData({ ...formData, counseled_by: e.target.value })}
                        >
                            <option value="">None</option>
                            {counselors.map((c) => (
                                <option key={`${c.user_id}-${c.role}`} value={c.user_id}>
                                    {c.name} ({c.role})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="edit_counseling_done"
                        checked={formData.counseling_done}
                        onChange={(e) => setFormData({ ...formData, counseling_done: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <label htmlFor="edit_counseling_done" className="text-sm font-medium">Counseling Done</label>
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
    AddFamilyPlanningModal,
    ViewFamilyPlanningModal,
    EditFamilyPlanningModal
};
