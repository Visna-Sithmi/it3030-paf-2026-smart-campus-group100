import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./app/admin/Login/page";
import DashboardPage from "./app/admin/dashboard/page";
import ManagerPage from "./app/admin/manager/page";
import LecturerPage from "./app/admin/lecturers/page";
import HelperStaffPage from "./app/admin/helpers/page";
import StudentPage from "./app/admin/student/page";
import ManagerLoginPage from "./app/manager/login/page";
import BookingDashboard from "./app/manager/bookingDashboard/page";
import BookingHistoryPage from "./app/manager/bookingHistory/page";
import ResourceDashboard from "./app/manager/resourceDashboard/ResourceDashboard";
import Analysis from "./app/manager/resourceDashboard/Analysis";
import IssueDashboard from "./app/manager/issueDashboard/page";
import IssueAnalyticsPage from "./app/manager/issueAnalytics/page";
import ResourceCataloguePage from "./app/client/resources/page";
import ClientLoginPage from "./app/client/login/page";
import ResourceBookingPage from "./app/client/resourceBooking/page";
import MyBookingsPage from "./app/client/myBookings/page";
import StudentProfilePage from "./app/client/profile/page";
import CreateTicket from "./app/client/tickets/CreateTicket";
import MyTickets from "./app/client/tickets/MyTickets";
import TicketDetails from "./app/client/tickets/TicketDetails";
import ProtectedRoute from "./components/ProtectedRoute"; // IMPORT THE PROTECTED ROUTE
import HomePage from "./app/home/page";
import AboutPage from "./app/about/page";
import OAuthCallbackPage from "./app/oauth/callback/page";
import { getAuthItem } from "./services/authSession";

const HomeRedirect = () => {
  const role = getAuthItem("role");

  if (role === "STUDENT" || role === "LECTURER" || role === "TECHNICIAN" || role === "CLEANER" || role === "SECURITY") {
    return <Navigate to="/client/resources" replace />;
  }

  if (role === "BOOKING_MANAGER") {
    return <Navigate to="/manager/booking/dashboard" replace />;
  }

  if (role === "RESOURCE_MANAGER") {
    return <Navigate to="/manager/resource/dashboard" replace />;
  }

  if (role === "ISSUE_MANAGER") {
    return <Navigate to="/manager/issue/dashboard" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/admin/login" replace />;
};

// Protected Route for Booking Manager
const BookingManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getAuthItem("user");
  const role = getAuthItem("role");

  if (!user || role !== "BOOKING_MANAGER") {
    return <Navigate to="/manager/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route for Resource Manager
const ResourceManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getAuthItem("user");
  const role = getAuthItem("role");

  if (!user || role !== "RESOURCE_MANAGER") {
    return <Navigate to="/manager/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route for Issue Manager
const IssueManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getAuthItem("user");
  const role = getAuthItem("role");

  if (!user || role !== "ISSUE_MANAGER") {
    return <Navigate to="/manager/login" replace />;
  }

  return <>{children}</>;
};

const ClientUserRoute = ({ children }: { children: React.ReactNode }) => {
  const role = (getAuthItem("role") || "").toUpperCase();
  const userId = getAuthItem("id") || getAuthItem("studentId");

  if (!role || !userId || !["STUDENT", "LECTURER", "TECHNICIAN", "CLEANER", "SECURITY"].includes(role)) {
    return <Navigate to="/client/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin Dashboard Route - USING IMPORTED PROTECTEDROUTE */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/manager"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ManagerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/student"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StudentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/lecturers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LecturerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/helpers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <HelperStaffPage />
            </ProtectedRoute>
          }
        />

        {/* Manager routes */}
        <Route path="/manager/login" element={<ManagerLoginPage />} />

        <Route
          path="/manager/booking/dashboard"
          element={
            <BookingManagerRoute>
              <BookingDashboard />
            </BookingManagerRoute>
          }
        />

        <Route
          path="/manager/booking/history"
          element={
            <BookingManagerRoute>
              <BookingHistoryPage />
            </BookingManagerRoute>
          }
        />

        <Route
          path="/manager/resource/dashboard"
          element={
            <ResourceManagerRoute>
              <ResourceDashboard />
            </ResourceManagerRoute>
          }
        />


              <Route
        path="/manager/resource/analysis"
        element={
          <ResourceManagerRoute>
            <Analysis />
          </ResourceManagerRoute>
        }
      />

        <Route
          path="/manager/issue/dashboard"
          element={
            <IssueManagerRoute>
              <IssueDashboard />
            </IssueManagerRoute>
          }
        />

        <Route
          path="/manager/issue/analytics"
          element={
            <IssueManagerRoute>
              <IssueAnalyticsPage />
            </IssueManagerRoute>
          }
        />

        <Route
          path="/manager/analytics"
          element={
            <IssueManagerRoute>
              <IssueAnalyticsPage />
            </IssueManagerRoute>
          }
        />

        {/* Client / Common portal routes */}
        <Route path="/client/resources" element={<ResourceCataloguePage />} />
        <Route path="/client/login" element={<ClientLoginPage />} />
        <Route
          path="/client/resourceBooking"
          element={
            <ClientUserRoute>
              <ResourceBookingPage />
            </ClientUserRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ClientUserRoute>
              <MyBookingsPage />
            </ClientUserRoute>
          }
        />
        <Route
          path="/client/profile"
          element={
            <ClientUserRoute>
              <StudentProfilePage />
            </ClientUserRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ClientUserRoute>
              <Navigate to="/client/profile" replace />
            </ClientUserRoute>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<HomeRedirect />} />

        {/* Tickets Routes - Protected */}
        <Route
          path="/create-ticket"
          element={
            <ClientUserRoute>
              <CreateTicket />
            </ClientUserRoute>
          }
        />
        <Route
          path="/my-tickets"
          element={
            <ClientUserRoute>
              <MyTickets />
            </ClientUserRoute>
          }
        />
        <Route
          path="/ticket/:id"
          element={
            <ClientUserRoute>
              <TicketDetails />
            </ClientUserRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
