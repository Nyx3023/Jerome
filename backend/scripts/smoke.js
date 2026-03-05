const axios = require('axios')

const BASE_URL = process.env.BASE_URL || 'http://localhost:8081'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''
const STAFF_TOKEN = process.env.STAFF_TOKEN || ADMIN_TOKEN
const USER_TOKEN = process.env.USER_TOKEN || ''

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get(path, headers = {}) {
  const url = `${BASE_URL}${path}`
  const res = await axios.get(url, { headers })
  return res.data
}

async function post(path, data, headers = {}) {
  const url = `${BASE_URL}${path}`
  const res = await axios.post(url, data, { headers })
  return res.data
}

async function run() {
  const report = { steps: [] }

  try {
    const services = await get('/api/users/services')
    const hasPrenatal = Array.isArray(services) && services.some(s => (s.name || '').toLowerCase().includes('prenatal'))
    report.steps.push({ name: 'Fetch public services', ok: true, count: Array.isArray(services) ? services.length : 0 })
    report.steps.push({ name: 'Check Prenatal Care listed', ok: hasPrenatal })
  } catch (e) {
    report.steps.push({ name: 'Fetch public services', ok: false, error: e.message })
  }

  try {
    const schedules = await get('/api/users/schedules')
    report.steps.push({ name: 'Fetch public schedules (available/holiday)', ok: true, count: Array.isArray(schedules) ? schedules.length : 0 })
  } catch (e) {
    report.steps.push({ name: 'Fetch public schedules', ok: false, error: e.message })
  }

  try {
    const adminServices = await get('/api/admin/services', authHeaders(STAFF_TOKEN))
    report.steps.push({ name: 'Admin services (auth)', ok: Array.isArray(adminServices) })
  } catch (e) {
    report.steps.push({ name: 'Admin services (auth)', ok: false, error: e.response && e.response.status ? `HTTP ${e.response.status}` : e.message })
  }

  try {
    const patientId = process.env.TEST_PATIENT_ID ? Number(process.env.TEST_PATIENT_ID) : null
    if (patientId) {
      const prenatal = await get(`/api/clinic/prenatal-schedule/${patientId}`, authHeaders(STAFF_TOKEN))
      report.steps.push({ name: 'Prenatal schedule by patient (auth)', ok: Array.isArray(prenatal), count: Array.isArray(prenatal) ? prenatal.length : 0 })
    } else {
      report.steps.push({ name: 'Prenatal schedule by patient (auth)', ok: true, skipped: true, reason: 'Set TEST_PATIENT_ID to enable' })
    }
  } catch (e) {
    report.steps.push({ name: 'Prenatal schedule by patient (auth)', ok: false, error: e.response && e.response.status ? `HTTP ${e.response.status}` : e.message })
  }

  try {
    const userHeaders = authHeaders(USER_TOKEN)
    if (USER_TOKEN) {
      const appts = await get('/api/users/patient-appointments', userHeaders)
      report.steps.push({ name: 'User appointments (auth)', ok: Array.isArray(appts) })
    } else {
      report.steps.push({ name: 'User appointments (auth)', ok: true, skipped: true, reason: 'Set USER_TOKEN to enable' })
    }
  } catch (e) {
    report.steps.push({ name: 'User appointments (auth)', ok: false, error: e.response && e.response.status ? `HTTP ${e.response.status}` : e.message })
  }

  console.log(JSON.stringify(report, null, 2))
}

run().catch(err => {
  console.error('Smoke run failed:', err)
  process.exitCode = 1
})