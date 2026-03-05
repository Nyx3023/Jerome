# Cloud Deployment Guide

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │────▶│    Render     │────▶│    Aiven     │
│  (Frontend)  │     │  (Backend)    │     │   (MySQL)    │
│  React/Vite  │     │  Express.js   │     │  Database    │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Set Up Aiven MySQL

1. Go to [aiven.io](https://aiven.io) and sign up (free tier, no credit card)
2. Create a new **MySQL** service (Free plan)
3. Wait for it to be "Running" (~2 minutes)
4. Go to the service **Overview** page and note these connection details:
   - **Host** (e.g., `mysql-xxxxx-yyyy.aiven.io`)
   - **Port** (e.g., `12345`)
   - **User** (usually `avnadmin`)
   - **Password** (generated automatically)
5. In the Aiven console, go to **Databases** tab and create a database called `appointment_system`

### Import Your Data

1. Download the **CA Certificate** from Aiven's service Overview page (save as `ca.pem` in the project root)
2. Open **PowerShell**, navigate to the project root, and run:

```powershell
cmd /c "mysql -h YOUR_AIVEN_HOST -P YOUR_PORT -u avnadmin -p --ssl-ca=ca.pem appointment_system < ""appointment_system (1).sql"""
```

Or use **DBeaver** / **MySQL Workbench** to connect to Aiven and import the SQL file (recommended for beginners).

---

## Step 2: Deploy Backend to Render

1. Push your code to **GitHub** (if not already)
2. Go to [render.com](https://render.com) and sign up
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Configure:

| Setting | Value |
|---|---|
| **Name** | `clinic-backend` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

6. Add these **Environment Variables** in the Render dashboard:

| Key | Value |
|---|---|
| `DB_HOST` | Your Aiven MySQL host |
| `DB_PORT` | Your Aiven MySQL port |
| `DB_USER` | `avnadmin` |
| `DB_PASS` | Your Aiven MySQL password |
| `DB_NAME` | `appointment_system` |
| `DB_SSL` | `true` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `clinic_jwt_secret_2024` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after Vercel deploy) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `cliniclyingin48@gmail.com` |
| `SMTP_PASS` | `rnpj nobb hrkl ahty` |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USER` | `cliniclyingin48@gmail.com` |
| `MAIL_PASSWORD` | `rnpj nobb hrkl ahty` |
| `MAIL_FROM` | `Clinic Healthcare System <cliniclyingin48@gmail.com>` |

7. Click **Deploy** — wait for it to build and show "Live"
8. Note your Render URL (e.g., `https://clinic-backend-xxxx.onrender.com`)

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Add this **Environment Variable**:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://clinic-backend-xxxx.onrender.com` (your Render URL) |

6. **IMPORTANT**: Edit `frontend/vercel.json` and replace `YOUR_RENDER_BACKEND_URL` with your actual Render domain (e.g., `clinic-backend-xxxx`)

7. Click **Deploy**

---

## Step 4: Connect Everything

After both are deployed:

1. **Update Render's `FRONTEND_URL`** env var to your Vercel URL (e.g., `https://your-app.vercel.app`)
2. **Redeploy Render** (click "Manual Deploy" in Render dashboard)
3. Test the app by visiting your Vercel URL

---

## Local Development (Still Works!)

Nothing changes for local development:

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Your `.env` still has `localhost` defaults, so XAMPP MySQL (or any local MySQL) works as before.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Backend can't connect to Aiven | Check `DB_SSL=true` is set, verify host/port/password |
| CORS errors in browser | Update `FRONTEND_URL` on Render to match your Vercel URL exactly |
| Frontend shows blank page | Check `VITE_API_URL` is set correctly on Vercel |
| SSE/EventSource not connecting | Verify the Render backend is awake (free tier sleeps after 15 min) |
| Render free tier is slow first load | This is normal — free tier takes ~30s to wake up after inactivity |
