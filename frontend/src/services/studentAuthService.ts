// src/services/studentAuthService.ts
import type {
  StudentLoginRequest,
  StudentLoginResponse,
} from "../types/studentAuth";

const BASE_URL = "http://localhost:8081/api/auth/student";

export const studentAuthService = {
  async login(
    credentials: StudentLoginRequest
  ): Promise<StudentLoginResponse> {
    const payload = {
      studentId: credentials.studentId.trim(),
      password: credentials.password.trim(),
    };

    console.log("Student login payload:", payload);

    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Student login failed");
    }

    const raw = await response.json();
    const normalized: StudentLoginResponse = {
      success: raw.success,
      message: raw.message,
      role: raw.role,
      name: raw.name,
      id: raw.id,
      studentId: raw.studentId ?? raw.student_id ?? null,
      email: raw.email ?? null,
      course: raw.course ?? null,
      year: raw.year ?? null,
      status: raw.status ?? null,
      profileImageUrl: raw.profileImageUrl ?? raw.profile_image_url ?? null,
    };

    console.log("Login response:", normalized);
    return normalized;
  },
};