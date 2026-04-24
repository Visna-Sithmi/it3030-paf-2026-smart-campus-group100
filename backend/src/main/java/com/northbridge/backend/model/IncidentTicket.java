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

    @ManyToOne
    @JoinColumn(name = "created_by_id", nullable = false)
    private Student createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private Student assignedTo;

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

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketComment> comments = new ArrayList<>();

    public IncidentTicket() {
    }

    public IncidentTicket(Long id, Resource resource, Student createdBy, Student assignedTo, String category,
                          String description, String priority, String preferredContact, String status,
                          String rejectionReason, String resolutionNotes, LocalDateTime createdAt,
                          LocalDateTime updatedAt, List<TicketAttachment> attachments, List<TicketComment> comments) {
        this.id = id;
        this.resource = resource;
        this.createdBy = createdBy;
        this.assignedTo = assignedTo;
        this.category = category;
        this.description = description;
        this.priority = priority;
        this.preferredContact = preferredContact;
        this.status = status;
        this.rejectionReason = rejectionReason;
        this.resolutionNotes = resolutionNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.attachments = attachments;
        this.comments = comments;
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

    public Student getCreatedBy() {
        return createdBy;
    }

    public Student getAssignedTo() {
        return assignedTo;
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

    public void setCreatedBy(Student createdBy) {
        this.createdBy = createdBy;
    }

    public void setAssignedTo(Student assignedTo) {
        this.assignedTo = assignedTo;
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

    public void setAttachments(List<TicketAttachment> attachments) {
        this.attachments = attachments;
    }

    public void setComments(List<TicketComment> comments) {
        this.comments = comments;
    }
}