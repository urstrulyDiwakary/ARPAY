package com.arpay.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDTO {
    private UUID id;

    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;  // AR-EXP-001, etc.

    private String title;

    @NotBlank(message = "Category is required")
    private String category;  // TRAVEL, OFFICE, etc. - as string

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private String notes;

    @NotBlank(message = "Status is required")
    private String status;  // PENDING, APPROVED, REJECTED - as string

    private String paymentMode;  // CASH, CARD, BANK_TRANSFER, UPI - as string

    private String property;

    private String projectName;  // Project name from frontend

    private List<AttachmentDTO> attachments;  // Changed from String to List

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private java.time.LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private java.time.LocalDateTime updatedAt;

    // Inner class for attachment DTO
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentDTO {
        private String id;
        private String name;
        private long size;
        private String type;
    }
}

