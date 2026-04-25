package com.northbridge.backend.service;

import com.northbridge.backend.model.Notification;
import com.northbridge.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification createNotification(Long userId, String message, String type) {
        return createNotification(userId, message, type, null);
    }

    @Transactional
    public Notification createNotification(Long userId, String message, String type, Long referenceId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("message is required");
        }
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException("type is required");
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setMessage(message.trim());
        notification.setType(type.trim().toUpperCase());
        notification.setReferenceId(referenceId);
        notification.setRead(false);

        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Notification markAsRead(Long notificationId) {
        if (notificationId == null) {
            throw new IllegalArgumentException("notificationId is required");
        }

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NoSuchElementException("Notification not found with ID: " + notificationId));

        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}
