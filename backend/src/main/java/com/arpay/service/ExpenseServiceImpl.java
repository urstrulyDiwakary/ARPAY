package com.arpay.service;

import com.arpay.dto.ExpenseDTO;
import com.arpay.dto.PageResponse;
import com.arpay.entity.Expense;
import com.arpay.entity.User;
import com.arpay.repository.ExpenseRepository;
import com.arpay.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class ExpenseServiceImpl implements ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ExpenseDTO createExpense(ExpenseDTO expenseDTO) {
        log.info("Creating expense with invoice number: {}", expenseDTO.getInvoiceNumber());

        Expense expense = new Expense();
        expense.setId(UUID.randomUUID());
        expense.setInvoiceNumber(expenseDTO.getInvoiceNumber());
        expense.setTitle(expenseDTO.getTitle() != null ? expenseDTO.getTitle() : "Expense");
        expense.setCategory(Expense.ExpenseCategory.fromString(expenseDTO.getCategory()));
        expense.setAmount(expenseDTO.getAmount());
        expense.setExpenseDate(expenseDTO.getDate());
        expense.setNotes(expenseDTO.getNotes());
        expense.setStatus(Expense.ExpenseStatus.fromString(expenseDTO.getStatus()));

        if (expenseDTO.getPaymentMode() != null) {
            expense.setPaymentMode(Expense.PaymentMode.fromString(expenseDTO.getPaymentMode()));
        }

        expense.setProjectName(expenseDTO.getProjectName());
        expense.setProperty(expenseDTO.getProperty());

        // Convert attachments list to JSON string
        if (expenseDTO.getAttachments() != null && !expenseDTO.getAttachments().isEmpty()) {
            try {
                expense.setAttachments(objectMapper.writeValueAsString(expenseDTO.getAttachments()));
            } catch (Exception e) {
                log.error("Error converting attachments to JSON", e);
                expense.setAttachments("[]");
            }
        } else {
            expense.setAttachments("[]");
        }

        // Set a default user (can be modified based on authentication)
        User defaultUser = userRepository.findAll().stream().findFirst().orElse(null);
        if (defaultUser != null) {
            expense.setPaidBy(defaultUser);
        }

        Expense saved = expenseRepository.save(expense);
        log.info("Expense created successfully with ID: {}", saved.getId());
        return convertToDTO(saved);
    }

    @Override
    public ExpenseDTO updateExpense(UUID id, ExpenseDTO expenseDTO) {
        log.info("Updating expense with ID: {}", id);

        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with ID: " + id));

        if (expenseDTO.getCategory() != null) {
            expense.setCategory(Expense.ExpenseCategory.fromString(expenseDTO.getCategory()));
        }
        if (expenseDTO.getAmount() != null) {
            expense.setAmount(expenseDTO.getAmount());
        }
        if (expenseDTO.getDate() != null) {
            expense.setExpenseDate(expenseDTO.getDate());
        }
        if (expenseDTO.getNotes() != null) {
            expense.setNotes(expenseDTO.getNotes());
        }
        if (expenseDTO.getStatus() != null) {
            expense.setStatus(Expense.ExpenseStatus.fromString(expenseDTO.getStatus()));
        }
        if (expenseDTO.getPaymentMode() != null) {
            expense.setPaymentMode(Expense.PaymentMode.fromString(expenseDTO.getPaymentMode()));
        }
        if (expenseDTO.getProjectName() != null) {
            expense.setProjectName(expenseDTO.getProjectName());
        }
        if (expenseDTO.getProperty() != null) {
            expense.setProperty(expenseDTO.getProperty());
        }
        if (expenseDTO.getAttachments() != null) {
            try {
                expense.setAttachments(objectMapper.writeValueAsString(expenseDTO.getAttachments()));
            } catch (Exception e) {
                log.error("Error converting attachments to JSON", e);
            }
        }

        Expense updated = expenseRepository.save(expense);
        log.info("Expense updated successfully");
        return convertToDTO(updated);
    }

    @Override
    public ExpenseDTO getExpenseById(UUID id) {
        log.info("Fetching expense with ID: {}", id);
        return expenseRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Override
    public PageResponse<ExpenseDTO> getAllExpenses(int page, int size, String sortBy, String sortDir) {
        log.info("Fetching all expenses - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Expense> expensePage = expenseRepository.findAll(pageable);
        List<ExpenseDTO> dtoList = expensePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResponse<ExpenseDTO> response = new PageResponse<>();
        response.setContent(dtoList);
        response.setPageNumber(expensePage.getNumber());
        response.setPageSize(expensePage.getSize());
        response.setTotalElements(expensePage.getTotalElements());
        response.setTotalPages(expensePage.getTotalPages());
        response.setLast(expensePage.isLast());
        return response;
    }

    @Override
    public PageResponse<ExpenseDTO> getExpensesByCategory(Expense.ExpenseCategory category, int page, int size) {
        log.info("Fetching expenses by category: {}", category);

        Pageable pageable = PageRequest.of(page, size);
        Page<Expense> expensePage = expenseRepository.findByCategory(category, pageable);
        List<ExpenseDTO> dtoList = expensePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResponse<ExpenseDTO> response = new PageResponse<>();
        response.setContent(dtoList);
        response.setPageNumber(expensePage.getNumber());
        response.setPageSize(expensePage.getSize());
        response.setTotalElements(expensePage.getTotalElements());
        response.setTotalPages(expensePage.getTotalPages());
        response.setLast(expensePage.isLast());
        return response;
    }

    @Override
    public PageResponse<ExpenseDTO> getExpensesByStatus(Expense.ExpenseStatus status, int page, int size) {
        log.info("Fetching expenses by status: {}", status);

        Pageable pageable = PageRequest.of(page, size);
        Page<Expense> expensePage = expenseRepository.findByStatus(status, pageable);
        List<ExpenseDTO> dtoList = expensePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResponse<ExpenseDTO> response = new PageResponse<>();
        response.setContent(dtoList);
        response.setPageNumber(expensePage.getNumber());
        response.setPageSize(expensePage.getSize());
        response.setTotalElements(expensePage.getTotalElements());
        response.setTotalPages(expensePage.getTotalPages());
        response.setLast(expensePage.isLast());
        return response;
    }

    @Override
    public PageResponse<ExpenseDTO> searchExpenses(String search, int page, int size) {
        log.info("Searching expenses with keyword: {}", search);

        // Using findAll and filtering
        List<Expense> allExpenses = expenseRepository.findAll();
        List<ExpenseDTO> dtoList = allExpenses.stream()
                .filter(e -> e.getNotes() != null && e.getNotes().contains(search))
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResponse<ExpenseDTO> response = new PageResponse<>();
        response.setContent(dtoList);
        response.setPageNumber(page);
        response.setPageSize(size);
        response.setTotalElements(dtoList.size());
        response.setTotalPages(1);
        response.setLast(true);
        return response;
    }

    @Override
    public List<ExpenseDTO> getExpensesByDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Fetching expenses between {} and {}", startDate, endDate);
        return expenseRepository.findByExpenseDateBetween(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteExpense(UUID id) {
        log.info("Deleting expense with ID: {}", id);
        if (!expenseRepository.existsById(id)) {
            throw new RuntimeException("Expense not found with ID: " + id);
        }
        expenseRepository.deleteById(id);
        log.info("Expense deleted successfully");
    }

    @Override
    public BigDecimal getTotalAmountByStatus(Expense.ExpenseStatus status) {
        log.info("Getting total amount for status: {}", status);
        return expenseRepository.findByStatus(status, null).getContent().stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public BigDecimal getTotalAmountByCategory(Expense.ExpenseCategory category) {
        log.info("Getting total amount for category: {}", category);
        return expenseRepository.findByCategory(category, null).getContent().stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public long countByStatus(Expense.ExpenseStatus status) {
        log.info("Counting expenses by status: {}", status);
        return expenseRepository.findByStatus(status, null).getTotalElements();
    }

    /**
     * Convert Expense entity to DTO
     */
    private ExpenseDTO convertToDTO(Expense expense) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(expense.getId());
        dto.setInvoiceNumber(expense.getInvoiceNumber());
        dto.setCategory(expense.getCategory().name());
        dto.setAmount(expense.getAmount());
        dto.setDate(expense.getExpenseDate());
        dto.setNotes(expense.getNotes());
        dto.setStatus(expense.getStatus().name());

        if (expense.getPaymentMode() != null) {
            dto.setPaymentMode(expense.getPaymentMode().name());
        }

        dto.setProjectName(expense.getProjectName());
        dto.setProperty(expense.getProperty());

        // Convert attachments JSON string to list
        if (expense.getAttachments() != null && !expense.getAttachments().isEmpty() && !expense.getAttachments().equals("[]")) {
            try {
                List<ExpenseDTO.AttachmentDTO> attachments = objectMapper.readValue(
                    expense.getAttachments(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ExpenseDTO.AttachmentDTO.class)
                );
                dto.setAttachments(attachments);
            } catch (Exception e) {
                log.error("Error parsing attachments JSON", e);
                dto.setAttachments(List.of());
            }
        } else {
            dto.setAttachments(List.of());
        }

        return dto;
    }
}

