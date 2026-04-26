package com.northbridge.backend.model;

public enum TicketStatus {
    /**
     * New workflow (staff completes, manager closes).
     */
    PENDING,
    IN_PROGRESS,
    COMPLETED_BY_STAFF,
    CLOSED,

    /**
     * Legacy statuses (kept for backward compatibility with existing UI/service flow).
     */
    OPEN,
    RESOLVED,
    REJECTED
}
