package com.northbridge.backend.service;

import com.northbridge.backend.dto.StudentDTO;
import com.northbridge.backend.model.Student;
import com.northbridge.backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    // CREATE - Add new student
    public Student addStudent(StudentDTO studentDTO) {
        // Check if student ID already exists
        if (studentRepository.existsByStudentId(studentDTO.getStudentId())) {
            throw new RuntimeException("Student ID already exists: " + studentDTO.getStudentId());
        }

        // Check if email already exists
        if (studentRepository.existsByEmail(studentDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + studentDTO.getEmail());
        }

        Student student = new Student();
        student.setStudentId(studentDTO.getStudentId());
        student.setName(studentDTO.getName());
        student.setEmail(studentDTO.getEmail());
        student.setPhone(studentDTO.getPhone());
        student.setAddress(studentDTO.getAddress());
        student.setCourse(studentDTO.getCourse());
        student.setYear(studentDTO.getYear());
        student.setSemester(studentDTO.getSemester());
        student.setDateOfBirth(studentDTO.getDateOfBirth());
        student.setGender(studentDTO.getGender());
        student.setStatus("ACTIVE");

        return studentRepository.save(student);
    }

    // READ - Get all students
    public List<StudentDTO> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        return students.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // READ - Get student by ID
    public StudentDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));
        return convertToDTO(student);
    }

    // READ - Get student by Student ID
    public StudentDTO getStudentByStudentId(String studentId) {
        Student student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with Student ID: " + studentId));
        return convertToDTO(student);
    }

    // READ - Get students by course
    public List<StudentDTO> getStudentsByCourse(String course) {
        List<Student> students = studentRepository.findByCourse(course);
        return students.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // READ - Get students by year
    public List<StudentDTO> getStudentsByYear(Integer year) {
        List<Student> students = studentRepository.findByYear(year);
        return students.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // READ - Search students by name
    public List<StudentDTO> searchStudentsByName(String name) {
        List<Student> students = studentRepository.searchByName(name);
        return students.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE - Update student
    public StudentDTO updateStudent(Long id, StudentDTO studentDTO) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));

        // Update fields if provided
        if (studentDTO.getName() != null) {
            student.setName(studentDTO.getName());
        }

        if (studentDTO.getPhone() != null) {
            student.setPhone(studentDTO.getPhone());
        }

        if (studentDTO.getAddress() != null) {
            student.setAddress(studentDTO.getAddress());
        }

        if (studentDTO.getCourse() != null) {
            student.setCourse(studentDTO.getCourse());
        }

        if (studentDTO.getYear() != null) {
            student.setYear(studentDTO.getYear());
        }

        if (studentDTO.getSemester() != null) {
            student.setSemester(studentDTO.getSemester());
        }

        if (studentDTO.getDateOfBirth() != null) {
            student.setDateOfBirth(studentDTO.getDateOfBirth());
        }

        if (studentDTO.getGender() != null) {
            student.setGender(studentDTO.getGender());
        }

        if (studentDTO.getStatus() != null) {
            student.setStatus(studentDTO.getStatus());
        }

        // Check if email is being updated
        if (studentDTO.getEmail() != null && !student.getEmail().equals(studentDTO.getEmail())) {
            if (studentRepository.existsByEmail(studentDTO.getEmail())) {
                throw new RuntimeException("Email already exists: " + studentDTO.getEmail());
            }
            student.setEmail(studentDTO.getEmail());
        }

        student.setUpdatedAt(LocalDateTime.now());

        Student updatedStudent = studentRepository.save(student);
        return convertToDTO(updatedStudent);
    }

    // DELETE - Delete student (Hard delete)
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));
        studentRepository.delete(student);
    }

    // Soft Delete - Change status to INACTIVE
    public StudentDTO softDeleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));

        student.setStatus("INACTIVE");
        student.setUpdatedAt(LocalDateTime.now());

        Student updatedStudent = studentRepository.save(student);
        return convertToDTO(updatedStudent);
    }

    // Activate a student
    public StudentDTO activateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));

        student.setStatus("ACTIVE");
        student.setUpdatedAt(LocalDateTime.now());

        Student updatedStudent = studentRepository.save(student);
        return convertToDTO(updatedStudent);
    }

    // Get statistics
    public StudentStatistics getStatistics() {
        StudentStatistics stats = new StudentStatistics();
        stats.setTotalStudents(studentRepository.count());
        stats.setActiveStudents(studentRepository.countByStatus("ACTIVE"));
        stats.setInactiveStudents(studentRepository.countByStatus("INACTIVE"));
        return stats;
    }

    // Convert to DTO
    private StudentDTO convertToDTO(Student student) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getId());
        dto.setStudentId(student.getStudentId());
        dto.setName(student.getName());
        dto.setEmail(student.getEmail());
        dto.setPhone(student.getPhone());
        dto.setAddress(student.getAddress());
        dto.setCourse(student.getCourse());
        dto.setYear(student.getYear());
        dto.setSemester(student.getSemester());
        dto.setDateOfBirth(student.getDateOfBirth());
        dto.setGender(student.getGender());
        dto.setStatus(student.getStatus());
        return dto;
    }

    // Inner class for statistics
    public static class StudentStatistics {
        private long totalStudents;
        private long activeStudents;
        private long inactiveStudents;

        public long getTotalStudents() { return totalStudents; }
        public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
        public long getActiveStudents() { return activeStudents; }
        public void setActiveStudents(long activeStudents) { this.activeStudents = activeStudents; }
        public long getInactiveStudents() { return inactiveStudents; }
        public void setInactiveStudents(long inactiveStudents) { this.inactiveStudents = inactiveStudents; }
    }
}