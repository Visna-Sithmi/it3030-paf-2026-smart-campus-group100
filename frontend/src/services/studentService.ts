import type {
  ApiResponse,
  Student,
  StudentStatistics,
} from "../types/student";

const BASE_URL = "http://localhost:8081/api/admin/students";

const toBackendStudentPayload = (student: Partial<Student>) => {
  const { studentId, ...rest } = student;

  return {
    ...rest,
    student_id: studentId ?? student.student_id ?? "",
  };
};

export const studentService = {
  async getAllStudents(): Promise<Student[]> {
    const response = await fetch(`${BASE_URL}/all`);
    const result: ApiResponse<Student[]> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch students");
    }

    return result.data || [];
  },

  async getStudentById(id: number): Promise<Student> {
    const response = await fetch(`${BASE_URL}/${id}`);
    const result: ApiResponse<Student> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch student");
    }

    return result.data;
  },

  async addStudent(student: Student): Promise<Student> {
    const payload = toBackendStudentPayload(student);

    console.log("Sending add student payload:", payload);

    const response = await fetch(`${BASE_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<Student> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to add student");
    }

    return result.data;
  },

  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    const payload = toBackendStudentPayload(student);

    console.log("Sending update student payload:", payload);

    const response = await fetch(`${BASE_URL}/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<Student> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update student");
    }

    return result.data;
  },

  async deleteStudent(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/delete/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to delete student");
    }
  },

  async deactivateStudent(id: number): Promise<Student> {
    const response = await fetch(`${BASE_URL}/soft-delete/${id}`, {
      method: "PUT",
    });

    const result: ApiResponse<Student> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to deactivate student");
    }

    return result.data;
  },

  async activateStudent(id: number): Promise<Student> {
    const response = await fetch(`${BASE_URL}/activate/${id}`, {
      method: "PUT",
    });

    const result: ApiResponse<Student> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to activate student");
    }

    return result.data;
  },

  async getStatistics(): Promise<StudentStatistics> {
    const response = await fetch(`${BASE_URL}/statistics`);
    const result: ApiResponse<StudentStatistics> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch student statistics");
    }

    return result.data;
  },
};