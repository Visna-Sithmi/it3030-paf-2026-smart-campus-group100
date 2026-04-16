import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./app/admin/Login/page";
import ManagerPage from "./app/admin/manager/page";
import ManagerLoginPage from "./app/manager/login/page";
import BookingDashboard from "./app/manager/bookingDashboard/page";
import ResourceDashboard from "./app/manager/resourceDashboard/page";
import IssueDashboard from "./app/manager/issueDashboard/page";
import ResourceCataloguePage from "./app/client/resources/page";


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
        {/* Default route - redirect to admin login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Admin routes - public access */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin Manager page - protected */}
        <Route
          path="/admin/manager"
          element={
            <ProtectedRoute>
              <ManagerPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Login - public access */}
        <Route path="/manager/login" element={<ManagerLoginPage />} />

        {/* Manager Dashboards - protected by role */}
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

        {/* Client pages */}
        <Route path="/client/resources" element={<ResourceCataloguePage />} />
        

        {/* Redirect any other routes to login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;