package com.arpay.dto;

import com.arpay.entity.Approval;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDTO {
    private UUID id;

    @NotNull(message = "Module type is required")
    private Approval.ModuleType moduleType;

    @NotNull(message = "Reference ID is required")
    private UUID referenceId;

    @NotNull(message = "Requested by is required")
    private UUID requestedById;

    private String requestedByName;

    private UUID approvedById;
    private String approvedByName;

    @NotNull(message = "Status is required")
    private Approval.ApprovalStatus status;

    @NotNull(message = "Priority is required")
    private Approval.Priority priority;

    private String description;
    private String remarks;
    private BigDecimal amount;
    private String department;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime approvedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}


