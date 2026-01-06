package com.arpay.service;

import com.arpay.dto.ApprovalDTO;
import com.arpay.dto.PageResponse;
import com.arpay.entity.Approval;

import java.util.UUID;

public interface ApprovalService {
    ApprovalDTO createApproval(ApprovalDTO approvalDTO);
    ApprovalDTO updateApproval(UUID id, ApprovalDTO approvalDTO);
    ApprovalDTO getApprovalById(UUID id);
    PageResponse<ApprovalDTO> getAllApprovals(int page, int size, String sortBy, String sortDir);
    PageResponse<ApprovalDTO> getApprovalsByStatus(Approval.ApprovalStatus status, int page, int size);
    PageResponse<ApprovalDTO> getApprovalsByModuleType(Approval.ModuleType type, int page, int size);
    ApprovalDTO approveRequest(UUID id, UUID approvedBy, String remarks);
    ApprovalDTO rejectRequest(UUID id, UUID approvedBy, String remarks);
    void deleteApproval(UUID id);
    long countByStatus(Approval.ApprovalStatus status);
}

