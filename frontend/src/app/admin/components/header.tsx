type HeaderProps = {
  adminName?: string;
  adminRole?: string;
  title?: string;
  subtitle?: string;
};

export default function Header({
  adminName = "Admin User",
  adminRole = "System Administrator",
  title = "Manager Administration",
  subtitle = "Manage all university managers from one place",
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{adminName}</p>
          <p className="text-xs text-slate-500">{adminRole}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700 shadow">
          A
        </div>
      </div>
    </header>
  );
}