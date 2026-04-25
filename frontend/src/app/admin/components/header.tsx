import { useEffect, useState } from "react";

type HeaderProps = {
  adminName?: string;
  adminRole?: string;
  title?: string;
  subtitle?: string;
};

export default function Header({
  adminName: propAdminName,
  adminRole: propAdminRole = "Chancellor Administrator",
  title = "Manager Administration",
  subtitle = "Manage all university managers from one place",
}: HeaderProps) {
  const [adminName, setAdminName] = useState(propAdminName || "Admin User");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    // Get admin details from localStorage if not provided as props
    if (!propAdminName) {
      const storedName = localStorage.getItem("adminName") || 
                        localStorage.getItem("name") || 
                        "Admin User";
      const storedEmail = localStorage.getItem("adminEmail") || 
                         localStorage.getItem("email") || 
                         "";
      setAdminName(storedName);
      setAdminEmail(storedEmail);
    } else {
      // If props are provided, also get email from localStorage
      const storedEmail = localStorage.getItem("adminEmail") || 
                         localStorage.getItem("email") || 
                         "";
      setAdminEmail(storedEmail);
    }
  }, [propAdminName]);

  // Get first letter for avatar
  const getAvatarLetter = () => {
    if (adminName && adminName.length > 0) {
      return adminName.charAt(0).toUpperCase();
    }
    return "A";
  };

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{adminName}</p>
          <p className="text-xs text-slate-500">{adminEmail || propAdminRole}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700 shadow">
          {getAvatarLetter()}
        </div>
      </div>
    </header>
  );
}