package com.northbridge.backend.repository;

import com.northbridge.backend.model.IncidentTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<IncidentTicket, Long> {
    List<IncidentTicket> findByCreatedById(Long userId);
    List<IncidentTicket> findByAssignedToId(Long userId);
    List<IncidentTicket> findByStatus(String status);
}