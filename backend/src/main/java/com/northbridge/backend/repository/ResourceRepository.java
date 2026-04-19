package com.northbridge.backend.repository;

import com.northbridge.backend.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // Find by resource code
    Optional<Resource> findByResourceCode(String resourceCode);

    // Find by type
    List<Resource> findByType(String type);

    // Find by status
    List<Resource> findByStatus(String status);

    @Query("SELECT r FROM Resource r WHERE UPPER(COALESCE(r.targetAudience, 'BOTH')) IN :audiences")
    List<Resource> findByTargetAudienceIn(@Param("audiences") List<String> audiences);

    // Find available resources
    List<Resource> findByIsAvailableTrue();

    // Find by location
    List<Resource> findByLocationContainingIgnoreCase(String location);

    // Search by name (partial match)
    @Query("SELECT r FROM Resource r WHERE r.name LIKE %:name%")
    List<Resource> searchByName(@Param("name") String name);

    // Get all distinct resource types
    @Query("SELECT DISTINCT r.type FROM Resource r ORDER BY r.type")
    List<String> findAllDistinctTypes();

    // Find by type and capacity greater than or equal
    @Query("SELECT r FROM Resource r WHERE r.type = :type AND r.capacity >= :capacity")
    List<Resource> findByTypeAndMinCapacity(@Param("type") String type, @Param("capacity") Integer capacity);

    // Find by location and type
    @Query("SELECT r FROM Resource r WHERE r.location LIKE %:location% AND r.type = :type")
    List<Resource> findByLocationAndType(@Param("location") String location, @Param("type") String type);

    // Count by status
    long countByStatus(String status);

    // Count by type
    @Query("SELECT r.type, COUNT(r) FROM Resource r GROUP BY r.type")
    List<Object[]> countByType();

    // Check if resource code exists
    boolean existsByResourceCode(String resourceCode);
}