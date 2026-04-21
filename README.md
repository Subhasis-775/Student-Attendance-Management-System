<p align="center">
  <img src="https://img.shields.io/badge/AttendEase-v1.0-4f46e5?style=for-the-badge&logo=checkmarx&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-9-47a248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=white" />
</p>

# 🎓 AttendEase — Student Attendance Management System

**AttendEase** is a full-stack, enterprise-grade, role-based Student Attendance Management System designed to digitize and automate the daily attendance workflow across a university department. Built with a modern MERN stack (MongoDB, Express 5, React 19, Node.js), the platform provides dedicated dashboards for **Administrators**, **Faculty**, and **Students**, each with tailored features including real-time analytics, leave management, bulk provisioning, and automated compliance monitoring.

> **6th Semester B.Tech Project — Department of Computer Science & Engineering**

---

## 📋 Table of Contents

1.  [Key Features](#-key-features)
2.  [System Architecture](#-system-architecture)
3.  [Tech Stack](#-tech-stack)
4.  [Data Models](#-data-models)
5.  [API Reference](#-api-reference)
6.  [Project Structure](#-project-structure)
7.  [Getting Started](#-getting-started)
8.  [Seeded Data & Credentials](#-seeded-data--credentials)
9.  [Role-Based Dashboards](#-role-based-dashboards)
10. [Business Logic & Edge Cases](#-business-logic--edge-cases)
11. [UI/UX Design System](#-uiux-design-system)
12. [Background Services](#-background-services)
13. [Future Roadmap](#-future-roadmap)

---

## ✨ Key Features

### Multi-Actor Role System
| Role | Capabilities |
|------|-------------|
| **Admin** | Full system control — provision users, create courses, enroll students, bulk CSV import, view analytics, monitor at-risk students, export data |
| **Faculty** | Mark daily attendance (present/absent/leave) per course, view cohort reports with charts, approve/reject student leave requests, export attendance CSV |
| **Student** | View personal attendance stats with bar charts, track eligibility status per subject, apply for leave with justification, change password |

### Core Platform Capabilities
- 🔐 **JWT Authentication** — Secure token-based auth with email or registration number login
- 📊 **Real-Time Analytics** — KPI cards, area charts, bar charts for attendance trends
- 📋 **Bulk CSV Provisioning** — Mass-import students via CSV upload with BOM-safe parsing
- 📝 **Multi-Actor Leave Workflow** — Student applies → Faculty reviews → System auto-updates attendance
- ⚠️ **Automated Compliance Alerts** — Nightly cron job emails students below 75% threshold
- 🌙 **Dark Mode** — Full theme toggle with CSS custom properties
- 📱 **Fully Responsive** — Mobile-first design with collapsible sidebar and stacked layouts
- 🎨 **Premium SaaS UI** — Framer Motion animations, glassmorphism, dual-typeface typography

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19 + Vite 8)               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│  │ Home Page│  │Admin Dashboard│  │Faculty Dashboard│ │Student │  │
│  │ Login    │  │  Analytics   │  │  Mark Attend  │  │Overview│  │
│  │ Register │  │  User Mgmt   │  │  Reports/CSV  │  │ Leaves │  │
│  └──────────┘  └──────────────┘  └──────────────┘  └────────┘  │
│                         ▼ Axios HTTP ▼                          │
├─────────────────────────────────────────────────────────────────┤
│                     SERVER (Express 5 + Node.js)                │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Auth Routes │  │ Admin Routes │  │ Attendance & Leave     │  │
│  │  /api/auth  │  │ /api/admin   │  │ /api/attendance        │  │
│  │            │  │              │  │ /api/leave             │  │
│  └─────┬──────┘  └──────┬───────┘  └───────────┬────────────┘  │
│        │   ┌────────────┴─────────────┐        │               │
│        ▼   ▼                          ▼        ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Middleware   │  │ Controllers  │  │     Services        │  │
│  │ protect/admin │  │ auth/admin/  │  │ attendanceService   │  │
│  │ /faculty     │  │ attendance/  │  │ cronService         │  │
│  │              │  │ leave        │  │ sendEmail           │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      DATABASE (MongoDB + Mongoose 9)            │
│  ┌──────┐  ┌────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │ User │  │ Course │  │ Attendance │  │  LeaveRequest    │   │
│  └──────┘  └────────┘  └────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 22.x | JavaScript runtime |
| **Express** | 5.2 | REST API framework |
| **Mongoose** | 9.4 | MongoDB ODM with schema validation |
| **JSON Web Token** | 9.0 | Stateless authentication |
| **bcryptjs** | 3.0 | Password hashing (10 salt rounds) |
| **multer** | 2.1 | Multipart file upload (CSV) |
| **csv-parser** | 3.2 | Streaming CSV parsing with BOM handling |
| **node-cron** | 4.2 | Scheduled background tasks |
| **nodemailer** | 8.0 | SMTP email dispatch |
| **dotenv** | 17.4 | Environment variable management |
| **cors** | 2.8 | Cross-origin resource sharing |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2 | UI component library |
| **Vite** | 8.0 | Build tool and dev server |
| **React Router** | 7.14 | Client-side routing with role guards |
| **Axios** | 1.15 | HTTP client |
| **Recharts** | 3.8 | Data visualization (Bar, Area charts) |
| **TanStack Table** | 8.21 | Headless table with sorting, pagination, search |
| **Framer Motion** | 12.38 | Physics-based animations & transitions |
| **Lucide React** | 1.8 | Icon library (200+ icons) |
| **@fontsource/outfit** | 5.2 | Premium geometric display typeface |
| **date-fns** | 4.1 | Date utility functions |

---

## 📦 Data Models

### User
```javascript
{
  name:               String (required),
  email:              String (required, unique),
  registrationNumber: String (partial unique index),
  password:           String (bcrypt hashed),
  role:               'student' | 'faculty' | 'admin',
  lastWarningSentAt:  Date,
  timestamps:         true
}
```

### Course
```javascript
{
  courseCode:  String (required, unique),     // e.g. "CS3102"
  name:       String (required),             // e.g. "Deep Learning"
  type:       'theory' | 'lab',
  maxClasses: Number (default: 30 theory, 10 lab),
  faculty:    [ObjectId → User],             // Supports multiple faculty per course
  students:   [ObjectId → User],
  timestamps: true
}
```

### Attendance
```javascript
{
  date:    Date (required),
  course:  ObjectId → Course (required),
  student: ObjectId → User (required),
  status:  'present' | 'absent' | 'leave',
  // Compound unique index: (date, course, student) — prevents duplicates
}
```

### LeaveRequest
```javascript
{
  student: ObjectId → User (required),
  course:  ObjectId → Course (required),
  date:    Date (required),
  reason:  String (required),
  status:  'pending' | 'approved' | 'rejected',
  // Compound unique index: (student, course, date)
}
```

### Notification
```javascript
{
  message: String,
  type:    'warning' | 'info',
  timestamps: true
}
```

---

## 🔌 API Reference

### Authentication — `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | Public | Register a new user account |
| `POST` | `/login` | Public | Login with email/regNo + password |
| `GET` | `/me` | Protected | Get current user profile |
| `PUT` | `/change-password` | Protected | Update password (requires current) |

### Administration — `/api/admin`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/courses` | Admin | Create a new course |
| `GET` | `/courses` | Protected | List all courses (populated) |
| `POST` | `/users` | Admin | Provision a single user |
| `GET` | `/users` | Admin | List all users |
| `POST` | `/users/bulk` | Admin | Bulk CSV upload (multipart) |
| `POST` | `/enroll` | Admin | Enroll student in a course |
| `POST` | `/enroll-all` | Admin | Enroll student in all courses |
| `GET` | `/analytics` | Admin | Get lowest-attendance course + at-risk students |

### Attendance — `/api/attendance`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | Faculty | Mark/update attendance (bulk upsert) |
| `GET` | `/stats` | Student | Get personal attendance summary |
| `GET` | `/monthly?month=YYYY-MM` | Protected | Monthly breakdown per course |
| `GET` | `/cumulative` | Protected | Cumulative attendance |
| `GET` | `/cumulative/admin-overview` | Admin | All students' cumulative stats |
| `GET` | `/course/:courseId?date=YYYY-MM-DD` | Faculty | Get class sheet for a date |
| `GET` | `/report/:courseId?month=YYYY-MM` | Faculty | Full student ledger for a course |

### Leave Management — `/api/leave`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | Student | Submit a leave application |
| `GET` | `/` | Student | View my leave requests |
| `GET` | `/faculty` | Faculty | Get all leaves for my courses |
| `PUT` | `/:id/status` | Faculty | Approve or reject a leave |

---

## 📂 Project Structure

```
6thSemProject/
├── README.md
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection setup
│   ├── controllers/
│   │   ├── adminController.js       # User/Course CRUD, CSV import, analytics
│   │   ├── attendanceController.js  # Mark attendance, reports, stats
│   │   ├── authController.js        # Register, login, password change
│   │   └── leaveController.js       # Leave apply, approve, reject
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT protect, admin, faculty guards
│   ├── models/
│   │   ├── Attendance.js            # Attendance schema + compound index
│   │   ├── Course.js                # Course schema (multi-faculty array)
│   │   ├── LeaveRequest.js          # Leave schema + dedup index
│   │   ├── Notification.js          # System notification schema
│   │   └── User.js                  # User schema + bcrypt hooks
│   ├── routes/
│   │   ├── adminRoutes.js           # Admin endpoints + multer config
│   │   ├── attendanceRoutes.js      # Attendance endpoints
│   │   ├── authRoutes.js            # Auth endpoints
│   │   └── leaveRoutes.js           # Leave endpoints
│   ├── services/
│   │   ├── attendanceService.js     # Attendance calculation logic
│   │   └── cronService.js           # Nightly at-risk email alerts
│   ├── utils/
│   │   └── sendEmail.js             # Nodemailer SMTP transport
│   ├── seed.js                      # Database seeder (faculty + students + attendance)
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   └── .env                         # Environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # App shell — sidebar, topbar, notifications
│   │   │   ├── KPICard.jsx          # Animated KPI stat card component
│   │   │   ├── SaaSTable.jsx        # TanStack-powered data table (search, pagination)
│   │   │   └── SideDrawer.jsx       # Off-canvas detail inspector panel
│   │   ├── config/
│   │   │   └── api.js               # Axios base URL configuration
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # React Context for auth state + localStorage
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Public landing page with hero + features
│   │   │   ├── Login.jsx            # Auth form (email/regNo + password)
│   │   │   ├── Register.jsx         # Registration form with validation
│   │   │   ├── AdminDashboard.jsx   # Admin hub — KPIs, charts, tables, forms
│   │   │   ├── FacultyDashboard.jsx # Attendance marking interface
│   │   │   ├── FacultyReport.jsx    # Course analytics + student ledger + CSV export
│   │   │   ├── FacultyLeave.jsx     # Leave approval workflow queue
│   │   │   ├── StudentDashboard.jsx # Personal stats + subject breakdown
│   │   │   ├── StudentLeave.jsx     # Leave application form + history
│   │   │   └── Profile.jsx          # User profile + password change
│   │   ├── App.jsx                  # Route definitions + PrivateRoute guards
│   │   ├── main.jsx                 # React DOM entry point
│   │   └── index.css                # Global design system (1300+ lines)
│   ├── package.json
│   └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **MongoDB** — Local instance or MongoDB Atlas URI
- **npm** ≥ 9.x

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Student-Attendance-Management-System.git
cd Student-Attendance-Management-System
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_db
JWT_SECRET=your_jwt_secret_key_here

# Optional: For automated email alerts
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Seed the Database
```bash
cd backend
node seed.js
```
This populates the database with:
- 1 Admin user
- 8 Faculty members (real department faculty)
- 90 Students (real registration numbers)
- 9 Courses (6 theory + 3 lab)
- ~9,450 randomized attendance records across 20 theory days & 7 lab sessions

### 5. Start Development Servers
```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Seeded Data & Credentials

> **Default Password for ALL accounts:** `password123`

### Admin Account
| Email | Password |
|-------|----------|
| `admin@university.edu` | `password123` |

### Faculty Accounts
| Name | Email | Courses |
|------|-------|---------|
| Dr. Sanjukta Mohanty | `sanjukta@university.edu` | CS3102 Deep Learning, CS3502 DL Lab, CS3602 Project |
| Dr. Meenakhsi Pant | `meenakhsi@university.edu` | CS3202 Data Mining, CS3602 Project |
| Dr. Debasish Kar | `debasish@university.edu` | IP3403 Industrial Safety Engineering |
| Mr. Santosh Maharana | `santosh@university.edu` | CS3208 Internet & Web Technology, CS3602 Project |
| Ms. Jyotirmayee Routray | `jyotirmayee@university.edu` | CS3104 Compiler Design, CS3504 CD Lab, CS3602 Project |
| Prof. Bharat Chandra Barik | `bharat@university.edu` | BH3403 Entrepreneurship Development |
| Dr. Ashis Kumar Mishra | `ashis@university.edu` | CS3602 Project |
| Manoranjan Panda | `manoranjan@university.edu` | CS3602 Project |

### Student Accounts
Login with registration number or auto-generated email:
- Example: Registration `23110318` → Email `23110318@university.edu`
- 90 students enrolled across all 9 courses

### Course Registry
| Code | Course Name | Type | Max Classes |
|------|-------------|------|-------------|
| CS3102 | Deep Learning | Theory | 30 |
| CS3104 | Compiler Design | Theory | 30 |
| CS3202 | Data Mining | Theory | 30 |
| CS3208 | Internet and Web Technology | Theory | 30 |
| IP3403 | Industrial Safety Engineering | Theory | 30 |
| BH3403 | Entrepreneurship Development | Theory | 30 |
| CS3502 | Deep Learning Laboratory | Lab | 10 |
| CS3504 | Compiler Design Laboratory | Lab | 10 |
| CS3602 | Project for Product Development - I | Lab | 10 |

---

## 👥 Role-Based Dashboards

### 🛡️ Admin Dashboard
- **KPI Overview** — Global Health Rate, Active Students count, Flagged Students count
- **Cohort Trajectory Chart** — 30-day area chart showing attendance trend
- **Core Modules Health** — Horizontal bar chart for per-course attendance
- **Student Directory Hub** — Searchable, paginated table with enrollment counts and row-click detail drawer
- **Course Registry** — All courses with faculty names, type badges, enrollment counts
- **At-Risk Panel** — Students below 75% highlighted with red border, option to send intervention alerts
- **Provision Identity** — Form to create individual users (student/faculty/admin)
- **Bulk CSV Import** — Upload `.csv` file with `name, registrationNumber` columns; auto-generates emails, handles BOM characters
- **Setup Course** — Create course with code, name, faculty linkage, pedagogy type, class ceiling
- **Enrollment Manager** — Link students to courses individually or bulk-enroll to all

### 👨‍🏫 Faculty Dashboard
- **Mark Attendance** — Select course + date → table of enrolled students with Present/Absent/Leave toggle buttons
- **Bulk Actions** — "Mark All Present" and "Mark All Absent" shortcuts
- **Edit Existing Records** — If attendance already exists for the date, loads and allows updates
- **Live Counters** — Present, Absent, Leave counts update in real-time as toggles change
- **Attendance Report** — Select course → bar chart of student-wise distribution with 75% threshold line
- **Student Ledger** — Sorted table (lowest attendance first) with progress bars and CSV export
- **Leave Approvals** — Pending queue with student info, justification, and Approve/Reject actions; processed history table

### 🎓 Student Dashboard
- **KPI Cards** — Total Classes, Classes Attended, Classes Missed, Overall Attendance %
- **Eligibility Badge** — Green "Target Met (≥75%)" or Red "Action Required (<75%)"
- **Subject Performance Chart** — Color-coded bar chart (green ≥75%, amber ≥50%, red <50%)
- **Enrolled Subjects Table** — Subject, Code, Type, Attendance fraction, progress meter bar, eligibility status
- **Search** — Filter subjects by name or course code via the topbar search
- **Leave Requests** — Apply for leave with course, date, reason; view status history (pending/approved/rejected)

---

## ⚙ Business Logic & Edge Cases

### Attendance Engine
1. **Compound Unique Index** — Prevents duplicate marking: `(date, course, student)` compound unique
2. **Upsert Strategy** — Uses `bulkWrite` with `updateOne + upsert: true` to safely create or update records
3. **Auto-Absent Backfill** — Students not included in a submission are automatically marked `absent`
4. **Future Date Guard** — Cannot mark attendance for a future date
5. **Enrollment Validation** — Only students enrolled in the course can be marked
6. **Status Enum Validation** — Only `present`, `absent`, `leave` accepted; all others rejected

### Leave State Machine
```
Student submits → status = 'pending'
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
  Faculty approves            Faculty rejects
  status = 'approved'        status = 'rejected'
  Attendance → 'leave'       If was 'leave' → 'absent'
```

### Attendance Calculation
- **Semester Class Cap**: Each course defines its own `maxClasses` (30 for theory, 10 for lab) — this is a **per-semester** cap, not per-month
- **Eligibility Threshold**: 75% attendance required
- **Leave Treatment**: Approved leaves count as **present** for eligibility calculation
- **Capped Arithmetic**: `cappedTotal = min(actualTotal, course.maxClasses)`, `cappedAttended = min(attended, cappedTotal)`
- **Percentage**: `round((cappedAttended / cappedTotal) × 100, 2)`

### Security
- **Password Hashing** — bcrypt with 10 salt rounds, pre-save hook on User model
- **JWT Tokens** — 30-day expiry, stored in localStorage
- **Route Guards** — Three-tier middleware: `protect` (any auth), `admin` (admin only), `faculty` (faculty + admin)
- **Stale Token Rejection** — Middleware checks if user still exists in DB after JWT decode
- **Partial Unique Index** — `registrationNumber` uniqueness only enforced when value is non-null

---

## 🎨 UI/UX Design System

### Design Tokens (CSS Custom Properties)
- **Color Palette** — Zinc/Slate neutral base + Indigo primary accent + semantic Green/Red/Amber
- **Typography** — Dual typeface: `Outfit` (geometric, for headings) + `Inter` (data-optimized, for body)
- **Spacing** — 8px base grid system (`--space-1` through `--space-5`)
- **Radii** — Structured: 6px / 8px / 12px / 16px
- **Shadows** — Multi-layered: `sm` / `md` / `lg` / `xl` with adjusted dark mode opacities

### Dark Mode
Full dark theme via `.dark` class on `<html>` element, toggled in the Layout topbar:
- Zinc 950 base (`#09090b`) → Zinc 900 surfaces → Zinc 800 hover
- Adjusted text contrast: Zinc 100 primary → Zinc 400 secondary → Zinc 500 muted
- Re-calibrated shadow opacities for dark backgrounds

### Premium Components
- **KPICard** — Animated stat cards with trend indicators (up/down/neutral arrows)
- **SaaSTable** — TanStack React Table with built-in search, pagination, row selection, hover effects
- **SideDrawer** — Off-canvas inspector panel with backdrop blur
- **Layout** — Responsive app shell with animated sidebar (Framer Motion `AnimatePresence`), breadcrumbs, theme toggle, notification dropdown

### Micro-Interactions
- **Framer Motion** — `whileTap={{ scale: 0.9 }}` on all icon buttons, staggered entrance animations on the landing page
- **Ambient Background** — Animated mesh gradient orbs on the Home page hero
- **Premium Selects** — Custom SVG chevron arrow, hover/focus state transitions, dark-mode adaptive colors

---

## ⏰ Background Services

### Cron Job: At-Risk Student Alerts
- **Schedule**: Runs daily at 10:00 PM (`0 22 * * *`)
- **Logic**: Aggregates all student attendance, identifies those below 75%
- **Cooldown**: Will not re-send if a warning was sent within the last 7 days
- **Actions**:
  1. Sends HTML-formatted warning email via Nodemailer SMTP
  2. Updates `lastWarningSentAt` timestamp on the student document
  3. Creates a `Notification` record for admin audit trail

---

## 🗺 Future Roadmap

- [ ] **QR Code Attendance** — Generate session-bound QR codes for contactless check-in
- [ ] **Biometric Integration** — Fingerprint/face-ID hardware support
- [ ] **Calendar Heatmap** — GitHub-style contribution grid for attendance patterns
- [ ] **REST → GraphQL** — Optional GraphQL layer for flexible queries
- [ ] **PWA Support** — Offline-capable progressive web app with service workers
- [ ] **Timetable Integration** — Auto-detect class schedules for smarter attendance windows
- [ ] **Parent Portal** — Read-only dashboard for guardians with SMS notifications
- [ ] **Docker Deployment** — Containerized production setup with `docker-compose`
- [ ] **Unit & Integration Tests** — Jest + Supertest for backend, Vitest for frontend

---

## 📄 License

This project is developed as an academic submission for the 6th Semester B.Tech curriculum. All rights reserved.

---

<p align="center">
  <sub>Built with ❤️ using the MERN Stack</sub>
</p>
