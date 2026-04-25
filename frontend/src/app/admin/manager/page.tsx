import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import { managerService } from "../../../services/managerService";
import type { Manager } from "../../../types/manager";

type ManagerRole = "RESOURCE_MANAGER" | "BOOKING_MANAGER" | "ISSUE_MANAGER";

const managerRoles: ManagerRole[] = [
  "RESOURCE_MANAGER",
  "BOOKING_MANAGER",
  "ISSUE_MANAGER",
];

const emptyForm: Manager = {
  name: "",
  email: "",
  password: "",
  role: "RESOURCE_MANAGER",
};

const roleLabel = (role: string) => role.replaceAll("_", " ");

export default function ManagerPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState<"ALL" | ManagerRole>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [formData, setFormData] = useState<Manager>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      setError("");

      const managerLists = await Promise.all(
        managerRoles.map((role) => managerService.getManagersByRole(role))
      );

      setManagers(managerLists.flat());
    } catch (err: any) {
      setError(err.message || "Failed to load managers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const filteredManagers = useMemo(() => {
    const term = search.toLowerCase();

    return managers.filter((manager) => {
      const matchesRole = activeRole === "ALL" || manager.role === activeRole;

      return (
        matchesRole &&
        (manager.name.toLowerCase().includes(term) ||
          manager.email.toLowerCase().includes(term) ||
          manager.role.toLowerCase().includes(term) ||
          String(manager.id ?? "").includes(term))
      );
    });
  }, [managers, search, activeRole]);

  const counts = useMemo(() => {
    return managerRoles.reduce(
      (acc, role) => {
        acc[role] = managers.filter((manager) => manager.role === role).length;
        return acc;
      },
      { RESOURCE_MANAGER: 0, BOOKING_MANAGER: 0, ISSUE_MANAGER: 0 } as Record<ManagerRole, number>
    );
  }, [managers]);

  const openAddModal = () => {
    setEditingManager(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (manager: Manager) => {
    setEditingManager(manager);
    setFormData({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      password: "",
      role: manager.role as ManagerRole,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingManager(null);
    setFormData(emptyForm);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (editingManager?.id) {
        const payload: Partial<Manager> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        if (formData.password && formData.password.trim() !== "") {
          payload.password = formData.password;
        }

        await managerService.updateManager(editingManager.id, payload);
      } else {
        await managerService.addManager({
          ...formData,
          role: formData.role as ManagerRole,
        });
      }

      closeModal();
      await fetchManagers();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this manager account?");
    if (!confirmed) return;

    try {
      setError("");
      await managerService.deleteManager(id);
      await fetchManagers();
    } catch (err: any) {
      setError(err.message || "Failed to delete manager account");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeItem="Manager Administration" />

      <div className="ml-72 min-h-screen">
        <Header adminName="Admin User" adminRole="Chancellor Administrator" />

        <main className="p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Manager Administration
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Manage resource managers, booking managers, and issue managers
                through one centralized dashboard.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
            >
              + Add Manager
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Stats Cards - Clickable role filters */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {managerRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(activeRole === role ? "ALL" : role)}
                className={`rounded-2xl border px-6 py-5 text-left shadow-sm transition ${
                  activeRole === role
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-widest ${activeRole === role ? "text-white/70" : "text-slate-500"}`}>
                  {roleLabel(role)}
                </p>
                <h3 className="mt-2 text-3xl font-bold">{counts[role]}</h3>
              </button>
            ))}
          </div>

          {/* Manager Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {(["ALL", ...managerRoles] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRole(role)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeRole === role
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {role === "ALL" ? "All Managers" : roleLabel(role)}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search by name, email or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900 md:w-80"
              />
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading managers...</div>
            ) : filteredManagers.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No managers found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                        NAME
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                        EMAIL
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                        ROLE
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredManagers.map((manager) => (
                      <tr key={manager.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {manager.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {manager.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {roleLabel(manager.role)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(manager)}
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(manager.id)}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500">
              Showing {filteredManagers.length} manager account(s)
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingManager ? "Update Manager" : "Add Manager"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                >
                  {managerRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password {editingManager ? "(leave blank to keep current)" : ""}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  required={!editingManager}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}