package com.arpay.dto;

import com.arpay.entity.Report;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private UUID id;

    @NotNull(message = "Report type is required")
    private Report.ReportType reportType;

    @NotNull(message = "From date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fromDate;

    @NotNull(message = "To date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate toDate;

    private UUID generatedById;
    private String generatedByName;

    private String reportData;
    private String filters;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime generatedAt;
}

