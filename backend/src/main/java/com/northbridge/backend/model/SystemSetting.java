// Create new file: com/northbridge/backend/model/SystemSetting.java
package com.northbridge.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
public class SystemSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "key_name", unique = true, nullable = false, length = 50)
    private String keyName;

    @Column(name = "value", nullable = false, length = 10)
    private String value;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SystemSetting() {}

    public SystemSetting(String keyName, String value) {
        this.keyName = keyName;
        this.value = value;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKeyName() { return keyName; }
    public void setKeyName(String keyName) { this.keyName = keyName; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}