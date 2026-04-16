package com.northbridge.backend.service;

import com.northbridge.backend.dto.StudentLoginRequest;
import com.northbridge.backend.dto.StudentLoginResponse;
import com.northbridge.backend.model.Student;
import com.northbridge.backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class StudentAuthService {

    private static final Logger logger = LoggerFactory.getLogger(StudentAuthService.class);

    @Autowired
    private StudentRepository studentRepository;

    // Student Login using Student ID and Password
    public StudentLoginResponse login(StudentLoginRequest request) {
        logger.info("=== STUDENT LOGIN ATTEMPT ===");
        logger.info("Student ID received: '{}'", request.getStudentId());
        logger.info("Password received: '{}'", request.getPassword());

        // Trim the input to remove any spaces
        String trimmedStudentId = request.getStudentId().trim();
        String trimmedPassword = request.getPassword().trim();

        logger.info("Trimmed Student ID: '{}'", trimmedStudentId);
        logger.info("Trimmed Password: '{}'", trimmedPassword);

        // Try to find by studentId (case-sensitive)
        Optional<Student> student = studentRepository.findByStudentId(trimmedStudentId);

        if (student.isEmpty()) {
            // Try to find with uppercase (in case database has uppercase)
            Optional<Student> studentUpper = studentRepository.findByStudentId(trimmedStudentId.toUpperCase());
            if (studentUpper.isPresent()) {
                student = studentUpper;
                logger.info("Found student with uppercase ID: {}", trimmedStudentId.toUpperCase());
            } else {
                // List all student IDs from database for debugging
                logger.error("Student NOT found with Student ID: '{}'", trimmedStudentId);
                logger.info("All student IDs in database:");
                studentRepository.findAll().forEach(s ->
                        logger.info("  - '{}'", s.getStudentId())
                );
                return new StudentLoginResponse(false, "Invalid Student ID or password", null, null, null, null, null, null, null, null);
            }
        }

        Student studentObj = student.get();
        logger.info("Student found: '{}' - '{}'", studentObj.getStudentId(), studentObj.getName());
        logger.info("Stored password: '{}'", studentObj.getPassword());
        logger.info("Comparing '{}' with '{}'", studentObj.getPassword(), trimmedPassword);

        // Check if account is active
        if (!studentObj.isActive()) {
            logger.error("Student account is inactive: {}", studentObj.getStudentId());
            return new StudentLoginResponse(false, "Account is deactivated. Please contact admin.", null, null, null, null, null, null, null, null);
        }

        // Check if status is ACTIVE
        if (!"ACTIVE".equals(studentObj.getStatus())) {
            logger.error("Student status is not ACTIVE: {}", studentObj.getStatus());
            return new StudentLoginResponse(false, "Account is not active. Please contact admin.", null, null, null, null, null, null, null, null);
        }

        // Verify password
        if (!studentObj.getPassword().equals(trimmedPassword)) {
            logger.error("Password mismatch for student: {}", studentObj.getStudentId());
            return new StudentLoginResponse(false, "Invalid Student ID or password", null, null, null, null, null, null, null, null);
        }

        logger.info("Student login SUCCESSFUL: {} - {}", studentObj.getStudentId(), studentObj.getName());

        return new StudentLoginResponse(
                true,
                "Login successful",
                "STUDENT",
                studentObj.getName(),
                studentObj.getId(),
                studentObj.getStudentId(),
                studentObj.getEmail(),
                studentObj.getCourse(),
                studentObj.getYear(),
                studentObj.getStatus()
        );
    }

    // Get student by ID
    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));
    }

    // Get student by Student ID
    public Student getStudentByStudentId(String studentId) {
        return studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with Student ID: " + studentId));
    }

    // Update student password
    public boolean updatePassword(String studentId, String oldPassword, String newPassword) {
        Optional<Student> optionalStudent = studentRepository.findByStudentId(studentId);

        if (optionalStudent.isEmpty()) {
            logger.error("Student not found: {}", studentId);
            return false;
        }

        Student student = optionalStudent.get();

        if (!student.getPassword().equals(oldPassword)) {
            logger.error("Old password mismatch for student: {}", studentId);
            return false;
        }

        student.setPassword(newPassword);
        studentRepository.save(student);
        logger.info("Password updated successfully for student: {}", studentId);
        return true;
    }

    // Check if student account is active
    public boolean isAccountActive(String studentId) {
        Optional<Student> student = studentRepository.findByStudentId(studentId);
        return student.map(Student::isActive).orElse(false);
    }

    // Get student status
    public String getStudentStatus(String studentId) {
        Optional<Student> student = studentRepository.findByStudentId(studentId);
        return student.map(Student::getStatus).orElse("NOT_FOUND");
    }
}