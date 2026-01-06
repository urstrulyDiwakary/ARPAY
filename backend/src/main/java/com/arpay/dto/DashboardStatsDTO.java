package com.arpay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private BigDecimal totalInvoices;
    private Long invoiceCount;
    private BigDecimal totalExpenses;
    private BigDecimal totalPayments;
    private Long pendingApprovals;
    private Long overdueInvoices;
    private Long activeUsers;
    private BigDecimal monthlyRevenue;
}


