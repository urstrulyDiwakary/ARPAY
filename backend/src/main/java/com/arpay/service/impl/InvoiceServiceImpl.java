package com.arpay.service.impl;

import com.arpay.dto.InvoiceDTO;
import com.arpay.dto.PageResponse;
import com.arpay.entity.Invoice;
import com.arpay.entity.User;
import com.arpay.exception.ResourceNotFoundException;
import com.arpay.exception.DuplicateResourceException;
import com.arpay.repository.InvoiceRepository;
import com.arpay.repository.UserRepository;
import com.arpay.service.InvoiceService;
import com.arpay.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public InvoiceDTO createInvoice(InvoiceDTO invoiceDTO) {
        log.info("Creating invoice: {}", invoiceDTO.getInvoiceNumber());

        // Check for duplicate invoice number
        if (invoiceRepository.existsByInvoiceNumber(invoiceDTO.getInvoiceNumber())) {
            throw new DuplicateResourceException("Invoice with number " + invoiceDTO.getInvoiceNumber() + " already exists");
        }

        // Get current user from security context
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Invoice invoice = convertToEntity(invoiceDTO);
        invoice.setCreatedBy(currentUser);

        // Calculate total amount if tax is provided
        if (invoice.getTax() != null) {
            invoice.setTotalAmount(invoice.getAmount().add(invoice.getTax()));
        } else {
            invoice.setTotalAmount(invoice.getAmount());
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);
        log.info("Invoice created successfully with ID: {}", savedInvoice.getId());

        return convertToDTO(savedInvoice);
    }

    @Override
    @Transactional
    public InvoiceDTO updateInvoice(UUID id, InvoiceDTO invoiceDTO) {
        log.info("Updating invoice with ID: {}", id);

        Invoice existingInvoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        // Check for duplicate invoice number if it's being changed
        if (!existingInvoice.getInvoiceNumber().equals(invoiceDTO.getInvoiceNumber()) &&
            invoiceRepository.existsByInvoiceNumber(invoiceDTO.getInvoiceNumber())) {
            throw new DuplicateResourceException("Invoice with number " + invoiceDTO.getInvoiceNumber() + " already exists");
        }

        // Update fields
        existingInvoice.setInvoiceNumber(invoiceDTO.getInvoiceNumber());
        existingInvoice.setClientName(invoiceDTO.getClientName());
        existingInvoice.setAmount(invoiceDTO.getAmount());
        existingInvoice.setTax(invoiceDTO.getTax());
        existingInvoice.setStatus(invoiceDTO.getStatus());
        existingInvoice.setInvoiceType(invoiceDTO.getInvoiceType());
        existingInvoice.setInvoiceDate(invoiceDTO.getInvoiceDate());
        existingInvoice.setDueDate(invoiceDTO.getDueDate());
        existingInvoice.setNotes(invoiceDTO.getNotes());
        existingInvoice.setLineItems(invoiceDTO.getLineItems());
        existingInvoice.setAttachments(invoiceDTO.getAttachments());

        // Recalculate total amount
        if (existingInvoice.getTax() != null) {
            existingInvoice.setTotalAmount(existingInvoice.getAmount().add(existingInvoice.getTax()));
        } else {
            existingInvoice.setTotalAmount(existingInvoice.getAmount());
        }

        Invoice updatedInvoice = invoiceRepository.save(existingInvoice);
        log.info("Invoice updated successfully with ID: {}", updatedInvoice.getId());

        return convertToDTO(updatedInvoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceById(UUID id) {
        log.info("Fetching invoice with ID: {}", id);
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return convertToDTO(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceDTO> getAllInvoices(int page, int size, String sortBy, String sortDir) {
        log.info("Fetching all invoices - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Invoice> invoicePage = invoiceRepository.findAll(pageable);

        return mapToPageResponse(invoicePage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceDTO> getInvoicesByStatus(Invoice.InvoiceStatus status, int page, int size) {
        log.info("Fetching invoices by status: {}", status);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Invoice> invoicePage = invoiceRepository.findByStatus(status, pageable);
        return mapToPageResponse(invoicePage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceDTO> getInvoicesByType(Invoice.InvoiceType type, int page, int size) {
        log.info("Fetching invoices by type: {}", type);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Invoice> invoicePage = invoiceRepository.findByInvoiceType(type, pageable);
        return mapToPageResponse(invoicePage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceDTO> searchInvoices(String search, int page, int size) {
        log.info("Searching invoices with query: {}", search);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Invoice> invoicePage = invoiceRepository.searchInvoices(search, pageable);
        return mapToPageResponse(invoicePage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> getInvoicesByDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Fetching invoices between {} and {}", startDate, endDate);
        List<Invoice> invoices = invoiceRepository.findByInvoiceDateBetween(startDate, endDate);
        return invoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> getOverdueInvoices() {
        log.info("Fetching overdue invoices");
        List<Invoice> overdueInvoices = invoiceRepository.findOverdueInvoices(LocalDate.now());
        return overdueInvoices.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteInvoice(UUID id) {
        log.info("Deleting invoice with ID: {}", id);
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        invoiceRepository.delete(invoice);
        log.info("Invoice deleted successfully with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalAmountByStatus(Invoice.InvoiceStatus status) {
        log.info("Calculating total amount for status: {}", status);
        BigDecimal total = invoiceRepository.sumTotalAmountByStatus(status);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(Invoice.InvoiceStatus status) {
        log.info("Counting invoices with status: {}", status);
        return invoiceRepository.countByStatus(status);
    }

    // Helper methods
    private Invoice convertToEntity(InvoiceDTO dto) {
        Invoice invoice = new Invoice();
        invoice.setId(dto.getId());
        invoice.setInvoiceNumber(dto.getInvoiceNumber());
        invoice.setClientName(dto.getClientName());
        invoice.setAmount(dto.getAmount());
        invoice.setTax(dto.getTax());
        invoice.setTotalAmount(dto.getTotalAmount());
        invoice.setStatus(dto.getStatus());
        invoice.setInvoiceType(dto.getInvoiceType());
        invoice.setInvoiceDate(dto.getInvoiceDate());
        invoice.setDueDate(dto.getDueDate());
        invoice.setNotes(dto.getNotes());
        invoice.setLineItems(dto.getLineItems());
        invoice.setAttachments(dto.getAttachments());
        return invoice;
    }

    private InvoiceDTO convertToDTO(Invoice invoice) {
        InvoiceDTO dto = new InvoiceDTO();
        dto.setId(invoice.getId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        dto.setClientName(invoice.getClientName());
        dto.setAmount(invoice.getAmount());
        dto.setTax(invoice.getTax());
        dto.setTotalAmount(invoice.getTotalAmount());
        dto.setStatus(invoice.getStatus());
        dto.setInvoiceType(invoice.getInvoiceType());
        dto.setInvoiceDate(invoice.getInvoiceDate());
        dto.setDueDate(invoice.getDueDate());
        dto.setNotes(invoice.getNotes());
        dto.setLineItems(invoice.getLineItems());
        dto.setAttachments(invoice.getAttachments());
        dto.setCreatedById(invoice.getCreatedBy().getId());
        dto.setCreatedByName(invoice.getCreatedBy().getName());
        dto.setCreatedAt(invoice.getCreatedAt());
        dto.setUpdatedAt(invoice.getUpdatedAt());
        return dto;
    }

    private PageResponse<InvoiceDTO> mapToPageResponse(Page<Invoice> invoicePage) {
        List<InvoiceDTO> invoiceDTOs = invoicePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResponse<InvoiceDTO> response = new PageResponse<>();
        response.setContent(invoiceDTOs);
        response.setPageNumber(invoicePage.getNumber());
        response.setPageSize(invoicePage.getSize());
        response.setTotalElements(invoicePage.getTotalElements());
        response.setTotalPages(invoicePage.getTotalPages());
        response.setLast(invoicePage.isLast());

        return response;
    }
}

