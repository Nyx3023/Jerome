## Booklet → System Mapping
- Patient Profile: patients table and UI profile pages; history shown via `getMyMedicalHistory`.
- Prenatal Visit Log: `createPrenatalSchedule`, `getPrenatalSchedule`, `completePrenatalVisit` (stores GA, BP, weight, fundal height, FHR, assessment/plan, next visit date).
- Laboratory Results: `addLabResult`, `getLabResults` (test type/category/date/result/interpretation).
- Immunizations: `addImmunization`, `getImmunizations` (vaccine type/date/dose/next due date/provider).
- Screenings: `addScreening`, `getScreenings` (maternal screenings; can auto-schedule follow-ups for linked patients).
- Postpartum: `addPostpartumAssessment`, `getPostpartumAssessments` (BP, lochia, breastfeeding, mood, etc.).
- Medical Notes: `addMedicalNotes` links an appointment with structured updates and can auto-schedule follow-up.

## Demo Flow (No Edits)
1) Create a Prenatal Visit
- UI: Open a doctor/staff appointment, complete with category Prenatal Care (SmartCompletionModal). Enter GA, vitals, findings, and set `next_visit_date`.
- Outcome: Visit saved; `ensureDayAvailable` seeds slots for `next_visit_date` (no auto-book yet).

2) Auto-Schedule a Follow-Up (Optional via Medical Notes)
- Submit `addMedicalNotes` for the same booking with `next_appointment_suggestion` = the desired date.
- System checks for conflicts, seeds availability, and creates a follow-up booking linked to the original.

3) Record Labs/Screenings
- Add a lab result or screening from the same appointment; set follow-up if needed.
- Screenings and some flows auto-create follow-up bookings for linked patients; labs seed availability for follow-ups.

4) Record Immunizations
- Enter maternal tetanus (TT) or other vaccines with `next_due_date` to reflect preventive schedule.

5) Postpartum Entry
- After delivery, log postpartum assessment with vitals/status and any needed follow-up.

## Verify Automation
- Check Schedules: `ensureDayAvailable` updates the calendar to show the `next_visit_date` as Available.
- Check Follow-Up Booking: Verify a new booking exists linked to the original (medical notes/screening flows), and involved slots are marked `booked`.
- Double-Booking Guard: Attempt to book online while an upcoming booking exists; system should block.

## Where To View In UI
- Patient medical history: User page `MedicalHistory.jsx` and doctor/staff patient record pages.
- Prenatal schedule list: Doctor/Staff pages show per-patient prenatal entries.
- Appointments: Patient’s My Appointments page and Admin/Doctor appointment lists.

## What I Will Provide After Approval
- A guided, step-by-step run-through using your UI screens:
  - Create a sample prenatal visit and show seeded `next_visit_date` on the calendar.
  - Add medical notes to auto-schedule a follow-up; show the new booking.
  - Demonstrate the double-booking prevention with an example.
- Screens/links and exact endpoints used, plus quick checks that the data appears in the correct history views.