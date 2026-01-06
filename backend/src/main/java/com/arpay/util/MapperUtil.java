package com.arpay.util;

import com.arpay.dto.*;
import com.arpay.entity.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class MapperUtil {

    private final ModelMapper modelMapper;

    // User Mapping
    public UserDTO mapToUserDTO(User user) {
        return modelMapper.map(user, UserDTO.class);
    }

    // Invoice Mapping
    public InvoiceDTO mapToInvoiceDTO(Invoice invoice) {
        InvoiceDTO dto = modelMapper.map(invoice, InvoiceDTO.class);
        if (invoice.getCreatedBy() != null) {
            dto.setCreatedById(invoice.getCreatedBy().getId());
            dto.setCreatedByName(invoice.getCreatedBy().getName());
        }
        return dto;
    }

    public Invoice mapToInvoiceEntity(InvoiceDTO dto) {
        return modelMapper.map(dto, Invoice.class);
    }

    // Payment Mapping
    public PaymentDTO mapToPaymentDTO(Payment payment) {
        PaymentDTO dto = modelMapper.map(payment, PaymentDTO.class);
        if (payment.getInvoice() != null) {
            dto.setInvoiceId(payment.getInvoice().getId());
            dto.setInvoiceNumber(payment.getInvoice().getInvoiceNumber());
        }
        if (payment.getProcessedBy() != null) {
            dto.setProcessedById(payment.getProcessedBy().getId());
            dto.setProcessedByName(payment.getProcessedBy().getName());
        }
        return dto;
    }

    public Payment mapToPaymentEntity(PaymentDTO dto) {
        return modelMapper.map(dto, Payment.class);
    }

    // Expense Mapping
    public ExpenseDTO mapToExpenseDTO(Expense expense) {
        ExpenseDTO dto = modelMapper.map(expense, ExpenseDTO.class);
        if (expense.getPaidBy() != null) {
            dto.setPaidById(expense.getPaidBy().getId());
            dto.setPaidByName(expense.getPaidBy().getName());
        }
        return dto;
    }

    public Expense mapToExpenseEntity(ExpenseDTO dto) {
        return modelMapper.map(dto, Expense.class);
    }

    // Approval Mapping
    public ApprovalDTO mapToApprovalDTO(Approval approval) {
        ApprovalDTO dto = modelMapper.map(approval, ApprovalDTO.class);
        if (approval.getRequestedBy() != null) {
            dto.setRequestedById(approval.getRequestedBy().getId());
            dto.setRequestedByName(approval.getRequestedBy().getName());
        }
        if (approval.getApprovedBy() != null) {
            dto.setApprovedById(approval.getApprovedBy().getId());
            dto.setApprovedByName(approval.getApprovedBy().getName());
        }
        return dto;
    }

    public Approval mapToApprovalEntity(ApprovalDTO dto) {
        return modelMapper.map(dto, Approval.class);
    }

    // TimeTracking Mapping
    public TimeTrackingDTO mapToTimeTrackingDTO(TimeTracking timeTracking) {
        TimeTrackingDTO dto = modelMapper.map(timeTracking, TimeTrackingDTO.class);
        if (timeTracking.getUser() != null) {
            dto.setUserId(timeTracking.getUser().getId());
            dto.setUserName(timeTracking.getUser().getName());
        }
        return dto;
    }

    public TimeTracking mapToTimeTrackingEntity(TimeTrackingDTO dto) {
        return modelMapper.map(dto, TimeTracking.class);
    }

    // Notification Mapping
    public NotificationDTO mapToNotificationDTO(Notification notification) {
        NotificationDTO dto = modelMapper.map(notification, NotificationDTO.class);
        if (notification.getUser() != null) {
            dto.setUserId(notification.getUser().getId());
        }
        return dto;
    }

    public Notification mapToNotificationEntity(NotificationDTO dto) {
        return modelMapper.map(dto, Notification.class);
    }

    // Report Mapping
    public ReportDTO mapToReportDTO(Report report) {
        ReportDTO dto = modelMapper.map(report, ReportDTO.class);
        if (report.getGeneratedBy() != null) {
            dto.setGeneratedById(report.getGeneratedBy().getId());
            dto.setGeneratedByName(report.getGeneratedBy().getName());
        }
        return dto;
    }

    public Report mapToReportEntity(ReportDTO dto) {
        return modelMapper.map(dto, Report.class);
    }

    // Generic Page Mapping
    public <E, D> PageResponse<D> mapToPageResponse(Page<E> page, Function<E, D> mapper) {
        PageResponse<D> response = new PageResponse<>();
        response.setContent(page.getContent().stream().map(mapper).toList());
        response.setPageNumber(page.getNumber());
        response.setPageSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setLast(page.isLast());
        return response;
    }
}

