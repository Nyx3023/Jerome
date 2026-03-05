## Scope
- Analyze backend and key frontend to identify functions enabling clinic automation
- Explicitly exclude payments, billing and SMS notifications per system limitations

## Key Automation Functions
- Slot/Calendar Seeding
  - `ensureDayAvailable` seeds `slots` and day-level `appointments` when a future date is referenced: backend/controllers/clinicEnhancementsController.js:15; backend/controllers/adminControllers.js:16; backend/controllers/medicalNotesController.js:1149
- Auto‑Scheduling Follow‑ups (registered patients)
  - Family Planning: creates follow‑up bookings if `follow_up_date` is set, with conflict checks and consecutive slot reservation
    - `addFamilyPlanning`: backend/controllers/clinicEnhancementsController.js:434 (auto‑schedule flow at 501–575)
    - `updateFamilyPlanning`: backend/controllers/clinicEnhancementsController.js:605 (auto‑schedule flow at 674–751)
  - Screenings: same pattern for `follow_up_date`
    - `addScreening`: backend/controllers/clinicEnhancementsController.js:788 (auto‑schedule flow at 851–913)
    - `updateScreening`: backend/controllers/clinicEnhancementsController.js:984 (seeding via `ensureDayAvailable` at 1069–1076)
  - Medical Notes completion: doctor‑entered notes can seed availability and auto‑schedule a linked follow‑up
    - `addMedicalNotes`: backend/controllers/medicalNotesController.js:299 (auto‑schedule logic at 395–503 and 548–651)
- Structured Record Automation from Notes
  - Medical notes → structured tables (family planning, labs, prenatal, postpartum, screenings, procedures, immunizations)
    - `applyStructuredUpdates`: backend/controllers/medicalNotesController.js:160
    - Integration helpers: backend/controllers/clinicEnhancementsController.js:1309–1370
- Patient Auto‑Linking
  - Ensures every logged‑in user has a `patients` row so “My records” work automatically
    - `getOrCreatePatientIdByUserId`: backend/utils/patientAutoLink.js:5
- Booking/Slot Automation
  - Booking enforces consecutive slots based on service duration; reserves `slots` rows; prevents double booking; transactional reschedule and cancel frees/reserves slots
    - `bookAppointment`: backend/controllers/userControllers.js:321 (duration/slots at 379–393; conflict at 394–406; slot reservation at 449–468)
    - `rescheduleAppointment`: backend/controllers/userControllers.js:497 (transactional free/reserve at 538–621)
    - `cancelAppointment`: backend/controllers/userControllers.js:654 (free slot at 705–727)
    - `scheduleFollowUp` (doctor‑initiated): backend/controllers/doctorControllers.js:290 (duration/slots/conflicts at 315–344; slot reservation at 386–410)
- Walk‑In Automation
  - Queue tokenization and next‑slot assignment; walk‑in booking creation; no‑show release; admin slot blocking/unblocking
    - `addWalkInToQueue`: backend/controllers/adminControllers.js:901
    - `callNextWalkIn`: backend/controllers/adminControllers.js:922 (assign next available slot at 950–1018)
    - `createWalkIn`: backend/controllers/adminControllers.js:760 (patient ensure + booking + slot reservation at 838–892)
    - `releaseNoShow`: backend/controllers/adminControllers.js:1043 (free slot and mark cancelled at 1065–1085)
    - `blockTimeSlot` / `unblockTimeSlot`: backend/controllers/adminControllers.js:684 / 725

## Supporting Automation
- Analytics reporting for automated dashboards
  - `getDashboardAnalytics`: backend/controllers/analyticsController.js:4

## Exclusions Confirmed
- No billing/payment flows in code; billing explicitly removed: backend/controllers/clinicEnhancementsController.js:427
- No SMS notification implementation present; email verification exists but is not part of this audit

## Deliverables
- A concise report listing the above functions with purpose, interactions and code references
- Optional sequence overview: how follow‑up dates trigger slot seeding → conflict checks → booking creation → slot marking

## Next Steps
- On approval, I will deliver the finalized audit write‑up and, if helpful, a simple diagram describing follow‑up auto‑booking flow. 