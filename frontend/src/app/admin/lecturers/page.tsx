import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import { managerService } from "../../../services/managerService";
import type { Manager } from "../../../types/manager";

const emptyForm: Manager = {
  name: "",
  email: "",
  password: "",
  role: "LECTURER",
};

export default function LecturerPage() {
  const [lecturers, setLecturers] = useState<Manager[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Manager | null>(null);
  const [formData, setFormData] = useState<Manager>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await managerService.getManagersByRole("LECTURER");
      setLecturers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load lecturers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturers();
  }, []);

  const filteredLecturers = useMemo(() => {
    const term = search.toLowerCase();
    return lecturers.filter((lecturer) => {
      return (
        lecturer.name.toLowerCase().includes(term) ||
        lecturer.email.toLowerCase().includes(term) ||
        String(lecturer.id ?? "").includes(term)
      );
    });
  }, [lecturers, search]);

  const openAddModal = () => {
    setEditingLecturer(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (lecturer: Manager) => {
    setEditingLecturer(lecturer);
    setFormData({
      id: lecturer.id,
      name: lecturer.name,
      email: lecturer.email,
      password: "",
      role: "LECTURER",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLecturer(null);
    setFormData(emptyForm);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (editingLecturer?.id) {
        const payload: Partial<Manager> = {
          name: formData.name,
          email: formData.email,
          role: "LECTURER",
        };

        if (formData.password && formData.password.trim() !== "") {
          payload.password = formData.password;
        }

        await managerService.updateManager(editingLecturer.id, payload);
      } else {
        await managerService.addManager({
          ...formData,
          role: "LECTURER",
        });
      }

      closeModal();
      await fetchLecturers();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this lecturer?");
    if (!confirmed) return;

    try {
      setError("");
      await managerService.deleteManager(id);
      await fetchLecturers();
    } catch (err: any) {
      setError(err.message || "Failed to delete lecturer");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeItem="Lecturer Management" />

      <div className="ml-72 min-h-screen">
        <Header adminName="Admin User" adminRole="Chancellor Administrator" />

        <main className="p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Lecturer Management</h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Add and manage lecturer accounts for academic access to the booking portal.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
            >
              + Add Lecturer
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-slate-900">Lecturer Registry</h2>

              <input
                type="text"
                placeholder="Search by id, name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900 md:w-80"
              />
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading lecturers...</div>
            ) : filteredLecturers.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No lecturers found.</div>
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
                    {filteredLecturers.map((lecturer) => (
                      <tr key={lecturer.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{lecturer.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{lecturer.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">LECTURER</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(lecturer)}
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(lecturer.id)}
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
              Showing {filteredLecturers.length} lecturer(s)
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingLecturer ? "Update Lecturer" : "Add Lecturer"}
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password {editingLecturer ? "(Leave blank if no change)" : ""}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  required={!editingLecturer}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editingLecturer ? "Update Lecturer" : "Add Lecturer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
