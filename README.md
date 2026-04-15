# AttendEase - Attendance and Leave Management Platform

AttendEase is a full-stack, role-based academic operations platform for managing course attendance, leave approvals, enrollment, and attendance analytics.

It includes:
- A React + Vite frontend for `admin`, `faculty`, and `student` users
- A Node.js + Express backend with JWT authentication and RBAC
- MongoDB persistence through Mongoose models

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [API Reference](#api-reference)
- [Domain Model and Business Rules](#domain-model-and-business-rules)
- [Security Notes](#security-notes)
- [Production Deployment Guide](#production-deployment-guide)
- [Operational Runbook](#operational-runbook)
- [Troubleshooting](#troubleshooting)
- [Known Gaps and Recommended Enhancements](#known-gaps-and-recommended-enhancements)
- [License](#license)

## Features

### Authentication and Authorization
- Register and login using email or registration number
- JWT-based stateless authentication
- Role-based access control for `student`, `faculty`, and `admin`

### Admin Capabilities
- Create users (student/faculty/admin)
- Bulk provision users via CSV upload
- Create courses and assign faculty
- Enroll students in single or all courses

### Faculty Capabilities
- Mark daily attendance per course
- Update existing attendance entries for selected date/course
- View course-level attendance report
- Export report as CSV
- Review and approve/reject student leave requests

### Student Capabilities
- View attendance percentages and eligibility status
- View subject-level analytics dashboard
- Apply leave for enrolled courses
- Track leave request status (pending/approved/rejected)

## Architecture

High-level request flow:

1. React frontend sends REST requests to Express backend.
2. Backend validates JWT token and role permissions.
3. Controllers apply business rules.
4. Mongoose models read/write MongoDB.
5. Backend returns JSON payloads consumed by frontend pages.

## Tech Stack

### Frontend
- React 19
- React Router
- Axios
- Recharts
- Vite

### Backend
- Node.js
- Express 5
- Mongoose
- JWT (`jsonwebtoken`)
- `bcryptjs` for password hashing
- `multer` + `csv-parser` for bulk user uploads

### Database
- MongoDB

## Repository Structure

```text
.
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── utils
│   ├── seed.js
│   └── server.js
└── frontend
    ├── src
    │   ├── components
    │   ├── context
    │   └── pages
    └── vite config and build files
```

## Prerequisites

- Node.js 18+ (recommended LTS)
- npm 9+
- MongoDB 6+ (local or managed)

## Environment Variables

Create `backend/.env` before starting backend:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/attendance_db
JWT_SECRET=replace-with-a-long-random-secret
EMAIL_PASSWORD=replace-if-email-service-is-enabled
```

Notes:
- Never commit `.env` to source control.
- Use a strong `JWT_SECRET` in production.
- Rotate any secrets previously exposed or shared.

## Local Development Setup

### 1) Install dependencies

From project root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Start backend API

```bash
cd backend
npm run dev
```

Backend runs by default on `http://localhost:5000`.

### 3) Start frontend app

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend runs by default on Vite dev server (typically `http://localhost:5173`).

### 4) Optional seed data

```bash
cd backend
node seed.js
```

Warning: `seed.js` deletes existing `User`, `Course`, and `Attendance` collections before reseeding.

## API Reference

Base URL: `http://localhost:5000/api`

Auth header for protected routes:

```http
Authorization: Bearer <jwt_token>
```

### Auth
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get authenticated user profile

### Admin
- `POST /admin/courses` - Create course (admin only)
- `GET /admin/courses` - List courses (protected)
- `POST /admin/users` - Create user (admin only)
- `GET /admin/users` - List users (admin only)
- `POST /admin/users/bulk` - Bulk upload users CSV (admin only)
- `POST /admin/enroll` - Enroll one student in one course (admin only)
- `POST /admin/enroll-all` - Enroll one student in all courses (admin only)

### Attendance
- `POST /attendance` - Mark/update attendance (faculty/admin)
- `GET /attendance/stats` - Student attendance summary (protected)
- `GET /attendance/course/:courseId` - Attendance records for course/date (protected)
- `GET /attendance/report/:courseId` - Faculty course report (faculty/admin)

### Leave
- `POST /leave` - Apply leave (protected)
- `GET /leave` - Get current user's leave requests (protected)
- `GET /leave/faculty` - Get leaves for faculty's courses (faculty/admin)
- `PUT /leave/:id/status` - Approve/reject leave (faculty/admin)

## Domain Model and Business Rules

Core entities:
- `User` (`student`, `faculty`, `admin`)
- `Course` (faculty owner, enrolled students)
- `Attendance` (date, course, student, status)
- `LeaveRequest` (student, course, date, reason, status)

Key rules enforced:
- One attendance record per `date + course + student` (unique index)
- One leave request per `student + course + date` (unique index)
- Leave statuses: `pending`, `approved`, `rejected`
- Attendance statuses: `present`, `absent`, `leave`
- Eligibility threshold set to `>= 75%`
- Course class cap defaults:
  - `theory`: 30
  - `lab`: 10

## Security Notes

- Passwords are hashed using `bcryptjs`.
- Authorization is enforced via JWT middleware and role checks.
- Protected routes reject missing/invalid tokens.
- CSV ingestion applies basic input validation.

Recommended production controls:
- Add rate limiting (`express-rate-limit`) for auth endpoints.
- Add security headers (`helmet`) and stricter CORS policy.
- Add request validation layer (`zod`/`joi`) for all endpoints.
- Add centralized audit logging for admin/faculty actions.

## Production Deployment Guide

### Backend
- Run behind a reverse proxy (Nginx/ALB/API gateway)
- Set environment variables via secret manager
- Enable process manager (PM2/systemd/container orchestrator)
- Configure health checks and restart policy
- Ensure MongoDB is reachable over private network

### Frontend
- Build static assets:

```bash
cd frontend
npm run build
```

- Serve `frontend/dist` from CDN or web server.
- If deploying frontend and backend on different domains, set CORS explicitly.

### MongoDB
- Use managed MongoDB for production when possible.
- Enable authentication, backups, and monitoring.
- Restrict network access to trusted hosts only.

## Operational Runbook

### Health checks
- Backend: verify process and port responsiveness
- Database: verify connection and query latency
- Frontend: verify static asset delivery and route loading

### Backups
- Configure automated MongoDB backups (daily minimum)
- Regularly test restore procedure

### Logging and monitoring
- Centralize API logs
- Capture error rates for auth, attendance, and leave endpoints
- Track latency for report and stats endpoints

## Troubleshooting

- `Not authorized, token failed`
  - Token expired or malformed; re-login and verify `Authorization` header format.

- `MongoDB connection error`
  - Check `MONGO_URI`, DB service status, and network/firewall rules.

- CORS errors in browser
  - Ensure backend CORS policy allows frontend origin in deployed environments.

- `Duplicate attendance` or `leave already exists`
  - Expected behavior from uniqueness constraints; update existing records instead.

## Known Gaps and Recommended Enhancements

- No automated test suite yet (`backend` test script is placeholder).
- API base URL is currently hardcoded in frontend pages.
- No refresh token/session revocation strategy.
- No API versioning yet (`/api/v1`).
- No CI/CD pipeline config committed.

Recommended next steps:
1. Add unit/integration tests for controllers and middleware.
2. Move frontend API base URL to environment variables.
3. Add structured logging and request tracing.
4. Add CI for lint, tests, and build validation.

## License

No license file is currently present in this repository.
Add a `LICENSE` file before public distribution.

