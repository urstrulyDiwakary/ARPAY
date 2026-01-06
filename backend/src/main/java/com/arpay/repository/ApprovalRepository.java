package com.arpay.repository;

import com.arpay.entity.Approval;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, UUID> {

    Page<Approval> findByStatus(Approval.ApprovalStatus status, Pageable pageable);

    Page<Approval> findByModuleType(Approval.ModuleType moduleType, Pageable pageable);

    Page<Approval> findByRequestedById(UUID userId, Pageable pageable);

    Page<Approval> findByApprovedById(UUID userId, Pageable pageable);

    @Query("SELECT a FROM Approval a WHERE a.status = :status AND a.moduleType = :type")
    Page<Approval> findByStatusAndModuleType(@Param("status") Approval.ApprovalStatus status,
                                             @Param("type") Approval.ModuleType type,
                                             Pageable pageable);

    @Query("SELECT a FROM Approval a WHERE a.status = :status AND a.priority = :priority")
    Page<Approval> findByStatusAndPriority(@Param("status") Approval.ApprovalStatus status,
                                           @Param("priority") Approval.Priority priority,
                                           Pageable pageable);

    @Query("SELECT COUNT(a) FROM Approval a WHERE a.status = :status")
    long countByStatus(@Param("status") Approval.ApprovalStatus status);

    List<Approval> findByReferenceId(UUID referenceId);
}

