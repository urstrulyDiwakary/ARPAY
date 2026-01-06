package com.arpay.repository;

import com.arpay.entity.TimeTracking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TimeTrackingRepository extends JpaRepository<TimeTracking, UUID> {

    Page<TimeTracking> findByUserId(UUID userId, Pageable pageable);

    Page<TimeTracking> findByProjectName(String projectName, Pageable pageable);

    Page<TimeTracking> findByStatus(TimeTracking.TrackingStatus status, Pageable pageable);

    @Query("SELECT t FROM TimeTracking t WHERE t.startTime BETWEEN :startDate AND :endDate")
    List<TimeTracking> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    @Query("SELECT t FROM TimeTracking t WHERE t.user.id = :userId AND t.status = :status")
    Page<TimeTracking> findByUserIdAndStatus(@Param("userId") UUID userId,
                                             @Param("status") TimeTracking.TrackingStatus status,
                                             Pageable pageable);

    @Query("SELECT SUM(t.totalHours) FROM TimeTracking t WHERE t.user.id = :userId")
    BigDecimal sumHoursByUserId(@Param("userId") UUID userId);

    @Query("SELECT SUM(t.totalHours) FROM TimeTracking t WHERE t.projectName = :projectName")
    BigDecimal sumHoursByProject(@Param("projectName") String projectName);

    @Query("SELECT DISTINCT t.projectName FROM TimeTracking t ORDER BY t.projectName")
    List<String> findAllProjectNames();
}

