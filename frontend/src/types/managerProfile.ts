export interface ManagerProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  profileImageUrl?: string | null;
}

export interface ManagerProfileUpdateRequest {
  name: string;
  profileImageUrl?: string | null;
}

export interface ManagerProfileApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
