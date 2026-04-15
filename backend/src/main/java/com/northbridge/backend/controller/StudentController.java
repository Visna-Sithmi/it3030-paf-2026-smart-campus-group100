package com.northbridge.backend.controller;

import com.northbridge.backend.dto.ApiResponse;
import com.northbridge.backend.dto.StudentDTO;
import com.northbridge.backend.model.Student;
import com.northbridge.backend.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentController {

    @Autowired
    private StudentService studentService;

    // 1. ADD STUDENT - POST
    @PostMapping("/add")
    public ResponseEntity<ApiResponse> addStudent(@RequestBody StudentDTO studentDTO) {
        try {
            Student newStudent = studentService.addStudent(studentDTO);
            ApiResponse response = new ApiResponse(true, "Student added successfully", newStudent);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 2. GET ALL STUDENTS - GET
    @GetMapping("/all")
    public ResponseEntity<ApiResponse> getAllStudents() {
        try {
            List<StudentDTO> students = studentService.getAllStudents();
            ApiResponse response = new ApiResponse(true, "Students retrieved successfully", students);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching students: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 3. GET STUDENT BY ID - GET
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getStudentById(@PathVariable Long id) {
        try {
            StudentDTO student = studentService.getStudentById(id);
            ApiResponse response = new ApiResponse(true, "Student retrieved successfully", student);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 4. GET STUDENT BY STUDENT ID - GET
    @GetMapping("/student-id/{studentId}")
    public ResponseEntity<ApiResponse> getStudentByStudentId(@PathVariable String studentId) {
        try {
            StudentDTO student = studentService.getStudentByStudentId(studentId);
            ApiResponse response = new ApiResponse(true, "Student retrieved successfully", student);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 5. GET STUDENTS BY COURSE - GET
    @GetMapping("/course/{course}")
    public ResponseEntity<ApiResponse> getStudentsByCourse(@PathVariable String course) {
        try {
            List<StudentDTO> students = studentService.getStudentsByCourse(course);
            ApiResponse response = new ApiResponse(true, "Students retrieved successfully", students);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching students: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 6. GET STUDENTS BY YEAR - GET
    @GetMapping("/year/{year}")
    public ResponseEntity<ApiResponse> getStudentsByYear(@PathVariable Integer year) {
        try {
            List<StudentDTO> students = studentService.getStudentsByYear(year);
            ApiResponse response = new ApiResponse(true, "Students retrieved successfully", students);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching students: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 7. SEARCH STUDENTS BY NAME - GET
    @GetMapping("/search")
    public ResponseEntity<ApiResponse> searchStudents(@RequestParam String name) {
        try {
            List<StudentDTO> students = studentService.searchStudentsByName(name);
            ApiResponse response = new ApiResponse(true, "Students retrieved successfully", students);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error searching students: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 8. UPDATE STUDENT - PUT
    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse> updateStudent(@PathVariable Long id, @RequestBody StudentDTO studentDTO) {
        try {
            StudentDTO updatedStudent = studentService.updateStudent(id, studentDTO);
            ApiResponse response = new ApiResponse(true, "Student updated successfully", updatedStudent);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 9. DELETE STUDENT (Hard Delete) - DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse> deleteStudent(@PathVariable Long id) {
        try {
            studentService.deleteStudent(id);
            ApiResponse response = new ApiResponse(true, "Student deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 10. SOFT DELETE STUDENT - PUT
    @PutMapping("/soft-delete/{id}")
    public ResponseEntity<ApiResponse> softDeleteStudent(@PathVariable Long id) {
        try {
            StudentDTO student = studentService.softDeleteStudent(id);
            ApiResponse response = new ApiResponse(true, "Student deactivated successfully", student);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 11. ACTIVATE STUDENT - PUT
    @PutMapping("/activate/{id}")
    public ResponseEntity<ApiResponse> activateStudent(@PathVariable Long id) {
        try {
            StudentDTO student = studentService.activateStudent(id);
            ApiResponse response = new ApiResponse(true, "Student activated successfully", student);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse response = new ApiResponse(false, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // 12. GET STATISTICS - GET
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse> getStatistics() {
        try {
            StudentService.StudentStatistics stats = studentService.getStatistics();
            ApiResponse response = new ApiResponse(true, "Statistics retrieved successfully", stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ApiResponse response = new ApiResponse(false, "Error fetching statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}