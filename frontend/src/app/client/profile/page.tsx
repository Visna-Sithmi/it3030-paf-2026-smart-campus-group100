import { useEffect, useRef, useState } from "react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { studentProfileService } from "../../../services/studentProfileService";
import type { StudentProfile, StudentProfileUpdateRequest } from "../../../types/studentProfile";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const studentIdRaw = localStorage.getItem("id");
  const studentId = studentIdRaw ? Number(studentIdRaw) : 0;
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);

  const normalizeGender = (gender?: string | null) => {
    const lowered = (gender || "").trim().toLowerCase();
    if (lowered === "male") return "Male";
    if (lowered === "female") return "Female";
    return "";
  };

  const resolveProfileImageSrc = (imageUrl?: string | null) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http") || imageUrl.startsWith("data:")) return imageUrl;
    return `http://localhost:8081${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  };

  const loadProfile = async () => {
    if (!studentId) {
      setError("Student not logged in");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await studentProfileService.getProfile(studentId);
      setProfile({
        ...data,
        gender: normalizeGender(data.gender),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, profileImageUrl: String(reader.result || "") });
      setSuccess("Image selected. Click Save Profile to confirm.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateField = (field: keyof StudentProfile, value: string | number | null) => {
    if (!profile) return;

    if (field === "gender") {
      setProfile({ ...profile, gender: normalizeGender(typeof value === "string" ? value : null) });
      return;
    }

    setProfile({ ...profile, [field]: value });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const payload: StudentProfileUpdateRequest = {
      name: profile.name,
      phone: profile.phone || "",
      address: profile.address || "",
      course: profile.course || "",
      year: profile.year || null,
      semester: profile.semester || null,
      dateOfBirth: profile.dateOfBirth || null,
      gender: normalizeGender(profile.gender) || "",
      profileImageUrl: profile.profileImageUrl || "",
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isDataUrl = (payload.profileImageUrl || "").startsWith("data:");
      if (isDataUrl) {
        payload.profileImageUrl = "";
      }

      await studentProfileService.updateProfile(studentId, payload);
      const refreshed = await studentProfileService.getProfile(studentId);
      const normalizedProfile = {
        ...refreshed,
        gender: normalizeGender(refreshed.gender),
      };

      setProfile(normalizedProfile);

      localStorage.setItem("studentName", normalizedProfile.name || "Student");
      localStorage.setItem("profileImageUrl", normalizedProfile.profileImageUrl || "");
      window.dispatchEvent(new Event("student-profile-updated"));
      window.dispatchEvent(new Event("profile-updated"));

      if (isDataUrl) {
        setSuccess("Profile updated. Profile picture upload requires backend file support.");
      } else {
        setSuccess("Profile updated successfully.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword.trim() || !newPassword.trim()) {
      setError("Old and new passwords are required.");
      return;
    }

    if (newPassword.trim().length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    try {
      setPasswordSaving(true);
      setError("");
      setSuccess("");

      await studentProfileService.changePassword(studentId, {
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      });

      setOldPassword("");
      setNewPassword("");
      setSuccess("Password changed successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#002147]">My Profile</h1>
          <p className="mt-1 text-sm text-slate-600">Edit your profile information and change your password.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading profile...</div>
        ) : !profile ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Profile not found.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>

              <form className="mt-4 space-y-4" onSubmit={saveProfile}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Name</label>
                    <input
                      type="text"
                      value={profile.name || ""}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Email (Read-only)</label>
                    <input
                      type="email"
                      value={profile.email || ""}
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Phone</label>
                    <input
                      type="text"
                      value={profile.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Course</label>
                    <input
                      type="text"
                      value={profile.course || ""}
                      onChange={(e) => updateField("course", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Year</label>
                    <input
                      type="number"
                      min={1}
                      value={profile.year || ""}
                      onChange={(e) => updateField("year", e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Semester</label>
                    <input
                      type="number"
                      min={1}
                      value={profile.semester || ""}
                      onChange={(e) => updateField("semester", e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Date of Birth</label>
                    <input
                      type="date"
                      value={profile.dateOfBirth || ""}
                      onChange={(e) => updateField("dateOfBirth", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Gender</label>
                    <div className="flex gap-3">
                      <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        normalizeGender(profile.gender) === "Male"
                          ? "border-[#002147] bg-[#002147] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}>
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          checked={normalizeGender(profile.gender) === "Male"}
                          onChange={(e) => updateField("gender", e.target.value)}
                          className="sr-only"
                        />
                        Male
                      </label>
                      <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        normalizeGender(profile.gender) === "Female"
                          ? "border-[#002147] bg-[#002147] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}>
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          checked={normalizeGender(profile.gender) === "Female"}
                          onChange={(e) => updateField("gender", e.target.value)}
                          className="sr-only"
                        />
                        Female
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Address</label>
                  <textarea
                    rows={3}
                    value={profile.address || ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#002147] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001733] disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </section>

            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Profile Preview</h3>
                <div className="mt-4 flex flex-col items-center text-center">
                  <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {resolveProfileImageSrc(profile.profileImageUrl) ? (
                      <img
                        src={resolveProfileImageSrc(profile.profileImageUrl)}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-500">
                        {(profile.name || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 font-semibold text-slate-900">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.studentId}</p>
                  <input
                    ref={profilePictureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profilePictureInputRef.current?.click()}
                    className="mt-4 rounded-lg border border-[#002147] px-4 py-2 text-sm font-semibold text-[#002147] transition hover:bg-[#002147] hover:text-white"
                  >
                    Edit Profile Picture
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                <form className="mt-4 space-y-3" onSubmit={changePassword}>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Old Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {passwordSaving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
