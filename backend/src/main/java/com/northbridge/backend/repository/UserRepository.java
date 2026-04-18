package com.northbridge.backend.repository;

import com.northbridge.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Basic find methods
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailCaseInsensitive(@Param("email") String email);

    boolean existsByEmail(String email);

    // Manager specific methods
    @Query("SELECT u FROM User u WHERE u.role IN ('RESOURCE_MANAGER', 'BOOKING_MANAGER', 'ISSUE_MANAGER', 'LECTURER')")
    List<User> findAllManagers();

    List<User> findByRole(String role);

    @Query("SELECT u FROM User u WHERE u.role = 'ADMIN'")
    List<User> findAllAdmins();

    List<User> findByRoleIn(List<String> roles);
}