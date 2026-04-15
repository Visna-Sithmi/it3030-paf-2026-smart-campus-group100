import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./app/admin/Login/page";
import ManagerPage from "./app/admin/manager/page";

// Protected Route Component - ensures only authenticated admins can access
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem("user");
  const role = localStorage.getItem("role");
  
  if (!user || role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Admin login route - public access */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Manager page - protected (only accessible after login) */}
        <Route 
          path="/admin/manager" 
          element={
            <ProtectedRoute>
              <ManagerPage />
            </ProtectedRoute>
          } 
        />

        {/* Redirect any other routes to login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;