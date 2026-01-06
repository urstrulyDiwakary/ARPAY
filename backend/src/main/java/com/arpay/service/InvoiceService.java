package com.arpay.service;

import com.arpay.dto.InvoiceDTO;
import com.arpay.dto.PageResponse;
import com.arpay.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface InvoiceService {
    InvoiceDTO createInvoice(InvoiceDTO invoiceDTO);
    InvoiceDTO updateInvoice(UUID id, InvoiceDTO invoiceDTO);
    InvoiceDTO getInvoiceById(UUID id);
    PageResponse<InvoiceDTO> getAllInvoices(int page, int size, String sortBy, String sortDir);
    PageResponse<InvoiceDTO> getInvoicesByStatus(Invoice.InvoiceStatus status, int page, int size);
    PageResponse<InvoiceDTO> getInvoicesByType(Invoice.InvoiceType type, int page, int size);
    PageResponse<InvoiceDTO> searchInvoices(String search, int page, int size);
    List<InvoiceDTO> getInvoicesByDateRange(LocalDate startDate, LocalDate endDate);
    List<InvoiceDTO> getOverdueInvoices();
    void deleteInvoice(UUID id);
    BigDecimal getTotalAmountByStatus(Invoice.InvoiceStatus status);
    long countByStatus(Invoice.InvoiceStatus status);
}

