/**
 * Shared Modals Index
 * Central export point for all shared patient modal components
 * 
 * These modals are used by both:
 * - PatientRecordEnhanced.jsx (online/registered patients)
 * - WalkInPatientEnhanced.jsx (walk-in patients)
 * 
 * Usage:
 * import { AddAdmissionModal, EditAdmissionModal } from '../modals';
 * 
 * Or import specific files:
 * import { AddLabResultModal } from './modals/LabResultModals';
 */

// Admission Modals
export { AddAdmissionModal, EditAdmissionModal } from './AdmissionModals';

// Lab Result Modals
export { AddLabResultModal, ViewLabResultModal, EditLabResultModal } from './LabResultModals';

// Family Planning Modals
export { AddFamilyPlanningModal, ViewFamilyPlanningModal, EditFamilyPlanningModal } from './FamilyPlanningModals';

// Screening Modals
export { AddScreeningModal, ViewScreeningModal, EditScreeningModal } from './ScreeningModals';

// Immunization Modals
export { AddImmunizationModal, ViewImmunizationModal, EditImmunizationModal } from './ImmunizationModals';

// Procedure Modals
export { AddProcedureModal, EditProcedureModal } from './ProcedureModals';

// Existing shared modals (View only)
export { ViewAdmissionModal } from './AdmissionViewModal';
export { ViewBabyModal } from './BabyViewModal';
export { ViewProcedureModal } from './ProcedureViewModal';
