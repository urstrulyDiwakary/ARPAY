package com.arpay.service.impl;

import com.arpay.dto.InvoiceDTO;
import com.arpay.dto.PageResponse;
import com.arpay.entity.Invoice;
import com.arpay.entity.User;
import com.arpay.exception.ResourceNotFoundException;
import com.arpay.repository.InvoiceRepository;
import com.arpay.repository.UserRepository;
import com.arpay.service.InvoiceService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public InvoiceDTO createInvoice(InvoiceDTO invoiceDTO) {
        log.info("Creating new invoice");

        // Get current user from security context or use system user
        User currentUser = getCurrentUser();

        // Auto-generate invoice number using database function
        String invoiceNumber = invoiceRepository.generateInvoiceNumber();
        log.info("Generated invoice number: {}", invoiceNumber);

        Invoice invoice = convertToEntity(invoiceDTO);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setCreatedBy(currentUser);

        // Calculate total amount if not provided
        if (invoice.getTotalAmount() == null) {
            BigDecimal total = invoice.getAmount() != null ? invoice.getAmount() : BigDecimal.ZERO;
            if (invoice.getTax() != null) {
                total = total.add(invoice.getTax());
            }
            invoice.setTotalAmount(total);
        }
        
        // Ensure amount is set if null but totalAmount is present
        if (invoice.getAmount() == null && invoice.getTotalAmount() != null) {
            invoice.setAmount(invoice.getTotalAmount());
        } else if (invoice.getAmount() == null) {
             invoice.setAmount(BigDecimal.ZERO);
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);
        log.info("Invoice created successfully with ID: {} and number: {}", savedInvoice.getId(), savedInvoice.getInvoiceNumber());

        return convertToDTO(savedInvoice);
    }

    @Override
    @Transactional
    public InvoiceDTO updateInvoice(UUID id, InvoiceDTO invoiceDTO) {
        log.info("Updating invoice with ID: {}", id);

        Invoice existingInvoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        // Update fields
        if (invoiceDTO.getProjectName() != null) {
            existingInvoice.setProjectName(invoiceDTO.getProjectName());
        }
        if (invoiceDTO.getCustomerName() != null) {
            existingInvoice.setCustomerName(invoiceDTO.getCustomerName());
        }
        if (invoiceDTO.getCustomerPhone() != null) {
            existingInvoice.setCustomerPhone(invoiceDTO.getCustomerPhone());
        }
        if (invoiceDTO.getReference() != null) {
            existingInvoice.setReference(invoiceDTO.getReference());
        }
        if (invoiceDTO.getLeadSource() != null) {
            existingInvoice.setLeadSource(Invoice.LeadSource.fromString(invoiceDTO.getLeadSource()));
        }

        // Financial Details
        if (invoiceDTO.getAmount() != null) {
            existingInvoice.setAmount(invoiceDTO.getAmount());
        }
        existingInvoice.setTax(invoiceDTO.getTax());
        
        if (invoiceDTO.getTotalAmount() != null) {
            existingInvoice.setTotalAmount(invoiceDTO.getTotalAmount());
        }

        // Payment Breakdown
        existingInvoice.setTokenAmount(invoiceDTO.getTokenAmount());
        existingInvoice.setAgreementAmount(invoiceDTO.getAgreementAmount());
        existingInvoice.setRegistrationAmount(invoiceDTO.getRegistrationAmount());
        existingInvoice.setAgreementDueDate(invoiceDTO.getAgreementDueDate());
        existingInvoice.setAgreementDueAmount(invoiceDTO.getAgreementDueAmount());
        existingInvoice.setRegistrationDueDate(invoiceDTO.getRegistrationDueDate());
        existingInvoice.setRegistrationDueAmount(invoiceDTO.getRegistrationDueAmount());

        // Status and Type
        if (invoiceDTO.getStatus() != null) {
            existingInvoice.setStatus(invoiceDTO.getStatus());
        }
        if (invoiceDTO.getInvoiceType() != null) {
            existingInvoice.setInvoiceType(invoiceDTO.getInvoiceType());
        }

        // Dates
        if (invoiceDTO.getInvoiceDate() != null) {
            existingInvoice.setInvoiceDate(invoiceDTO.getInvoiceDate());
        }
        if (invoiceDTO.getDueDate() != null) {
            existingInvoice.setDueDate(invoiceDTO.getDueDate());
        }

        // Additional Information
        existingInvoice.setNotes(invoiceDTO.getNotes());
        
        try {
            if (invoiceDTO.getLineItems() != null) {
                existingInvoice.setLineItems(objectMapper.writeValueAsString(invoiceDTO.getLineItems()));
            }
            
            if (invoiceDTO.getAttachments() != null) {
                existingInvoice.setAttachments(objectMapper.writeValueAsString(invoiceDTO.getAttachments()));
            }
        } catch (JsonProcessingException e) {
            log.error("Error serializing JSON fields", e);
            // Fallback or rethrow depending on requirements
        }

        // Recalculate total amount if not explicitly set but amount/tax changed
        if (invoiceDTO.getTotalAmount() == null) {
            BigDecimal total = existingInvoice.getAmount();
            if (existingInvoice.getTax() != null) {
                total = total.add(existingInvoice.getTax());
            }
            existingInvoice.setTotalAmount(total);
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
    private User getCurrentUser() {
        try {
            // Try to get authenticated user
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
                if (userEmail != null && !userEmail.equals("anonymousUser")) {
                    return userRepository.findByEmail(userEmail)
                            .orElseGet(this::getOrCreateSystemUser);
                }
            }
        } catch (Exception e) {
            log.warn("Could not get authenticated user: {}", e.getMessage());
        }
        // Fallback to system user
        return getOrCreateSystemUser();
    }

    private User getOrCreateSystemUser() {
        return userRepository.findByEmail("system@arpay.com")
                .orElseGet(() -> {
                    log.info("Creating system user for unauthenticated operations");
                    User systemUser = new User();
                    systemUser.setEmail("system@arpay.com");
                    systemUser.setName("System User");
                    systemUser.setPassword("$2a$10$dummyHashedPassword"); // Dummy password, never used for login
                    systemUser.setRole(User.UserRole.ADMIN);
                    systemUser.setStatus(User.UserStatus.ACTIVE);
                    return userRepository.save(systemUser);
                });
    }

    private Invoice convertToEntity(InvoiceDTO dto) {
        Invoice invoice = new Invoice();
        invoice.setId(dto.getId());
        invoice.setInvoiceNumber(dto.getInvoiceNumber());

        // Customer Information
        invoice.setProjectName(dto.getProjectName());
        invoice.setCustomerName(dto.getCustomerName());
        invoice.setCustomerPhone(dto.getCustomerPhone());
        invoice.setReference(dto.getReference());

        if (dto.getLeadSource() != null) {
            invoice.setLeadSource(Invoice.LeadSource.fromString(dto.getLeadSource()));
        }

        // Financial Details
        invoice.setAmount(dto.getAmount());
        invoice.setTax(dto.getTax());
        invoice.setTotalAmount(dto.getTotalAmount());

        // Payment Breakdown
        invoice.setTokenAmount(dto.getTokenAmount());
        invoice.setAgreementAmount(dto.getAgreementAmount());
        invoice.setRegistrationAmount(dto.getRegistrationAmount());
        invoice.setAgreementDueDate(dto.getAgreementDueDate());
        invoice.setAgreementDueAmount(dto.getAgreementDueAmount());
        invoice.setRegistrationDueDate(dto.getRegistrationDueDate());
        invoice.setRegistrationDueAmount(dto.getRegistrationDueAmount());

        // Status and Type
        invoice.setStatus(dto.getStatus());
        invoice.setInvoiceType(dto.getInvoiceType());

        // Dates
        invoice.setInvoiceDate(dto.getInvoiceDate());
        invoice.setDueDate(dto.getDueDate());

        // Additional Information
        invoice.setNotes(dto.getNotes());
        
        try {
            if (dto.getLineItems() != null) {
                invoice.setLineItems(objectMapper.writeValueAsString(dto.getLineItems()));
            }
            
            if (dto.getAttachments() != null) {
                invoice.setAttachments(objectMapper.writeValueAsString(dto.getAttachments()));
            }
        } catch (JsonProcessingException e) {
            log.error("Error serializing JSON fields", e);
            // Fallback to empty string or null
        }

        return invoice;
    }

    private InvoiceDTO convertToDTO(Invoice invoice) {
        InvoiceDTO dto = new InvoiceDTO();
        dto.setId(invoice.getId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());

        // Customer Information
        dto.setProjectName(invoice.getProjectName());
        dto.setCustomerName(invoice.getCustomerName());
        dto.setCustomerPhone(invoice.getCustomerPhone());
        dto.setReference(invoice.getReference());

        if (invoice.getLeadSource() != null) {
            dto.setLeadSource(invoice.getLeadSource().getDisplayName());
        }

        // Financial Details
        dto.setAmount(invoice.getAmount());
        dto.setTax(invoice.getTax());
        dto.setTotalAmount(invoice.getTotalAmount());

        // Payment Breakdown
        dto.setTokenAmount(invoice.getTokenAmount());
        dto.setAgreementAmount(invoice.getAgreementAmount());
        dto.setRegistrationAmount(invoice.getRegistrationAmount());
        dto.setAgreementDueDate(invoice.getAgreementDueDate());
        dto.setAgreementDueAmount(invoice.getAgreementDueAmount());
        dto.setRegistrationDueDate(invoice.getRegistrationDueDate());
        dto.setRegistrationDueAmount(invoice.getRegistrationDueAmount());

        // Status and Type
        dto.setStatus(invoice.getStatus());
        dto.setInvoiceType(invoice.getInvoiceType());

        // Dates
        dto.setInvoiceDate(invoice.getInvoiceDate());
        dto.setDueDate(invoice.getDueDate());

        // Additional Information
        dto.setNotes(invoice.getNotes());
        
        try {
            if (invoice.getLineItems() != null) {
                dto.setLineItems(objectMapper.readTree(invoice.getLineItems()));
            }
            if (invoice.getAttachments() != null) {
                dto.setAttachments(objectMapper.readTree(invoice.getAttachments()));
            }
        } catch (JsonProcessingException e) {
            log.warn("Error parsing JSON fields for invoice {}: {}", invoice.getId(), e.getMessage());
            // Fallback to raw string if parsing fails - but we need JsonNode
            // So we'll try to create a text node or just leave it null
            try {
                if (invoice.getLineItems() != null) {
                    dto.setLineItems(objectMapper.valueToTree(invoice.getLineItems()));
                }
                if (invoice.getAttachments() != null) {
                    dto.setAttachments(objectMapper.valueToTree(invoice.getAttachments()));
                }
            } catch (Exception ex) {
                // Ignore
            }
        }

        // Audit Information
        try {
            if (invoice.getCreatedBy() != null) {
                dto.setCreatedById(invoice.getCreatedBy().getId());
                dto.setCreatedByName(invoice.getCreatedBy().getName());
            }
        } catch (Exception e) {
            log.warn("Failed to load createdBy information for invoice {}: {}", invoice.getId(), e.getMessage());
        }
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
