package com.arpay.service;

import com.arpay.dto.PageResponse;
import com.arpay.dto.PaymentDTO;
import com.arpay.entity.Payment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PaymentService {
    PaymentDTO createPayment(PaymentDTO paymentDTO);
    PaymentDTO updatePayment(UUID id, PaymentDTO paymentDTO);
    PaymentDTO getPaymentById(UUID id);
    PageResponse<PaymentDTO> getAllPayments(int page, int size, String sortBy, String sortDir);
    PageResponse<PaymentDTO> getPaymentsByStatus(Payment.PaymentStatus status, int page, int size);
    List<PaymentDTO> getPaymentsByInvoiceId(UUID invoiceId);
    List<PaymentDTO> getPaymentsByDateRange(LocalDate startDate, LocalDate endDate);
    void deletePayment(UUID id);
    BigDecimal getTotalAmountByStatus(Payment.PaymentStatus status);
    long countByStatus(Payment.PaymentStatus status);
}

