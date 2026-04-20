# AttendEase: Student Attendance Management System

A comprehensive, web-based platform engineered to streamline and automate student attendance tracking for modern educational institutions. AttendEase replaces outdated spreadsheets with a centralized system that offers daily attendance logging, real-time analytics, automatic percentage calculations, and automated eligibility detection.

---

## ✨ Features

- **Daily Attendance Entry:** Effortless recording of attendance data with real-time updates.
- **Automated Analytics:** Instant calculation of monthly attendance metrics and historical trends.
- **75% Eligibility Detection:** Automatic flagging of at-risk students who fall below the mandatory 75% attendance threshold.
- **Max Classes Governance:** Enforces structured term rules (e.g., maximum 30 classes per course configuration).
- **Multi-Role Flow:** Dedicated, secure interfaces for Students, Faculty, and System Administrators.
- **SaaS-Grade UI:** A responsive, polished interface featuring glassmorphism elements and an intelligent Global Dark Mode toggle.

## 🛠️ Tech Stack

- **Frontend:** React.js, Custom Semantic CSS (with CSS variable-based theming)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose ORM)
- **Data Visualization:** Recharts

## 🖥️ System Flow

1. **Authentication:** Users (Student, Faculty, or Admin) log securely into the system.
2. **Registry Management (Admin):** Administrators provision users and assign faculty to specific courses.
3. **Daily Operations (Faculty):** Faculty members log into their dashboard and mark daily attendance for their enrolled students.
4. **Analytics Pipeline:** The system algorithmically calculates the attendance percentage.
5. **Visibility (Student/Admin):** Students track their eligibility status live, while Admins get a bird's-eye view of university-wide metrics and at-risk alerts.

## 🛡️ Edge Cases Handled

- **Duplicate Attendance Prevention:** Enforces idempotency to prevent multiple attendance records for the same student on the same day.
- **Division by Zero Protection:** Failsafes built into analytics calculation for newly created classes with zero sessions.
- **Late Enrollments:** Accurately normalizes data for students joining mid-month.
- **Optimistic UI Updates & Validation:** Mitigates double-submission handling on slow networks through robust loading states and input sanitization.

## 🚀 Installation & Setup

Follow these steps to run the project locally.

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/Student-Attendance-Management-System.git
cd Student-Attendance-Management-System
```

**2. Setup Environment Variables**
Create a `.env` file in the `backend` directory and add your credentials:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

**3. Install Dependencies & Run Backend**
```bash
cd backend
npm install
npm run dev
```

**4. Install Dependencies & Run Frontend**
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will be running at `http://localhost:5173`.

## 📁 High-Level Folder Structure

```text
Student-Attendance-Management-System/
├── backend/
│   ├── controllers/      # Route controllers (auth, admin, faculty, student)
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express API endpoints
│   ├── middleware/       # JWT auth and role validation
│   └── server.js         # Entry point
│
└── frontend/
    ├── public/           # Static assets
    └── src/
        ├── components/   # Reusable UI components (Layout, Pagination, etc.)
        ├── context/      # React Context (AuthContext for global state)
        ├── pages/        # Dashboard views and App Pages
        ├── App.jsx       # Client routing
        └── index.css     # Global semantic design system
```

## 🔮 Future Improvements

- **Push Notifications:** Alerting students dynamically when they drift near the 75% threshold.
- **Export Engine:** One-click CSV/PDF export generation for administrative compliance reports.
- **Leave Management:** Multi-tier approval workflow for medical or extracurricular leave requests.

## 👨‍💻 Author

**Subhasis Rout**  
*Full Stack Developer*  
[LinkedIn Profile] | [GitHub Profile]
