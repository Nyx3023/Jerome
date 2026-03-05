## Current Status (Verified)
- Patient-facing Medical History already shows tabs for Medical Notes, Lab Results, Procedures, Screenings, Immunizations, Prenatal, Postpartum, Family Planning, Baby Records (frontend/src/pages/userPage/MedicalHistory.jsx:277–379).
- Online patient endpoints exist: getMyMedicalHistory, getMyLabResults, getMyScreenings, getMyImmunizations, getMyPrenatalRecords, getMyPostpartumRecords, getMyFamilyPlanningRecords, getMyBabyRecords (backend/controllers/medicalNotesController.js:836, 983, 1050, 1083; backend/controllers/clinicEnhancementsController.js:1372–1561).
- Automation: next-visit seeding and auto follow-ups are active and conflict-safe.

## What’s Missing
- A consolidated “Pregnancy Booklet” view that aggregates prenatal visits, labs, screenings, immunizations, postpartum into one printable, guided page for online patients.
- “Upcoming maternal schedule” timeline combining prenatal next_visit_date, immunization next_due_date, and follow-up bookings.

## Implementation Plan
### Backend
1) Create unified booklet endpoint `GET /api/users/my-pregnancy-booklet` that composes:
- Prenatal schedule (latest first) → fields: GA, vitals, assessment, plan, next_visit_date.
- Labs (maternal-relevant) → test_type/category/date/result/reference_range/status.
- Screenings → type/date/results/status/recommendations/follow_up_date.
- Immunizations → vaccine_type/date_given/dose/next_due_date/provider.
- Postpartum → assessment_date, notes, recovery_status, follow_up_plan.
- Upcoming schedule → merge of: prenatal.next_visit_date, immunizations.next_due_date, booking.follow_up_due_on.

2) Reuse existing queries (no schema changes), map to a unified JSON structure with sections and a summary timeline.

### Frontend
3) Add a new tab in Medical History: “Pregnancy Booklet”.
- Render sections with grouped cards (Prenatal, Labs, Screenings, Immunizations, Postpartum) and a top “Upcoming Maternal Schedule” timeline.
- Add “Print Booklet PDF” using existing `simplePdfGenerator` helpers.

### Validation
4) Populate with one sample patient:
- Record a prenatal visit with next_visit_date; confirm it appears in the booklet and timeline.
- Add a lab result and a screening; confirm they show under the booklet sections.
- Record an immunization with next_due_date; confirm timeline shows the next dose.
- Add postpartum entry; confirm section displays.
- Confirm that an online patient with an upcoming follow-up cannot book another appointment until resolved.

### Notes
- No billing/SMS features will be added.
- All data read uses existing endpoints; we only add the unified booklet endpoint and UI tab.

## After Approval
- Implement the unified endpoint and the frontend tab, then run a quick end-to-end check and share exact code references and screenshots (or PDF) of the booklet view.