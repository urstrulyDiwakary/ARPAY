package com.arpay.repository;

import com.arpay.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    Page<Expense> findByCategory(Expense.ExpenseCategory category, Pageable pageable);

    Page<Expense> findByStatus(Expense.ExpenseStatus status, Pageable pageable);

    Page<Expense> findByPaidById(UUID userId, Pageable pageable);

    @Query("SELECT e FROM Expense e WHERE e.expenseDate BETWEEN :startDate AND :endDate")
    List<Expense> findByExpenseDateBetween(@Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM Expense e WHERE e.category = :category AND e.status = :status")
    Page<Expense> findByCategoryAndStatus(@Param("category") Expense.ExpenseCategory category,
                                          @Param("status") Expense.ExpenseStatus status,
                                          Pageable pageable);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") Expense.ExpenseStatus status);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.category = :category")
    BigDecimal sumAmountByCategory(@Param("category") Expense.ExpenseCategory category);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.status = :status")
    long countByStatus(@Param("status") Expense.ExpenseStatus status);

    @Query("SELECT e FROM Expense e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Expense> searchExpenses(@Param("search") String search, Pageable pageable);
}

