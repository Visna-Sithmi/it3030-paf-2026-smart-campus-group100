import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./app/admin/Login/page";

const Dashboard = () => {
  const name = localStorage.getItem("name");

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-[#002147]">
          Admin Dashboard
        </h1>
        <p className="mt-3 text-slate-600">
          Welcome, {name || "Admin"} 👋
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/admin/login" />} />

        {/* Admin login route */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Dashboard route */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;