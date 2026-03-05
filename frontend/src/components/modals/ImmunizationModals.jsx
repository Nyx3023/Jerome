/**
 * Shared Immunization Modal Components
 * Used by both PatientRecordEnhanced and WalkInPatientEnhanced
 */

import React, { useState } from 'react';
import axios from '../../utils/axiosConfig';

/**
 * Add Immunization Modal
 */
export const AddImmunizationModal = ({
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
        vaccine_name: '',
        custom_vaccine_name: '',
        dose_number: '1',
        date_administered: new Date().toISOString().split('T')[0],
        administered_by: '',
        batch_number: '',
        site: '',
        next_dose_date: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    const commonVaccines = [
        'Tetanus Toxoid (TT)',
        'Td (Tetanus-Diphtheria)',
        'Hepatitis B',
        'MMR (Measles, Mumps, Rubella)',
        'Influenza',
        'COVID-19',
        'Pneumococcal',
        'HPV (Human Papillomavirus)',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isWalkIn) {
                const vaccineToSubmit = formData.vaccine_name === 'Other' ? formData.custom_vaccine_name : formData.vaccine_name;
                await axios.post('/api/admin/walkin/immunizations', {
                    patient_name: name,
                    contact_number: contact,
                    ...formData,
                    vaccine_name: vaccineToSubmit
                });
            } else {
                const vaccineToSubmit = formData.vaccine_name === 'Other' ? formData.custom_vaccine_name : formData.vaccine_name;
                await axios.post('/api/clinic/immunizations', {
                    patient_id: patientId,
                    patient_name: name,
                    contact_number: contact,
                    ...formData,
                    vaccine_name: vaccineToSubmit
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding immunization:', error);
            alert(error.response?.data?.error || 'Failed to add immunization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Add Immunization Record</h2>

            {/* Medical Safety Alerts - For Registered Patients */}
            {!isWalkIn && profile && (profile.allergies || profile.age || profile.date_of_birth) && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <h3 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                        💉 PATIENT INFO FOR IMMUNIZATION
                    </h3>
                    <div className="space-y-2 text-sm">
                        {profile.date_of_birth && (
                            <div>
                                <span className="text-gray-600 text-xs">Date of Birth:</span>
                                <div className="font-semibold text-gray-900">
                                    {new Date(profile.date_of_birth).toLocaleDateString()}
                                    {profile.age && <span className="ml-2 text-gray-600">({profile.age} years old)</span>}
                                </div>
                            </div>
                        )}
                        {profile.allergies && (
                            <div className="pt-2 border-t border-green-300">
                                <span className="text-xs text-green-900 font-semibold">⚠️ Known Allergies:</span>
                                <div className="text-red-800 font-medium">{profile.allergies}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Vaccine Name *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.vaccine_name}
                            onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                            required
                        >
                            <option value="">Select vaccine</option>
                            {commonVaccines.map(vaccine => (
                                <option key={vaccine} value={vaccine}>{vaccine}</option>
                            ))}
                        </select>
                        {formData.vaccine_name === 'Other' && (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 mt-2"
                                placeholder="Specify vaccine name..."
                                value={formData.custom_vaccine_name}
                                onChange={(e) => setFormData({ ...formData, custom_vaccine_name: e.target.value })}
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Dose Number</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.dose_number}
                            onChange={(e) => setFormData({ ...formData, dose_number: e.target.value })}
                        >
                            <option value="1">1st Dose</option>
                            <option value="2">2nd Dose</option>
                            <option value="3">3rd Dose</option>
                            <option value="4">4th Dose</option>
                            <option value="5">5th Dose</option>
                            <option value="Booster">Booster</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date Administered *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.date_administered}
                            onChange={(e) => setFormData({ ...formData, date_administered: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Next Dose Date</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.next_dose_date}
                            onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Administered By</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Healthcare provider name"
                            value={formData.administered_by}
                            onChange={(e) => setFormData({ ...formData, administered_by: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Batch/Lot Number</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Vaccine batch number"
                            value={formData.batch_number}
                            onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Injection Site</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={formData.site}
                        onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    >
                        <option value="">Select site</option>
                        <option value="Left Arm">Left Arm</option>
                        <option value="Right Arm">Right Arm</option>
                        <option value="Left Thigh">Left Thigh</option>
                        <option value="Right Thigh">Right Thigh</option>
                        <option value="Buttock">Buttock</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        rows="2"
                        placeholder="Any reactions or observations"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                </div>
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
                        {loading ? 'Saving...' : 'Add Immunization'}
                    </button>
                </div>
            </form>
        </div>
    );
};

/**
 * View Immunization Modal
 */
export const ViewImmunizationModal = ({ immunization, onClose, onPrint }) => {
    const formatDate = (d) => {
        if (!d) return 'N/A';
        try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Immunization Details</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Vaccine:</span>
                        <div className="font-medium">{immunization?.vaccine_name || 'N/A'}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Dose:</span>
                        <div className="font-medium">{immunization?.dose_number || 'N/A'}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Date Administered:</span>
                        <div className="font-medium">{formatDate(immunization?.date_administered)}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Next Dose Date:</span>
                        <div className="font-medium">{formatDate(immunization?.next_dose_date) || 'Not scheduled'}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Administered By:</span>
                        <div className="font-medium">{immunization?.administered_by || 'N/A'}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Batch Number:</span>
                        <div className="font-medium">{immunization?.batch_number || 'N/A'}</div>
                    </div>
                </div>
                <div>
                    <span className="text-sm text-gray-600">Injection Site:</span>
                    <div className="font-medium">{immunization?.site || 'N/A'}</div>
                </div>
                {immunization?.notes && (
                    <div>
                        <span className="text-sm text-gray-600">Notes:</span>
                        <div className="font-medium whitespace-pre-wrap">{immunization.notes}</div>
                    </div>
                )}
            </div>
            <div className="flex gap-2 justify-end mt-6">
                {onPrint && (
                    <button onClick={() => onPrint(immunization)} className="px-4 py-2 border rounded hover:bg-gray-100">
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
 * Edit Immunization Modal
 */
export const EditImmunizationModal = ({ immunization, onClose, onSuccess }) => {
    const isWalkIn = immunization?.patient_type === 'walk-in' || (!immunization?.patient_id && immunization?.patient_name);

    const [formData, setFormData] = useState({
        vaccine_name: immunization?.vaccine_name || '',
        custom_vaccine_name: '',
        dose_number: immunization?.dose_number || '1',
        date_administered: immunization?.date_administered ? new Date(immunization.date_administered).toISOString().split('T')[0] : '',
        administered_by: immunization?.administered_by || '',
        batch_number: immunization?.batch_number || '',
        site: immunization?.site || '',
        next_dose_date: immunization?.next_dose_date ? new Date(immunization.next_dose_date).toISOString().split('T')[0] : '',
        notes: immunization?.notes || ''
    });
    const [loading, setLoading] = useState(false);

    const commonVaccines = [
        'Tetanus Toxoid (TT)',
        'Td (Tetanus-Diphtheria)',
        'Hepatitis B',
        'MMR (Measles, Mumps, Rubella)',
        'Influenza',
        'COVID-19',
        'Pneumococcal',
        'HPV (Human Papillomavirus)',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const vaccineToSubmit = formData.vaccine_name === 'Other' ? formData.custom_vaccine_name : formData.vaccine_name;
            if (isWalkIn) {
                await axios.put(`/api/admin/walkin/immunizations/${immunization.id}`, { ...formData, vaccine_name: vaccineToSubmit });
            } else {
                await axios.put(`/api/clinic/immunizations/${immunization.id}`, { ...formData, vaccine_name: vaccineToSubmit });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating immunization:', error);
            alert(error.response?.data?.error || 'Failed to update immunization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Edit Immunization Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Vaccine Name *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.vaccine_name}
                            onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                            required
                        >
                            <option value="">Select vaccine</option>
                            {commonVaccines.map(vaccine => (
                                <option key={vaccine} value={vaccine}>{vaccine}</option>
                            ))}
                        </select>
                        {formData.vaccine_name === 'Other' && (
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 mt-2"
                                placeholder="Specify vaccine name..."
                                value={formData.custom_vaccine_name}
                                onChange={(e) => setFormData({ ...formData, custom_vaccine_name: e.target.value })}
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Dose Number</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={formData.dose_number}
                            onChange={(e) => setFormData({ ...formData, dose_number: e.target.value })}
                        >
                            <option value="1">1st Dose</option>
                            <option value="2">2nd Dose</option>
                            <option value="3">3rd Dose</option>
                            <option value="4">4th Dose</option>
                            <option value="5">5th Dose</option>
                            <option value="Booster">Booster</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date Administered *</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.date_administered}
                            onChange={(e) => setFormData({ ...formData, date_administered: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Next Dose Date</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={formData.next_dose_date}
                            onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Administered By</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.administered_by}
                            onChange={(e) => setFormData({ ...formData, administered_by: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Batch Number</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={formData.batch_number}
                            onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Injection Site</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={formData.site}
                        onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    >
                        <option value="">Select site</option>
                        <option value="Left Arm">Left Arm</option>
                        <option value="Right Arm">Right Arm</option>
                        <option value="Left Thigh">Left Thigh</option>
                        <option value="Right Thigh">Right Thigh</option>
                        <option value="Buttock">Buttock</option>
                    </select>
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
    AddImmunizationModal,
    ViewImmunizationModal,
    EditImmunizationModal
};
