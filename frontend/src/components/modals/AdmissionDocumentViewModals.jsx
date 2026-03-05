import React from 'react';
import { FaFilePdf, FaTimes } from 'react-icons/fa';

/**
 * View Admission Form Modal
 * Shows admission form details with print button
 */
export const ViewAdmissionFormModal = ({ admission, onClose, onPrint }) => {
    if (!admission) return null;

    // Parse delivery details from notes
    let deliveryDetails = {};
    try {
        if (admission.notes) {
            const notes = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
            deliveryDetails = notes?.delivery_details || {};
        }
    } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to parse notes', e);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-2xl font-bold text-gray-800">Admission Form</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrint}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                    >
                        <FaFilePdf /> Print Form
                    </button>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                        <FaTimes />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Patient Name:</span>
                        <p className="text-gray-900">{admission.display_patient_name || admission.patient_name || 'Unknown'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Contact Number:</span>
                        <p className="text-gray-900">{admission.display_contact_number || admission.contact_number || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Age:</span>
                        <p className="text-gray-900">{admission.patient_age || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Gender:</span>
                        <p className="text-gray-900">{admission.patient_gender || '—'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <span className="text-sm text-gray-600 font-medium">Address:</span>
                        <p className="text-gray-900">{admission.patient_address || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Admitted At:</span>
                        <p className="text-gray-900">{admission.admitted_at ? new Date(admission.admitted_at).toLocaleString() : '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Room:</span>
                        <p className="text-gray-900">{admission.room || 'Not assigned'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Pregnancy Cycle:</span>
                        <p className="text-gray-900">{admission.pregnancy_cycle || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Status:</span>
                        <p className="text-gray-900 capitalize">{admission.status || 'admitted'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <span className="text-sm text-gray-600 font-medium">Admission Reason:</span>
                        <p className="text-gray-900">{admission.admission_reason || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Gravida:</span>
                        <p className="text-gray-900">{deliveryDetails.gravida || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Para:</span>
                        <p className="text-gray-900">{deliveryDetails.para || '—'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * View Discharge Summary Modal
 * Shows mother's discharge summary with print button
 */
export const ViewDischargeModal = ({ admission, onClose, onPrint }) => {
    if (!admission) return null;

    // Parse delivery details from notes
    let deliveryDetails = {};
    try {
        if (admission.notes) {
            const notes = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
            deliveryDetails = notes?.delivery_details || {};
        }
    } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to parse notes', e);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-2xl font-bold text-green-800">Mother's Discharge Summary</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrint}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                    >
                        <FaFilePdf /> Print Discharge
                    </button>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                        <FaTimes />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Patient Name:</span>
                        <p className="text-gray-900">{admission.display_patient_name || admission.patient_name || 'Unknown'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Age:</span>
                        <p className="text-gray-900">{admission.patient_age || '—'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <span className="text-sm text-gray-600 font-medium">Address:</span>
                        <p className="text-gray-900">{admission.patient_address || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Date Admitted:</span>
                        <p className="text-gray-900">{admission.admitted_at ? new Date(admission.admitted_at).toLocaleString() : '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Date Discharged:</span>
                        <p className="text-gray-900">{admission.discharged_at ? new Date(admission.discharged_at).toLocaleString() : '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Gravida:</span>
                        <p className="text-gray-900">{deliveryDetails.gravida || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Para:</span>
                        <p className="text-gray-900">{deliveryDetails.para || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Pregnancy Cycle (AOG):</span>
                        <p className="text-gray-900">{admission.pregnancy_cycle || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Delivery Type:</span>
                        <p className="text-gray-900">{admission.delivery_type || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Disposition:</span>
                        <p className="text-gray-900 capitalize">{admission.disposition || '—'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600 font-medium">Discharged By:</span>
                        <p className="text-gray-900">{admission.discharged_by || '—'}</p>
                    </div>
                    <div className="md:col-span-2">
                        <span className="text-sm text-gray-600 font-medium">Discharge Notes:</span>
                        <p className="text-gray-900 whitespace-pre-line">{admission.discharge_notes || '—'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * View Newborn Discharge Modal
 * Shows newborn discharge summary with print button
 */
export const ViewNewbornDischargeModal = ({ admission, onClose, onPrint }) => {
    if (!admission) return null;

    // Parse delivery details from notes
    let deliveryDetails = {};
    let babyDetails = {};
    try {
        if (admission.notes) {
            const notes = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
            deliveryDetails = notes?.delivery_details || {};
            babyDetails = deliveryDetails?.baby_details || {};
        }
    } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to parse notes', e);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-2xl font-bold text-yellow-800">Newborn Discharge Summary</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrint}
                        className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-2"
                    >
                        <FaFilePdf /> Print Newborn Discharge
                    </button>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                        <FaTimes />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Mother Information */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Mother Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Mother's Name:</span>
                            <p className="text-gray-900">{admission.display_patient_name || admission.patient_name || 'Unknown'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Age:</span>
                            <p className="text-gray-900">{admission.patient_age || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-sm text-gray-600 font-medium">Address:</span>
                            <p className="text-gray-900">{admission.patient_address || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Gravida:</span>
                            <p className="text-gray-900">{deliveryDetails.gravida || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Para:</span>
                            <p className="text-gray-900">{deliveryDetails.para || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Baby Information */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Baby Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Baby's Full Name:</span>
                            <p className="text-gray-900">{babyDetails.full_name || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Gender:</span>
                            <p className="text-gray-900">{babyDetails.gender || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Birth Weight (kg):</span>
                            <p className="text-gray-900">{babyDetails.birth_weight_kg || admission.baby_weight_kg || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">APGAR 1min:</span>
                            <p className="text-gray-900">{admission.apgar1 || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">APGAR 5min:</span>
                            <p className="text-gray-900">{admission.apgar5 || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Admission Details */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Admission Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Date Admitted:</span>
                            <p className="text-gray-900">{admission.admitted_at ? new Date(admission.admitted_at).toLocaleString() : '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Date Discharge:</span>
                            <p className="text-gray-900">{admission.discharged_at ? new Date(admission.discharged_at).toLocaleString() : '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-sm text-gray-600 font-medium">Admitting Diagnosis:</span>
                            <p className="text-gray-900">{admission.admission_reason || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Delivery Type:</span>
                            <p className="text-gray-900">{admission.delivery_type || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Screening & Immunization */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Screening & Immunization</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Screening Date:</span>
                            <p className="text-gray-900">{deliveryDetails.screening_date || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Filter Card No:</span>
                            <p className="text-gray-900">{deliveryDetails.screening_filter_card_no || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Vitamin K Date:</span>
                            <p className="text-gray-900">{deliveryDetails.vitamin_k_date || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">BCG Date:</span>
                            <p className="text-gray-900">{deliveryDetails.bcg_date || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Hep B Date:</span>
                            <p className="text-gray-900">{deliveryDetails.hepb_date || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Discharge Information */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Discharge Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Home Medication:</span>
                            <p className="text-gray-900 whitespace-pre-line">{deliveryDetails.home_medication || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Follow-up:</span>
                            <p className="text-gray-900 whitespace-pre-line">{deliveryDetails.follow_up || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Discharged By:</span>
                            <p className="text-gray-900">{admission.discharged_by || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * View Delivery Record Modal
 * Shows delivery room record with print button
 */
export const ViewDeliveryRecordModal = ({ admission, onClose, onPrint }) => {
    if (!admission) return null;

    // Parse delivery details from notes
    let deliveryDetails = {};
    let babyDetails = {};
    try {
        if (admission.notes) {
            const notes = typeof admission.notes === 'string' ? JSON.parse(admission.notes) : admission.notes;
            deliveryDetails = notes?.delivery_details || {};
            babyDetails = deliveryDetails?.baby_details || {};
        }
    } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to parse notes', e);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-2xl font-bold text-blue-800">Delivery Room Record</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrint}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        <FaFilePdf /> Print Delivery Record
                    </button>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                        <FaTimes />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Mother Information */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Mother Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Name:</span>
                            <p className="text-gray-900">{admission.display_patient_name || admission.patient_name || 'Unknown'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Age:</span>
                            <p className="text-gray-900">{admission.patient_age || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-sm text-gray-600 font-medium">Address:</span>
                            <p className="text-gray-900">{admission.patient_address || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Gravida:</span>
                            <p className="text-gray-900">{deliveryDetails.gravida || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Para:</span>
                            <p className="text-gray-900">{deliveryDetails.para || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Details */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Delivery Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Delivered At:</span>
                            <p className="text-gray-900">{admission.delivered_at ? new Date(admission.delivered_at).toLocaleString() : '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Delivery Type:</span>
                            <p className="text-gray-900">{admission.delivery_type || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Attending Midwife:</span>
                            <p className="text-gray-900">{deliveryDetails.attending_midwife || admission.attending_midwife || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Fluid Character:</span>
                            <p className="text-gray-900">{deliveryDetails.fluid_character || admission.fluid_character || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Fully Dilated At:</span>
                            <p className="text-gray-900">{(deliveryDetails.fully_dilated_at || admission.fully_dilated_at) ? new Date(deliveryDetails.fully_dilated_at || admission.fully_dilated_at).toLocaleString() : '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Placenta:</span>
                            <p className="text-gray-900">{deliveryDetails.placenta || admission.placenta || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Placenta Delivered At:</span>
                            <p className="text-gray-900">{(deliveryDetails.placenta_delivered_at || admission.placenta_delivered_at) ? new Date(deliveryDetails.placenta_delivered_at || admission.placenta_delivered_at).toLocaleString() : '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Repair:</span>
                            <p className="text-gray-900">{deliveryDetails.repair || admission.repair || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Packing:</span>
                            <p className="text-gray-900">{deliveryDetails.packing || admission.packing || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">BP on Discharge:</span>
                            <p className="text-gray-900">{deliveryDetails.bp_on_discharge || admission.bp_on_discharge || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Temperature:</span>
                            <p className="text-gray-900">{deliveryDetails.temperature || admission.temperature || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-sm text-gray-600 font-medium">Remarks:</span>
                            <p className="text-gray-900 whitespace-pre-line">{deliveryDetails.remarks || admission.remarks || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Baby Information */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Baby Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Full Name:</span>
                            <p className="text-gray-900">{babyDetails.full_name || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Gender:</span>
                            <p className="text-gray-900">{babyDetails.gender || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Birth Weight (kg):</span>
                            <p className="text-gray-900">{admission.baby_weight_kg || babyDetails.birth_weight || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">APGAR 1min / 5min:</span>
                            <p className="text-gray-900">{admission.apgar1 || '—'} / {admission.apgar5 || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">General Condition:</span>
                            <p className="text-gray-900">{babyDetails.general_condition || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Eye Prophylaxis:</span>
                            <p className="text-gray-900">{babyDetails.eye_prophylaxis || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Injuries:</span>
                            <p className="text-gray-900">{babyDetails.injuries || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Birth Length (cm):</span>
                            <p className="text-gray-900">{babyDetails.birth_length_cm || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Head Circumference:</span>
                            <p className="text-gray-900">{babyDetails.head_circumference || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Chest:</span>
                            <p className="text-gray-900">{babyDetails.chest || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Abdomen:</span>
                            <p className="text-gray-900">{babyDetails.abdomen || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Heart Rate:</span>
                            <p className="text-gray-900">{babyDetails.heart_rate || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Respiratory Rate:</span>
                            <p className="text-gray-900">{babyDetails.respiratory_rate || '—'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600 font-medium">Temperature:</span>
                            <p className="text-gray-900">{babyDetails.temperature || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Complications */}
                {admission.complications && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Complications</h3>
                        <p className="text-gray-900 whitespace-pre-line">{admission.complications}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
