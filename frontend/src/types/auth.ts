export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  role: string | null;
  name: string | null;
  id?: number;
  email?: string;
  profileImageUrl?: string | null;
}