package com.arpay.dto;

import com.arpay.entity.Invoice;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class InvoiceDTO {
    private UUID id;

    private String invoiceNumber; // Auto-generated, not required from client

    // Customer Information
    private String projectName;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerPhone;

    private String reference;

    private String leadSource;

    // Financial Details
    // Made optional in DTO, calculated in Service if missing
    private BigDecimal amount;

    private BigDecimal tax;

    private BigDecimal totalAmount;

    // Payment Breakdown (for real estate projects)
    private BigDecimal tokenAmount;
    private BigDecimal agreementAmount;
    private BigDecimal registrationAmount;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate agreementDueDate;

    private BigDecimal agreementDueAmount;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate registrationDueDate;

    private BigDecimal registrationDueAmount;

    // Status and Type
    @NotNull(message = "Status is required")
    private Invoice.InvoiceStatus status;

    @NotNull(message = "Invoice type is required")
    private Invoice.InvoiceType invoiceType;

    // Dates
    @NotNull(message = "Invoice date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate invoiceDate;

    @NotNull(message = "Due date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    // Additional Information
    private String notes;
    private JsonNode lineItems; // Handles both JSON object/array and string
    private JsonNode attachments; // Handles both JSON object/array and string

    // Audit Information
    private UUID createdById;
    private String createdByName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
