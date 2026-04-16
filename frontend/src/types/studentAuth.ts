export interface StudentLoginRequest {
  studentId: string;
  password: string;
}

export interface StudentLoginResponse {
  success: boolean;
  message: string;
  role: string | null;
  name: string | null;
  id: number | null;
  studentId: string | null;
  email: string | null;
  course: string | null;
  year: number | null;
  status: string | null;
}