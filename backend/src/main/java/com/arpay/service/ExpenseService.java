package com.arpay.service;

import com.arpay.dto.ExpenseDTO;
import com.arpay.dto.PageResponse;
import com.arpay.entity.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ExpenseService {
    ExpenseDTO createExpense(ExpenseDTO expenseDTO);
    ExpenseDTO updateExpense(UUID id, ExpenseDTO expenseDTO);
    ExpenseDTO getExpenseById(UUID id);
    PageResponse<ExpenseDTO> getAllExpenses(int page, int size, String sortBy, String sortDir);
    PageResponse<ExpenseDTO> getExpensesByCategory(Expense.ExpenseCategory category, int page, int size);
    PageResponse<ExpenseDTO> getExpensesByStatus(Expense.ExpenseStatus status, int page, int size);
    PageResponse<ExpenseDTO> searchExpenses(String search, int page, int size);
    List<ExpenseDTO> getExpensesByDateRange(LocalDate startDate, LocalDate endDate);
    void deleteExpense(UUID id);
    BigDecimal getTotalAmountByStatus(Expense.ExpenseStatus status);
    BigDecimal getTotalAmountByCategory(Expense.ExpenseCategory category);
    long countByStatus(Expense.ExpenseStatus status);
}

