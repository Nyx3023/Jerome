## Short Answer

Kung strict FCFS ang policy, oo — hindi na kailangan ang fixed timeslot para sa pasyente. Mas makabubuti na gawing day‑level reservation lang ang online booking, tapos mag‑check‑in at pumila pagdating. Optional pa rin ang “arrival window” label para sa reminders/ops (hindi hard appointment).

## What We Will Change

* Patient UI: tanggalin ang time picker; booking = service + date. Ipakita ang FCFS policy at on‑time arrival window (optional).

* Queue Model: iisang per‑service queue; appointment arrivals get priority kung on‑time; late → regular FCFS. No timeslot gating.

* Backend: gawing optional ang `time_slot`; treat as arrival window only. Conflict checks at capacity magiging day‑level.

* Capacity & Waitlist: per‑service daily caps; suggest next available date kapag puno; show ETA.

## Code Touch Points

* `backend/controllers/userControllers.js:321–415` — `bookAppointment`: alisin hard requirement ng `time_slot`; conflict at slot reservation magiging day‑level; optional `arrival_window`.

* `backend/controllers/adminControllers.js:6–12, 18–56` — `SLOT_SEQUENCE`/`ensureDayAvailable`: i‑deprecate o gawing capacity seeding lang (hindi visible sa UI).

* `backend/controllers/adminControllers.js:690–1137` — slot upserts/checks: gawing day‑level capacity ops; hindi na per‑timeslot booking lock.

* `backend/controllers/clinicEnhancementsController.js:32+` — maraming `time_slot` usage; i‑refactor to queue insert/check‑in/call‑next mechanics.

* `backend/utils/sse.js` — gamitin para sa real‑time queue board updates.

* `frontend/src/pages/userPage/Booking.jsx` — remove time selection; add FCFS messaging and arrival guidance.

* `frontend/src/pages/staffPage/WalkInRecord.jsx`, `frontend/src/components/WalkInPatientEnhanced.jsx`, `frontend/src/pages/*/ServiceOnlinePatients.jsx` — unify queue board per service; show position/ETA; call‑next.

## API Additions

* `POST /queues/checkin` — mark arrival; compute priority bucket and position.

* `POST /queues/call-next` — staff advances queue; handles no‑show.

* `GET /queues/:service/board` — real‑time list with states.

* `GET /queues/:service/estimate` — estimated wait times.

## Data Model

* Keep `booking(date, service_type, user_id, is_appointment, arrival_window?)`.

* `queues` table (service, booking\_id/null, is\_appointment, state, arrived\_at, called\_at, completed\_at, priority\_bucket).

* Optional: retain `slots` only for capacity planning; not shown to users.

## Policy Details

* Priority window: default ±15 minutes; configurable per clinic.

* Late arrivals: lose priority; join regular FCFS.

* No‑shows: after grace period, release and move to waitlist.

## Migration & Compatibility

* Existing bookings with `time_slot`: map to `arrival_window` label; notify patients of FCFS policy change.

* Reporting: collect wait‑time metrics; export CSV.

## Deliverables

* Day‑level booking UX, unified queue per service, real‑time board, ETA.

* Admin/staff tools to call‑next/no‑show; daily caps; next‑day suggestions.

* Clear patient messaging on FCFS + arrival window.

