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

    Optional<Student> findByStudentId(String studentId);

    Optional<Student> findByEmail(String email);

    List<Student> findByCourse(String course);

    List<Student> findByYear(Integer year);

    List<Student> findByStatus(String status);

    @Query("SELECT s FROM Student s WHERE s.name LIKE %:name%")
    List<Student> searchByName(@Param("name") String name);

    @Query("SELECT s FROM Student s WHERE s.course = :course AND s.year = :year")
    List<Student> findByCourseAndYear(@Param("course") String course, @Param("year") Integer year);

    boolean existsByStudentId(String studentId);

    boolean existsByEmail(String email);

    long countByStatus(String status);
}