export interface Student {
  id?: number;
  studentId?: string;
  student_id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  course?: string;
  year?: number;
  semester?: number;
  dateOfBirth?: string;
  gender?: string;
  status?: string;
}

export interface StudentStatistics {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}