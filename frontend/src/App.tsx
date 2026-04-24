import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./app/admin/Login/page";
import ManagerPage from "./app/admin/manager/page";
import StudentPage from "./app/admin/student/page";
import ManagerLoginPage from "./app/manager/login/page";
import BookingDashboard from "./app/manager/bookingDashboard/page";
import ResourceDashboard from "./app/manager/resourceDashboard/ResourceDashboard";
import IssueDashboard from "./app/manager/issueDashboard/page";
import ResourceCataloguePage from "./app/client/resources/page";
import ClientLoginPage from "./app/client/login/page";

// Protected Route Component - ensures only authenticated admins can access
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role");

  if (!user || role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route for Booking Manager
const BookingManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role");

  if (!user || role !== "BOOKING_MANAGER") {
    return <Navigate to="/manager/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route for Resource Manager
const ResourceManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role");

  if (!user || role !== "RESOURCE_MANAGER") {
    return <Navigate to="/manager/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route for Issue Manager
const IssueManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role");

  if (!user || role !== "ISSUE_MANAGER") {
    return <Navigate to="/manager/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<LoginPage />} />

        <Route
          path="/admin/manager"
          element={
            <ProtectedRoute>
              <ManagerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/student"
          element={
            <ProtectedRoute>
              <StudentPage />
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
          path="/manager/resource/dashboard"
          element={
            <ResourceManagerRoute>
              <ResourceDashboard />
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

        {/* Client / Common portal routes */}
        <Route path="/client/resources" element={<ResourceCataloguePage />} />
        <Route path="/client/login" element={<ClientLoginPage />} />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;