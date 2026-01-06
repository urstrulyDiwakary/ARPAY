package com.arpay.repository;

import com.arpay.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    Page<Report> findByReportType(Report.ReportType reportType, Pageable pageable);

    Page<Report> findByGeneratedById(UUID userId, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.generatedAt BETWEEN :startDate AND :endDate")
    List<Report> findByGeneratedAtBetween(@Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM Report r WHERE r.reportType = :type AND r.generatedBy.id = :userId")
    Page<Report> findByTypeAndUser(@Param("type") Report.ReportType type,
                                    @Param("userId") UUID userId,
                                    Pageable pageable);
}

