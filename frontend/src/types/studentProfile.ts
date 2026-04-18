export interface StudentProfile {
  id: number;
  studentId: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  course?: string | null;
  year?: number | null;
  semester?: number | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  status?: string | null;
  profileImageUrl?: string | null;
}

export interface StudentProfileUpdateRequest {
  name?: string;
  phone?: string;
  address?: string;
  course?: string;
  year?: number | null;
  semester?: number | null;
  dateOfBirth?: string | null;
  gender?: string;
  profileImageUrl?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}
