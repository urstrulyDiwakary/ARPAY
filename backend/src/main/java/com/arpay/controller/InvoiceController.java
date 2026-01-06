package com.arpay.controller;

import com.arpay.dto.InvoiceDTO;
import com.arpay.dto.PageResponse;
import com.arpay.entity.Invoice;
import com.arpay.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceDTO> createInvoice(@Valid @RequestBody InvoiceDTO invoiceDTO) {
        log.info("Creating invoice: {}", invoiceDTO.getInvoiceNumber());
        InvoiceDTO created = invoiceService.createInvoice(invoiceDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDTO> getInvoiceById(@PathVariable UUID id) {
        log.info("Fetching invoice with ID: {}", id);
        InvoiceDTO invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(invoice);
    }

    @GetMapping
    public ResponseEntity<PageResponse<InvoiceDTO>> getAllInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("Fetching all invoices - page: {}, size: {}", page, size);
        PageResponse<InvoiceDTO> invoices = invoiceService.getAllInvoices(page, size, sortBy, sortDir);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<PageResponse<InvoiceDTO>> getInvoicesByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching invoices by status: {}", status);
        PageResponse<InvoiceDTO> invoices = invoiceService.getInvoicesByStatus(
                Invoice.InvoiceStatus.valueOf(status.toUpperCase()), page, size);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<PageResponse<InvoiceDTO>> getInvoicesByType(
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching invoices by type: {}", type);
        PageResponse<InvoiceDTO> invoices = invoiceService.getInvoicesByType(
                Invoice.InvoiceType.valueOf(type.toUpperCase()), page, size);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<InvoiceDTO>> searchInvoices(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Searching invoices with query: {}", query);
        PageResponse<InvoiceDTO> invoices = invoiceService.searchInvoices(query, page, size);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<InvoiceDTO>> getInvoicesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("Fetching invoices between {} and {}", startDate, endDate);
        List<InvoiceDTO> invoices = invoiceService.getInvoicesByDateRange(startDate, endDate);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<InvoiceDTO>> getOverdueInvoices() {
        log.info("Fetching overdue invoices");
        List<InvoiceDTO> invoices = invoiceService.getOverdueInvoices();
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/stats/total")
    public ResponseEntity<BigDecimal> getTotalAmountByStatus(@RequestParam String status) {
        log.info("Calculating total amount for status: {}", status);
        BigDecimal total = invoiceService.getTotalAmountByStatus(
                Invoice.InvoiceStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(total);
    }

    @GetMapping("/stats/count")
    public ResponseEntity<Long> countByStatus(@RequestParam String status) {
        log.info("Counting invoices with status: {}", status);
        long count = invoiceService.countByStatus(
                Invoice.InvoiceStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceDTO> updateInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody InvoiceDTO invoiceDTO) {
        log.info("Updating invoice with ID: {}", id);
        InvoiceDTO updated = invoiceService.updateInvoice(id, invoiceDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable UUID id) {
        log.info("Deleting invoice with ID: {}", id);
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}

