package com.arpay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMasterDTO {

    private Long id;
    private String projectName;
    private String propertyName;
    private String plotNumber;
    private Double plotArea;
    private Double plotPrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive;

    // Helper to calculate total value
    public Double calculateTotalValue() {
        if (plotArea != null && plotPrice != null) {
            return plotArea * plotPrice;
        }
        return 0.0;
    }
}

