# Northbridge University Campus Portal

Northbridge University Campus Portal is a full-stack university management system for students, lecturers, helper staff, managers, and administrators. It centralizes campus resource booking, booking approvals, resource management, issue tracking, user administration, notifications, analytics, and PDF-style reporting in one role-based platform.

## Features

- Public home and about pages with Northbridge branding
- Role-based login for admins, managers, students, lecturers, and helper staff
- Google OAuth 2.0 sign-in for registered emails
- Student, lecturer, manager, and helper staff management from the admin panel
- Resource catalogue with availability views
- Resource booking workflow with approval and rejection
- Booking manager dashboard with upcoming booked resource hero section
- Booking history analytics with filters, pagination, deletion, and report download
- Resource manager dashboard with inventory, holidays, availability, and analysis reports
- Issue/ticket management with comments, assignment, status updates, and reports
- Notifications with mark-as-read and mark-all-read behavior
- Profile image support for users and students
- Tab-isolated auth state so manager and client sessions can run in separate browser tabs

## Tech Stack

**Frontend**

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Framer Motion
- Lucide React

**Backend**

- Java 17
- Spring Boot 3.1
- Spring Web
- Spring Data JPA
- Spring Security
- OAuth 2.0 Client
- MySQL
- OpenPDF

## Project Structure

```text
Northbridge-University/
├── backend/                 # Spring Boot API
│   ├── src/main/java/...
│   ├── src/main/resources/application.properties
│   └── .env.example
├── frontend/                # React + Vite app
│   ├── src/app/...
│   ├── src/components/...
│   ├── src/services/...
│   └── package.json
└── README.md
```

## Prerequisites

- Java 17 or newer
- Node.js and npm
- MySQL Server
- Git
- Google Cloud OAuth client, only if testing Google sign-in

## Database Setup

Create a MySQL database:

```sql
CREATE DATABASE northbridge_university_db;
```

The backend currently uses these local credentials in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/northbridge_university_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=123456
```

Update those values if your local MySQL username or password is different.

## Google OAuth Setup

Google login only works for emails already registered in the admin panel. For example, if a booking manager is created with `person@gmail.com`, that same Google account can sign in as that booking manager.

Create a local file:

```text
backend/.env
```

Add:

```env
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

The real `.env` file is ignored by Git. Use `backend/.env.example` as the template.

In Google Cloud Console, add this authorized redirect URI:

```text
http://localhost:8081/login/oauth2/code/google
```

## Run Locally

Start the backend:

```bash
cd backend
./mvnw spring-boot:run
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend runs on:

```text
http://localhost:8081
```

## Main Routes

```text
/                         Public home page
/about                    About Northbridge University
/admin/login              Admin login
/admin/dashboard          Admin dashboard
/manager/login            Manager login
/manager/booking/dashboard
/manager/booking/history
/manager/resource/dashboard
/manager/resource/analysis
/manager/issue/dashboard
/client/login             Student, lecturer, helper staff login
/client/resources         Resource catalogue
/client/resourceBooking   Resource booking page
/my-bookings              Client booking history
/create-ticket            Create issue ticket
/my-tickets               Client tickets
```

## Authentication Notes

- Password login and Google login are both supported.
- Google login does not create users automatically.
- The email selected in Google must match a registered user/student email in the database.
- Manager and client sessions can be used in different browser tabs because auth reads tab-scoped `sessionStorage` first.

## Reports

The system includes printable report generation for:

- Resource inventory and analytics
- Ticket reports
- Booking history reports

Booking history reports are generated from the booking manager history analytics view and grouped by booking status.

## Useful Commands

Backend tests:

```bash
cd backend
./mvnw test
```

Frontend build:

```bash
cd frontend
npm run build
```

Frontend dev server:

```bash
cd frontend
npm run dev
```

## Known Build Note

At the time of this README update, the frontend build can be blocked by existing TypeScript errors in:

```text
frontend/src/components/ui/chart.tsx
```

Those errors are unrelated to the booking, OAuth, notification, and report features described above.

## Git Workflow

Primary finalized branch:

```text
developer
```

Feature branches used during development include:

```text
feature/booking_management
feature/auth-security
feature/resource-management
feature/ticket-management
feature/user-management
```

Before pushing work:

```bash
git status
git add <changed-files>
git commit -m "clear commit message"
git push origin developer
```

Avoid committing local upload files or secrets.

## Security Notes

- Do not commit `backend/.env`.
- Do not commit Google client secrets.
- If a secret is accidentally shared, regenerate it in Google Cloud Console.
- OAuth access is restricted to emails already registered by the admin.

## Team Setup Checklist

1. Clone the repository.
2. Create the MySQL database.
3. Update database credentials if needed.
4. Create `backend/.env` from `backend/.env.example`.
5. Start the backend.
6. Install frontend dependencies.
7. Start the frontend.
8. Add users/students through the admin panel.
9. Test login and role-specific dashboards.

## Project Summary

Northbridge University Campus Portal is designed to make daily campus operations easier to manage. Students and lecturers can book resources, managers can approve and monitor requests, helper staff can participate in support workflows, and administrators can manage the university’s user records from a centralized interface.
