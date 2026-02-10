package com.arpay.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_masters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String propertyName;

    @Column(nullable = false)
    private String plotNumber;

    @Column(nullable = false)
    private Double plotArea; // Area in cents

    @Column(nullable = false)
    private Double plotPrice; // Price per cent in INR

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper method to calculate total value
    public Double calculateTotalValue() {
        return this.plotArea * this.plotPrice;
    }
}

