// Create new file: com/northbridge/backend/repository/SystemSettingRepository.java
package com.northbridge.backend.repository;

import com.northbridge.backend.model.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    Optional<SystemSetting> findByKeyName(String keyName);

    @Query("SELECT s.value FROM SystemSetting s WHERE s.keyName = 'global_resource_lock'")
    String getGlobalLockStatus();

    @Modifying
    @Transactional
    @Query("UPDATE SystemSetting s SET s.value = :status WHERE s.keyName = 'global_resource_lock'")
    void updateGlobalLockStatus(String status);
}