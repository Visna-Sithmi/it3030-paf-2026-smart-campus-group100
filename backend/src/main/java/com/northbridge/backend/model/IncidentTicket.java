package com.northbridge.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incident_ticket")
public class IncidentTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @Column(name = "created_by_id", nullable = false)
    private Long createdById;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "created_by_role", length = 50)
    private String createdByRole;

    @Column(name = "created_by_name", length = 100)
    private String createdByName;

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "assigned_staff_name", length = 100)
    private String assignedStaffName;

    @Column(name = "assigned_staff_role", length = 50)
    private String assignedStaffRole;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String priority;

    @Column(length = 255)
    private String preferredContact;

    @Column(nullable = false)
    private String status;

    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // SLA tracking
    @Column
    private LocalDateTime assignedAt;

    @Column
    private LocalDateTime resolvedAt;

    /**
     * Staff completion timestamp (staff marks done; manager reviews later).
     */
    @Column
    private LocalDateTime completedAt;

    /**
     * Manager final close timestamp.
     */
    @Column
    private LocalDateTime closedAt;

    /**
     * Staff user id who completed the ticket.
     */
    @Column
    private Long resolvedBy;

    @Column(nullable = false)
    private boolean responseBreached = false;

    @Column(nullable = false)
    private boolean resolutionBreached = false;

    /**
     * Used to dedupe "about to breach" notifications from the scheduled checker.
     */
    @Column(nullable = false)
    private boolean responseWarningSent = false;

    /**
     * Used to dedupe "about to breach" notifications from the scheduled checker.
     */
    @Column(nullable = false)
    private boolean resolutionWarningSent = false;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketComment> comments = new ArrayList<>();

    public IncidentTicket() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Resource getResource() {
        return resource;
    }

    public Long getCreatedById() {
        return createdById;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public String getCreatedByRole() {
        return createdByRole;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public String getAssignedStaffName() {
        return assignedStaffName;
    }

    public String getAssignedStaffRole() {
        return assignedStaffRole;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public String getPriority() {
        return priority;
    }

    public String getPreferredContact() {
        return preferredContact;
    }

    public String getStatus() {
        return status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public Long getResolvedBy() {
        return resolvedBy;
    }

    public boolean isResponseBreached() {
        return responseBreached;
    }

    public boolean isResolutionBreached() {
        return resolutionBreached;
    }

    public boolean isResponseWarningSent() {
        return responseWarningSent;
    }

    public boolean isResolutionWarningSent() {
        return resolutionWarningSent;
    }

    public List<TicketAttachment> getAttachments() {
        return attachments;
    }

    public List<TicketComment> getComments() {
        return comments;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public void setCreatedById(Long createdById) {
        this.createdById = createdById;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public void setCreatedByRole(String createdByRole) {
        this.createdByRole = createdByRole;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public void setAssignedStaffName(String assignedStaffName) {
        this.assignedStaffName = assignedStaffName;
    }

    public void setAssignedStaffRole(String assignedStaffRole) {
        this.assignedStaffRole = assignedStaffRole;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public void setResolvedBy(Long resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public void setResponseBreached(boolean responseBreached) {
        this.responseBreached = responseBreached;
    }

    public void setResolutionBreached(boolean resolutionBreached) {
        this.resolutionBreached = resolutionBreached;
    }

    public void setResponseWarningSent(boolean responseWarningSent) {
        this.responseWarningSent = responseWarningSent;
    }

    public void setResolutionWarningSent(boolean resolutionWarningSent) {
        this.resolutionWarningSent = resolutionWarningSent;
    }

    public void setAttachments(List<TicketAttachment> attachments) {
        this.attachments = attachments;
    }

    public void setComments(List<TicketComment> comments) {
        this.comments = comments;
    }
}