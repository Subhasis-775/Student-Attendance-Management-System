<div align="center">
  <img src="https://img.icons8.com/color/96/000000/attendance-mark.png" alt="AttendEase Logo">
  <h1>AttendEase</h1>
  <p><strong>A Modern, Enterprise-Grade Student Attendance & Leave Management System</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Node.js-18+-green.svg?style=for-the-badge&logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-5-lightgray.svg?style=for-the-badge&logo=express" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-success.svg?style=for-the-badge&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Vite-6-purple.svg?style=for-the-badge&logo=vite" alt="Vite" />
  </p>
</div>

---

## 📖 Overview

**AttendEase** represents a professional transformation of legacy educational tracking. It replaces outdated spreadsheets with a centralized, responsive platform offering daily attendance logging, real-time analytics, automated eligibility detection, and a multi-tier leave approval workflow.

Designed with a high-fidelity SaaS-grade interface, AttendEase ensures an intuitive experience across mobile devices, tablets, and desktop environments.

---

## ✨ Enterprise Features

- 📊 **Real-time Analytics & Dashboarding:** Instant calculation of monthly attendance metrics, historical trends, and centralized tracking via Recharts.
- 🚨 **Automated Eligibility Detection:** Real-time flagging of at-risk students who fall below the mandatory `75%` attendance threshold.
- 🚀 **Bulk User Provisioning:** Robust CSV import engine for administrators, handling edge cases like hidden BOM characters and alias matching seamlessly.
- 📝 **Multi-Actor Leave Workflow:** Secure leave application portal for students with faculty & admin approval pipelines.
- 🛡️ **Role-Based Access Control (RBAC):** Strict JWT-based segregation of interfaces for **Admin**, **Faculty**, and **Student** personas.
- 📱 **Mobile-Responsive SaaS UI:** Stunning, responsive interface featuring dynamic collapsible sidebars, scalable data tables, password visibility toggles, and modern UI tokens.
- 🔒 **Data Consistency:** Optimistic UI updates, duplicate attendance prevention (idempotency), and dynamic normalization for newly enrolled students.

---

## 🛠️ Technology Stack

**Frontend Client:**
- **Core:** React.js v19, React Router v7
- **Tooling:** Vite, ESLint
- **Styling:** Custom Semantic CSS / Tailwind CSS v4, Glassmorphism design system
- **Visualization:** Recharts
- **Icons:** Lucide React

**Backend API:**
- **Core:** Node.js, Express.js v5
- **Database:** MongoDB, Mongoose ORM (v9)
- **Security:** JWT (JSON Web Tokens), bcryptjs
- **Utilities:** Multer (File Uploads), `csv-parser` (Bulk Import), Nodemailer (Notifications), Node-Cron (Scheduled Tasks)

---

## 🖥️ Platform Modules

### 1. 🎓 Student Portal
- **Dashboard:** Live view of total classes, attended sessions, and aggregate eligibility status.
- **Leave Management:** Submit leave requests with reasons and real-time approval status tracking.
- **Profile:** Manage account metrics.

### 2. 👨‍🏫 Faculty Portal
- **Registry:** Direct portal to view and select assigned subjects and corresponding student batches.
- **Roll Call Engine:** Intuitive ledger to mass-mark present/absent statuses.
- **Approval Queue:** Screen and authorize student leave applications for respective cohorts.
- **Reporting:** Exportable performance sheets and attendance reports.

### 3. 👑 Admin Control Center
- **Directory Provisioning:** One-click bulk user creation via CSV or granular individual user creation.
- **Analytics View:** Bird's eye view of university-wide metrics, overall absentee rates, and at-risk students.
- **Workflow Governance:** Final overrides on leave requests and system configurations.

---

## 🚀 Installation & Setup

Set up the project locally for development or testing:

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Instance (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/student-attendance-management.git
cd student-attendance-management
```

### 2. Backend Initialization
Navigate to the backend directory, install packages, and set up your environment:
```bash
cd backend
npm install
```

Create a `.env` file in the `/backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendeesDB  # Or your MongoDB Atlas URI
JWT_SECRET=your_super_secret_jwt_key
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Initialization
In a new terminal split, initialize the client application:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

> **Note:** The frontend runs on `http://localhost:5173` while API requests are proxied/routed to `http://localhost:5000`.

---

## 📁 System Architecture

```text
Student-Attendance-Management-System/
├── backend/
│   ├── controllers/      # Route controllers (auth, admin, faculty, attendance, leave)
│   ├── models/           # Mongoose schemas (User, Class, Attendance, Leave)
│   ├── routes/           # Express API endpoints
│   ├── middleware/       # JWT verification and RBAC guards
│   └── server.js         # Backend Entry point
│
└── frontend/
    ├── public/           # Static assets
    └── src/
        ├── components/   # Reusable UI components
        ├── context/      # React Context (Auth State Manager)
        ├── pages/        # Route Modules (Dashboards, Leave, Auth)
        ├── App.jsx       # Client App Routing Engine
        └── index.css     # Global semantic design system
```

---

## 🔮 Future Roadmap

- [ ] **Push Event Integration:** WebSockets for real-time alerting to students when they drop near the 75% threshold.
- [ ] **Comprehensive Export Engine:** One-click PDF generation for administrative compliance reports alongside CSV.
- [ ] **QR Code/RFID Check-in:** Contactless attendance marking to accelerate physical class roll calls.

---

## 👨‍💻 Developed By

**Subhasis Rout**  
*Full Stack Developer*  
Have questions or want to collaborate? Reach out!

<div align="left">
  <a href="https://www.linkedin.com/in/subhasis-rout" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
</div>
