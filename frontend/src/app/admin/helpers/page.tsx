import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import { managerService } from "../../../services/managerService";
import type { Manager } from "../../../types/manager";

type HelperRole = "TECHNICIAN" | "CLEANER" | "SECURITY";

const helperRoles: HelperRole[] = ["TECHNICIAN", "CLEANER", "SECURITY"];

const emptyForm: Manager = {
  name: "",
  email: "",
  password: "",
  role: "TECHNICIAN",
};

const roleLabel = (role: string) => role.replaceAll("_", " ");

export default function HelperStaffPage() {
  const [helpers, setHelpers] = useState<Manager[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState<"ALL" | HelperRole>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingHelper, setEditingHelper] = useState<Manager | null>(null);
  const [formData, setFormData] = useState<Manager>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchHelpers = async () => {
    try {
      setLoading(true);
      setError("");

      const helperLists = await Promise.all(
        helperRoles.map((role) => managerService.getManagersByRole(role))
      );

      setHelpers(helperLists.flat());
    } catch (err: any) {
      setError(err.message || "Failed to load helper staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpers();
  }, []);

  const filteredHelpers = useMemo(() => {
    const term = search.toLowerCase();

    return helpers.filter((helper) => {
      const matchesRole = activeRole === "ALL" || helper.role === activeRole;

      return (
        matchesRole &&
        (helper.name.toLowerCase().includes(term) ||
          helper.email.toLowerCase().includes(term) ||
          helper.role.toLowerCase().includes(term) ||
          String(helper.id ?? "").includes(term))
      );
    });
  }, [helpers, search, activeRole]);

  const counts = useMemo(() => {
    return helperRoles.reduce(
      (accumulator, role) => {
        accumulator[role] = helpers.filter((helper) => helper.role === role).length;
        return accumulator;
      },
      { TECHNICIAN: 0, CLEANER: 0, SECURITY: 0 } as Record<HelperRole, number>
    );
  }, [helpers]);

  const openAddModal = () => {
    setEditingHelper(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (helper: Manager) => {
    setEditingHelper(helper);
    setFormData({
      id: helper.id,
      name: helper.name,
      email: helper.email,
      password: "",
      role: helper.role as HelperRole,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHelper(null);
    setFormData(emptyForm);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (editingHelper?.id) {
        const payload: Partial<Manager> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        if (formData.password && formData.password.trim() !== "") {
          payload.password = formData.password;
        }

        await managerService.updateManager(editingHelper.id, payload);
      } else {
        await managerService.addManager({
          ...formData,
          role: formData.role as HelperRole,
        });
      }

      closeModal();
      await fetchHelpers();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this helper staff account?");
    if (!confirmed) return;

    try {
      setError("");
      await managerService.deleteManager(id);
      await fetchHelpers();
    } catch (err: any) {
      setError(err.message || "Failed to delete helper staff account");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeItem="Helper Staff Management" />

      <div className="ml-72 min-h-screen">
        <Header adminName="Admin User" adminRole="Chancellor Administrator" />

        <main className="p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Helper Staff Management</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Add and manage technician, cleaner, and security accounts from one place.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
            >
              + Add Helper Staff
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {helperRoles.map((role) => (
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

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {(["ALL", ...helperRoles] as const).map((role) => (
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
                    {role === "ALL" ? "All Helper Staff" : roleLabel(role)}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search by id, name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900 md:w-80"
              />
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading helper staff...</div>
            ) : filteredHelpers.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No helper staff found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Name</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Email</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Role</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHelpers.map((helper) => (
                      <tr key={helper.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{helper.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{helper.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{roleLabel(helper.role)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(helper)}
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(helper.id)}
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
              Showing {filteredHelpers.length} helper staff account(s)
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingHelper ? "Update Helper Staff" : "Add Helper Staff"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                >
                  {helperRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password {editingHelper ? "(leave blank to keep current)" : ""}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  required={!editingHelper}
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
                  {submitting ? "Saving..." : "Save Helper Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
