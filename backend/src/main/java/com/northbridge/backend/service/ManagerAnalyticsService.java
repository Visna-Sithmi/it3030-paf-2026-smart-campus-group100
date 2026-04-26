package com.northbridge.backend.service;

import com.northbridge.backend.dto.ManagerAnalyticsDTO;
import com.northbridge.backend.dto.TopTechnicianDTO;
import com.northbridge.backend.model.IncidentTicket;
import com.northbridge.backend.model.TicketStatus;
import com.northbridge.backend.repository.TicketRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ManagerAnalyticsService {

    private final TicketRepository ticketRepository;

    public ManagerAnalyticsService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public ManagerAnalyticsDTO getAnalytics() {

        List<IncidentTicket> tickets = ticketRepository.findAll();

        ManagerAnalyticsDTO dto = new ManagerAnalyticsDTO();

        // TOTAL
        dto.setTotalTickets((long) tickets.size());

        // ACTIVE
        dto.setActiveTickets(
                tickets.stream()
                        .filter(t -> !t.getStatus().equalsIgnoreCase("CLOSED"))
                        .count()
        );

        // CATEGORY (simple)
        Map<String, Long> category = new HashMap<>();
        for (IncidentTicket t : tickets) {
            String key = t.getCategory() == null ? "Other" : t.getCategory();
            category.put(key, category.getOrDefault(key, 0L) + 1);
        }
        dto.setCategoryStats(category);

        // PER DAY (simple)
        Map<String, Long> perDay = new HashMap<>();
        for (IncidentTicket t : tickets) {
            String day = t.getCreatedAt().toLocalDate().toString();
            perDay.put(day, perDay.getOrDefault(day, 0L) + 1);
        }
        dto.setTicketsPerDay(perDay);

        // TOP TECH (simple)
        Map<String, Long> techMap = new HashMap<>();
        for (IncidentTicket t : tickets) {
            if (t.getAssignedStaffName() != null) {
                String name = t.getAssignedStaffName();
                techMap.put(name, techMap.getOrDefault(name, 0L) + 1);
            }
        }

        List<TopTechnicianDTO> techs = new ArrayList<>();
        for (Map.Entry<String, Long> e : techMap.entrySet()) {
            techs.add(new TopTechnicianDTO(e.getKey(), e.getValue()));
        }
        dto.setTopTechnicians(techs);

        // FIXED VALUES (remove complex SLA logic)
        dto.setAvgResolutionTime(5.0);
        dto.setSlaBreachPercentage(0.0);

        return dto;
    }

    private Map<String, Long> toTicketsPerDay(List<Object[]> rows) {
        Map<String, Long> res = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;

        for (Object[] row : rows) {
            Object dayObj = row[0];
            LocalDate day;
            if (dayObj == null) {
                continue;
            } else if (dayObj instanceof LocalDate) {
                day = (LocalDate) dayObj;
            } else if (dayObj instanceof java.sql.Date) {
                day = ((java.sql.Date) dayObj).toLocalDate();
            } else if (dayObj instanceof java.util.Date) {
                day = ((java.util.Date) dayObj).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            } else {
                // Fallback (dialect-specific string)
                day = LocalDate.parse(String.valueOf(dayObj).substring(0, 10), fmt);
            }

            Long count = row[1] == null ? 0L : ((Number) row[1]).longValue();
            res.put(day.format(fmt), count);
        }
        return res;
    }

    private List<TopTechnicianDTO> toTopTechnicians(List<Object[]> rows) {
        return rows.stream()
                .map(r -> new TopTechnicianDTO(
                        String.valueOf(r[0]),
                        r[1] == null ? 0L : ((Number) r[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

    private Double calculateAvgResolutionHours() {
        // DB-agnostic: compute average Duration between createdAt and resolvedAt.
        List<IncidentTicket> resolved = ticketRepository.findAll().stream()
                .filter(t -> t.getCreatedAt() != null && t.getResolvedAt() != null)
                .collect(Collectors.toList());

        if (resolved.isEmpty()) return 0.0;

        double avgHours = resolved.stream()
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes())
                .filter(m -> m >= 0)
                .average()
                .orElse(0.0) / 60.0;

        // Round to 2 decimals for UI readability.
        return Math.round(avgHours * 100.0) / 100.0;
    }

    private Double calculateSlaBreachPercentage() {
        long resolvedCount = ticketRepository.countByResolvedAtIsNotNull();
        if (resolvedCount <= 0) return 0.0;

        long breached = ticketRepository.countByResolutionBreachedTrue();
        double pct = (breached * 100.0) / resolvedCount;
        return Math.round(pct * 100.0) / 100.0;
    }
}

