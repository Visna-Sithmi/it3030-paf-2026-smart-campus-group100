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

    const result: StudentLoginResponse = await response.json();
    console.log("Login response:", result);
    
    return result;
  },
};