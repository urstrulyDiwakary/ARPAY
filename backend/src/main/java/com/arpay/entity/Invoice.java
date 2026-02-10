package com.arpay.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    // Customer Information
    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(name = "customer_name", nullable = false, length = 200)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    // Reference and Lead Source Information
    @Column(name = "reference", length = 255)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source", length = 50)
    private LeadSource leadSource;

    // Financial Details
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(precision = 15, scale = 2)
    private BigDecimal tax;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    // Payment Breakdown (for real estate projects)
    @Column(name = "token_amount", precision = 15, scale = 2)
    private BigDecimal tokenAmount;

    @Column(name = "agreement_amount", precision = 15, scale = 2)
    private BigDecimal agreementAmount;

    @Column(name = "registration_amount", precision = 15, scale = 2)
    private BigDecimal registrationAmount;

    @Column(name = "agreement_due_date")
    private LocalDate agreementDueDate;

    @Column(name = "agreement_due_amount", precision = 15, scale = 2)
    private BigDecimal agreementDueAmount;

    @Column(name = "registration_due_date")
    private LocalDate registrationDueDate;

    @Column(name = "registration_due_amount", precision = 15, scale = 2)
    private BigDecimal registrationDueAmount;

    // Status and Type
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 20)
    private InvoiceType invoiceType;

    // Dates
    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    // Additional Information (stored as JSONB in PostgreSQL)
    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "line_items", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String lineItems;

    @Column(name = "attachments", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String attachments;

    // Audit Fields
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = true)
    private User createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum InvoiceStatus {
        PAID, PENDING, OVERDUE, PARTIAL;

        @Override
        public String toString() {
            return this.name().toLowerCase();
        }

        public static InvoiceStatus fromString(String value) {
            if (value == null) {
                return null;
            }
            try {
                return InvoiceStatus.valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid invoice status: " + value);
            }
        }
    }

    public enum InvoiceType {
        PROJECT, CUSTOMER, EXPENSE;

        @Override
        public String toString() {
            return this.name().toLowerCase();
        }

        public static InvoiceType fromString(String value) {
            if (value == null) {
                return null;
            }
            try {
                return InvoiceType.valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid invoice type: " + value);
            }
        }
    }

    public enum LeadSource {
        MARKETING_DATA("Marketing Data"),
        OLD_DATA("Old Data"),
        DIRECT_LEAD("Direct Lead"),
        REFERRAL("Referral"),
        SOCIAL_MEDIA("Social Media"),
        OTHERS("Others");

        private final String displayName;

        LeadSource(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }

        @Override
        public String toString() {
            return this.displayName;
        }

        public static LeadSource fromString(String value) {
            if (value == null) {
                return null;
            }
            for (LeadSource source : LeadSource.values()) {
                if (source.displayName.equalsIgnoreCase(value) || source.name().equalsIgnoreCase(value)) {
                    return source;
                }
            }
            throw new IllegalArgumentException("Invalid lead source: " + value);
        }
    }
}
