import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import { studentService } from "../../../services/studentService";
import type { Student } from "../../../types/student";

type StudentRow = Student & {
  student_id?: string;
};

const emptyForm: Student = {
  studentId: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  course: "",
  year: 1,
  semester: 1,
  dateOfBirth: "",
  gender: "Male",
};

export default function StudentPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const [formData, setFormData] = useState<Student>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const getStudentIdValue = (student: StudentRow) => {
    return student.studentId || student.student_id || "";
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const studentData = await studentService.getAllStudents();
      console.log("Students API response:", studentData);
      setStudents(studentData as StudentRow[]);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = search.toLowerCase();

    return students.filter((student) => {
      return (
        getStudentIdValue(student).toLowerCase().includes(term) ||
        (student.name || "").toLowerCase().includes(term) ||
        (student.email || "").toLowerCase().includes(term) ||
        (student.phone || "").toLowerCase().includes(term) ||
        (student.address || "").toLowerCase().includes(term) ||
        (student.course || "").toLowerCase().includes(term) ||
        (student.gender || "").toLowerCase().includes(term) ||
        String(student.year ?? "").includes(term) ||
        String(student.semester ?? "").includes(term)
      );
    });
  }, [students, search]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (student: StudentRow) => {
    setEditingStudent(student);
    setFormData({
      id: student.id,
      studentId: getStudentIdValue(student),
      name: student.name || "",
      email: student.email || "",
      password: "",
      phone: student.phone || "",
      address: student.address || "",
      course: student.course || "",
      year: student.year || 1,
      semester: student.semester || 1,
      dateOfBirth: student.dateOfBirth || "",
      gender: student.gender || "Male",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData(emptyForm);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" || name === "semester"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!editingStudent && (!formData.studentId || formData.studentId.trim() === "")) {
        setError("Student ID is required.");
        setSubmitting(false);
        return;
      }

      if (!formData.name || formData.name.trim() === "") {
        setError("Student name is required.");
        setSubmitting(false);
        return;
      }

      if (!formData.email || formData.email.trim() === "") {
        setError("Student email is required.");
        setSubmitting(false);
        return;
      }

      if (!editingStudent && (!formData.password || formData.password.trim() === "")) {
        setError("Password is required.");
        setSubmitting(false);
        return;
      }

      if (editingStudent?.id) {
        const payload: Partial<Student> = {
          studentId: formData.studentId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          course: formData.course,
          year: formData.year,
          semester: formData.semester,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        };

        if (formData.password && formData.password.trim() !== "") {
          payload.password = formData.password;
        }

        await studentService.updateStudent(editingStudent.id, payload);
      } else {
        console.log("Submitting student form:", formData);
        await studentService.addStudent(formData);
      }

      closeModal();
      await fetchStudents();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this student?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await studentService.deleteStudent(id);
      await fetchStudents();
    } catch (err: any) {
      setError(err.message || "Failed to delete student");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeItem="Student Administration" />

      <div className="ml-72 min-h-screen">
        <Header adminName="Admin User" adminRole="Chancellor Administrator" />

        <main className="p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Student Administration
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Manage student records and maintain the institutional student
                registry.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
            >
              + Register New Student
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Student Registry
              </h2>

              <input
                type="text"
                placeholder="Search by student id, name, email, address, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-900 md:w-96"
              />
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No students found.</div>
            ) : (
              <div className="w-full">
                <table className="w-full table-fixed text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Student ID
                      </th>
                      <th className="w-[13%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Name
                      </th>
                      <th className="w-[16%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Email
                      </th>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Phone
                      </th>
                      <th className="w-[14%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Address
                      </th>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Course
                      </th>
                      <th className="w-[9%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Year / Sem
                      </th>
                      <th className="w-[8%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Gender
                      </th>
                      <th className="w-[10%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 align-top">
                        <td className="break-words px-4 py-5 text-sm font-medium text-slate-900">
                          {getStudentIdValue(student) || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.email}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.phone || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.address || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.course || "-"}
                        </td>
                        <td className="px-4 py-5 text-sm text-slate-600">
                          {student.year || "-"} / {student.semester || "-"}
                        </td>
                        <td className="break-words px-4 py-5 text-sm text-slate-600">
                          {student.gender || "-"}
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => openEditModal(student)}
                              className="w-16 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(student.id)}
                              className="w-16 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
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
              Showing {filteredStudents.length} student(s)
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingStudent ? "Update Student" : "Register New Student"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Enter the student details and save the record.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {!editingStudent ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Student ID
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId || ""}
                      onChange={handleChange}
                      required
                      placeholder="Enter Student ID"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={formData.studentId || ""}
                      readOnly
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
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
                    Password {editingStudent ? "(Leave blank if no change)" : ""}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    required={!editingStudent}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Course
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Year
                  </label>
                  <select
                    name="year"
                    value={formData.year ?? 1}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester ?? 1}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || "Male"}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
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
                  {submitting
                    ? "Saving..."
                    : editingStudent
                    ? "Update Student"
                    : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}