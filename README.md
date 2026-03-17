# Bahari CBO - Temperature Monitoring System

IoT temperature monitoring for fish cages and seaweed farms.

## Quick Start

### Backend
```bash
cd backend
npm install
# Edit .env — set EMAIL_USER, EMAIL_PASS for OTP delivery
npm run dev
```
API runs at: http://localhost:5000
Swagger docs: http://localhost:5000/api-docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at: http://localhost:5173

---

## Authentication Flow

```
Register → Email OTP (verify account)
Login    → Password check → OTP (2FA) → JWT token
```

### OTP Types
| Type | When |
|------|------|
| `email_verify` | After registration |
| `login_2fa` | On every login |
| `password_reset` | Forgot password |

OTP expires in **5 minutes**, max **5 attempts** before lockout.

---

## User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access: manage users, devices, locations |
| `monitor` | Read-only: view dashboard, readings, alerts |

---

## IoT Device Integration

Devices post readings using their **API key** (shown once at registration):

```http
POST /api/readings
x-device-key: <device-api-key>
Content-Type: application/json

{
  "temperature": 28.5,
  "unit": "C",
  "humidity": 75
}
```

Readings outside the location's `tempMin`/`tempMax` automatically trigger alerts and are broadcast in real-time via **Socket.IO**.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/verify-email` | Verify email OTP |
| POST | `/api/auth/login` | Login (step 1) |
| POST | `/api/auth/verify-otp` | Verify 2FA OTP (step 2) |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/forgot-password` | Request reset OTP |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/locations` | List/create locations |
| GET/PUT/DELETE | `/api/locations/:id` | Location CRUD |
| GET/POST | `/api/devices` | List/register devices |
| POST | `/api/devices/:id/regenerate-key` | New API key |
| POST | `/api/readings` | Post reading (device) |
| GET | `/api/readings` | Get readings |
| GET | `/api/readings/latest` | Latest per device |
| GET | `/api/readings/stats` | Aggregated stats |
| GET | `/api/readings/alerts` | Alert readings |
| GET | `/api/users` | List users (admin) |
| PUT | `/api/users/profile` | Update own profile |
| PUT | `/api/users/change-password` | Change password |

Full interactive docs at: `http://localhost:5000/api-docs`

---

## Environment Variables (backend/.env)

```
MONGO_URI=mongodb://...
JWT_SECRET=...
OTP_EXPIRES_MINUTES=5
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Bahari CBO <your@email.com>
CLIENT_URL=http://localhost:5173
```

> For Gmail: use an **App Password** (not your main password).
> Enable 2-step verification → Google Account → Security → App Passwords.
