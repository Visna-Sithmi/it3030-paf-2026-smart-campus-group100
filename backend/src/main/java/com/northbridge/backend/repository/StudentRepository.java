package com.northbridge.backend.repository;

import com.northbridge.backend.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    // Find student by Student ID (used for login)
    Optional<Student> findByStudentId(String studentId);

    // Find student by Email
    Optional<Student> findByEmail(String email);

    // Find students by course
    List<Student> findByCourse(String course);

    // Find students by year
    List<Student> findByYear(Integer year);

    // Find students by status (ACTIVE/INACTIVE)
    List<Student> findByStatus(String status);

    // Search students by name (partial match)
    @Query("SELECT s FROM Student s WHERE s.name LIKE %:name%")
    List<Student> searchByName(@Param("name") String name);

    // Find students by course and year
    @Query("SELECT s FROM Student s WHERE s.course = :course AND s.year = :year")
    List<Student> findByCourseAndYear(@Param("course") String course, @Param("year") Integer year);

    // Check if student ID exists
    boolean existsByStudentId(String studentId);

    // Check if email exists
    boolean existsByEmail(String email);

    // Count students by status
    long countByStatus(String status);
}