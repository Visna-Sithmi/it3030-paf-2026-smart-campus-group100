import axios from "axios";
import type {
  ApiResponse,
  ChangePasswordRequest,
  StudentProfile,
  StudentProfileUpdateRequest,
} from "../types/studentProfile";

const API_BASE_URL = "http://localhost:8081/api/auth/student";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const studentProfileService = {
  async getProfile(studentId: number): Promise<StudentProfile> {
    const response = await api.get<ApiResponse<StudentProfile>>(`/profile/${studentId}`);
    return response.data.data;
  },

  async updateProfile(studentId: number, payload: StudentProfileUpdateRequest): Promise<StudentProfile> {
    const response = await api.put<ApiResponse<StudentProfile>>(`/profile/${studentId}`, payload);
    return response.data.data;
  },

  async uploadProfileImage(studentId: number, imageFile: File): Promise<StudentProfile> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await api.put<ApiResponse<StudentProfile>>(`/profile/${studentId}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  async changePassword(studentId: number, payload: ChangePasswordRequest): Promise<void> {
    await api.put<ApiResponse<null>>(`/profile/${studentId}/password`, payload);
  },
};
