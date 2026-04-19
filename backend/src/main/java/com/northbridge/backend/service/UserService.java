package com.northbridge.backend.service;

import com.northbridge.backend.dto.LoginRequest;
import com.northbridge.backend.dto.LoginResponse;
import com.northbridge.backend.dto.StudentLoginRequest;
import com.northbridge.backend.dto.StudentLoginResponse;
import com.northbridge.backend.model.Student;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.StudentRepository;
import com.northbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    // General login for Admin and Managers
    public LoginResponse login(LoginRequest loginRequest) {
        logger.info("=== LOGIN ATTEMPT ===");
        logger.info("Email received: '{}'", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            logger.error("User NOT found with email: '{}'", loginRequest.getEmail());
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            logger.error("Password mismatch for user: {}", loginRequest.getEmail());
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Login SUCCESSFUL for user: {} with role: {}", user.getEmail(), user.getRole());
        return new LoginResponse(true, "Login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }

    // STUDENT LOGIN - Using Student ID and Password
    public StudentLoginResponse studentLogin(StudentLoginRequest loginRequest) {
        logger.info("=== STUDENT LOGIN ATTEMPT ===");
        logger.info("Student ID received: '{}'", loginRequest.getStudentId());

        Optional<Student> optionalStudent = studentRepository.findByStudentId(loginRequest.getStudentId());

        if (optionalStudent.isEmpty()) {
            logger.error("Student NOT found with Student ID: '{}'", loginRequest.getStudentId());
            return new StudentLoginResponse(false, "Invalid Student ID or password", null, null, null, null, null, null, null, null);
        }

        Student student = optionalStudent.get();

        if (!"ACTIVE".equals(student.getStatus())) {
            logger.error("Student account is inactive: {}", student.getStudentId());
            return new StudentLoginResponse(false, "Account is deactivated. Please contact admin.", null, null, null, null, null, null, null, null);
        }

        Optional<User> optionalUser = userRepository.findByEmail(student.getEmail());

        if (optionalUser.isEmpty()) {
            logger.error("User account not found for student: {}", student.getEmail());
            return new StudentLoginResponse(false, "Invalid credentials", null, null, null, null, null, null, null, null);
        }

        User user = optionalUser.get();

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            logger.error("Password mismatch for student: {}", student.getStudentId());
            return new StudentLoginResponse(false, "Invalid Student ID or password", null, null, null, null, null, null, null, null);
        }

        if (!"STUDENT".equals(user.getRole())) {
            logger.error("User is not a student. Role: {}", user.getRole());
            return new StudentLoginResponse(false, "Access denied. Student only.", null, null, null, null, null, null, null, null);
        }

        if (!user.isActive()) {
            logger.error("User account is inactive for student: {}", student.getStudentId());
            return new StudentLoginResponse(false, "Account is deactivated. Please contact admin.", null, null, null, null, null, null, null, null);
        }

        logger.info("Student login SUCCESSFUL: {} - {}", student.getStudentId(), student.getName());

        return new StudentLoginResponse(
                true,
                "Student login successful",
                user.getRole(),
                student.getName(),
                user.getId(),
                student.getStudentId(),
                student.getEmail(),
                student.getCourse(),
                student.getYear(),
                student.getStatus()
        );
    }

    // Booking Manager specific login
    public LoginResponse bookingManagerLogin(LoginRequest loginRequest) {
        logger.info("Booking Manager login attempt for email: {}", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        if (!"BOOKING_MANAGER".equals(user.getRole())) {
            logger.warn("User {} is not a Booking Manager. Role: {}", user.getEmail(), user.getRole());
            return new LoginResponse(false, "Access denied. Booking Manager only.", null, null);
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Booking Manager login successful: {}", user.getEmail());
        return new LoginResponse(true, "Booking Manager login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }

    // Resource Manager specific login
    public LoginResponse resourceManagerLogin(LoginRequest loginRequest) {
        logger.info("Resource Manager login attempt for email: {}", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        if (!"RESOURCE_MANAGER".equals(user.getRole())) {
            logger.warn("User {} is not a Resource Manager. Role: {}", user.getEmail(), user.getRole());
            return new LoginResponse(false, "Access denied. Resource Manager only.", null, null);
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Resource Manager login successful: {}", user.getEmail());
        return new LoginResponse(true, "Resource Manager login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }

    // Issue Manager specific login
    public LoginResponse issueManagerLogin(LoginRequest loginRequest) {
        logger.info("Issue Manager login attempt for email: {}", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        if (!"ISSUE_MANAGER".equals(user.getRole())) {
            logger.warn("User {} is not an Issue Manager. Role: {}", user.getEmail(), user.getRole());
            return new LoginResponse(false, "Access denied. Issue Manager only.", null, null);
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        logger.info("Issue Manager login successful: {}", user.getEmail());
        return new LoginResponse(true, "Issue Manager login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }

    public LoginResponse lecturerLogin(LoginRequest loginRequest) {
        logger.info("Lecturer login attempt for email: {}", loginRequest.getEmail());

        Optional<User> optionalUser = userRepository.findByEmail(loginRequest.getEmail());

        if (optionalUser.isEmpty()) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        User user = optionalUser.get();

        if (!"LECTURER".equals(user.getRole())) {
            logger.warn("User {} is not a Lecturer. Role: {}", user.getEmail(), user.getRole());
            return new LoginResponse(false, "Access denied. Lecturer only.", null, null);
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return new LoginResponse(false, "Invalid email or password", null, null);
        }

        if (!user.isActive()) {
            return new LoginResponse(false, "Account is inactive.", null, null);
        }

        return new LoginResponse(true, "Lecturer login successful", user.getRole(), user.getName(), user.getId(), user.getEmail());
    }
}