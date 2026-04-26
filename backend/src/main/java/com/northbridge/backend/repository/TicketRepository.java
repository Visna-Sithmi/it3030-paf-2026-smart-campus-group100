package com.northbridge.backend.repository;

import com.northbridge.backend.model.IncidentTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<IncidentTicket, Long>, JpaSpecificationExecutor<IncidentTicket> {
    List<IncidentTicket> findByCreatedById(Long userId);
    List<IncidentTicket> findByCreatedByUserId(Long userId);
    List<IncidentTicket> findByAssignedStaffId(Long userId);
    List<IncidentTicket> findByStatus(String status);

    @Query("select t.category, count(t) from IncidentTicket t group by t.category")
    List<Object[]> countTicketsByCategory();

    /**
     * Groups by the date portion of createdAt (DB DATE() function).
     * Works with MySQL/MariaDB and most Hibernate dialects via function().
     */
    @Query("""
            select function('DATE', t.createdAt), count(t)
            from IncidentTicket t
            group by function('DATE', t.createdAt)
            order by function('DATE', t.createdAt)
            """)
    List<Object[]> countTicketsPerDay();

    @Query("""
            select t.assignedStaffName, count(t)
            from IncidentTicket t
            where t.resolvedAt is not null
              and t.assignedStaffName is not null
              and trim(t.assignedStaffName) <> ''
            group by t.assignedStaffName
            order by count(t) desc
            """)
    List<Object[]> findTopTechnicians(Pageable pageable);

    long countByResolutionBreachedTrue();

    long countByResolvedAtIsNotNull();

    @Query("select count(t) from IncidentTicket t where upper(t.status) not in :statuses")
    long countByStatusNotInIgnoreCase(@Param("statuses") List<String> statuses);
}