export interface Manager {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  isActive?: boolean;  // Make sure this matches backend
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}