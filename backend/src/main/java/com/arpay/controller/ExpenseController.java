package com.arpay.controller;

import com.arpay.dto.ExpenseDTO;
import com.arpay.entity.Expense;
import com.arpay.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    /**
     * Get all expenses
     */
    @GetMapping
    public ResponseEntity<?> getAllExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            com.arpay.dto.PageResponse<?> expenses = expenseService.getAllExpenses(page, size, sortBy, sortDir);
            return ResponseEntity.ok(expenses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch expenses", e.getMessage()));
        }
    }

    /**
     * Get expense by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable UUID id) {
        try {
            ExpenseDTO expense = expenseService.getExpenseById(id);
            if (expense != null) {
                return ResponseEntity.ok(expense);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Expense not found", "ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error fetching expense", e.getMessage()));
        }
    }

    /**
     * Create new expense
     */
    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody ExpenseDTO expenseDTO) {
        try {
            ExpenseDTO createdExpense = expenseService.createExpense(expenseDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Failed to create expense", e.getMessage()));
        }
    }

    /**
     * Update existing expense
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable UUID id, @RequestBody ExpenseDTO expenseDTO) {
        try {
            ExpenseDTO updatedExpense = expenseService.updateExpense(id, expenseDTO);
            if (updatedExpense != null) {
                return ResponseEntity.ok(updatedExpense);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Expense not found", "ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Failed to update expense", e.getMessage()));
        }
    }

    /**
     * Delete expense
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable UUID id) {
        try {
            expenseService.deleteExpense(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("Failed to delete expense", e.getMessage()));
        }
    }

    /**
     * Get expenses by status
     */
    @GetMapping("/by-status/{status}")
    public ResponseEntity<?> getExpensesByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Expense.ExpenseStatus expenseStatus = Expense.ExpenseStatus.fromString(status);
            com.arpay.dto.PageResponse<?> expenses = expenseService.getExpensesByStatus(expenseStatus, page, size);
            return ResponseEntity.ok(expenses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch expenses by status", e.getMessage()));
        }
    }

    /**
     * Get expenses by category
     */
    @GetMapping("/by-category/{category}")
    public ResponseEntity<?> getExpensesByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Expense.ExpenseCategory expenseCategory = Expense.ExpenseCategory.fromString(category);
            com.arpay.dto.PageResponse<?> expenses = expenseService.getExpensesByCategory(expenseCategory, page, size);
            return ResponseEntity.ok(expenses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch expenses by category", e.getMessage()));
        }
    }


    /**
     * Helper method to create error response
     */
    private Map<String, Object> createErrorResponse(String message, String details) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("message", message);
        errorResponse.put("error", details);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return errorResponse;
    }
}

