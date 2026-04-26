package com.northbridge.backend.dto;

import java.util.List;
import java.util.Map;

public class ManagerAnalyticsDTO {
    private Map<String, Long> categoryStats;
    private Map<String, Long> ticketsPerDay;
    private Double avgResolutionTime;
    private Double slaBreachPercentage;
    private List<TopTechnicianDTO> topTechnicians;

    // Extra KPIs for the dashboard UI (derived from manager context)
    private Long totalTickets;
    private Long activeTickets;

    public ManagerAnalyticsDTO() {
    }

    public Map<String, Long> getCategoryStats() {
        return categoryStats;
    }

    public void setCategoryStats(Map<String, Long> categoryStats) {
        this.categoryStats = categoryStats;
    }

    public Map<String, Long> getTicketsPerDay() {
        return ticketsPerDay;
    }

    public void setTicketsPerDay(Map<String, Long> ticketsPerDay) {
        this.ticketsPerDay = ticketsPerDay;
    }

    public Double getAvgResolutionTime() {
        return avgResolutionTime;
    }

    public void setAvgResolutionTime(Double avgResolutionTime) {
        this.avgResolutionTime = avgResolutionTime;
    }

    public Double getSlaBreachPercentage() {
        return slaBreachPercentage;
    }

    public void setSlaBreachPercentage(Double slaBreachPercentage) {
        this.slaBreachPercentage = slaBreachPercentage;
    }

    public List<TopTechnicianDTO> getTopTechnicians() {
        return topTechnicians;
    }

    public void setTopTechnicians(List<TopTechnicianDTO> topTechnicians) {
        this.topTechnicians = topTechnicians;
    }

    public Long getTotalTickets() {
        return totalTickets;
    }

    public void setTotalTickets(Long totalTickets) {
        this.totalTickets = totalTickets;
    }

    public Long getActiveTickets() {
        return activeTickets;
    }

    public void setActiveTickets(Long activeTickets) {
        this.activeTickets = activeTickets;
    }
}

