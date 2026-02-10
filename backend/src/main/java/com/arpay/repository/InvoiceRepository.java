package com.arpay.repository;

import com.arpay.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    Page<Invoice> findByStatus(Invoice.InvoiceStatus status, Pageable pageable);

    Page<Invoice> findByInvoiceType(Invoice.InvoiceType invoiceType, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.status = :status AND i.invoiceType = :type")
    Page<Invoice> findByStatusAndType(@Param("status") Invoice.InvoiceStatus status,
                                      @Param("type") Invoice.InvoiceType type,
                                      Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.invoiceDate BETWEEN :startDate AND :endDate")
    List<Invoice> findByInvoiceDateBetween(@Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    @Query("SELECT i FROM Invoice i WHERE i.dueDate < :currentDate AND i.status != 'PAID'")
    List<Invoice> findOverdueInvoices(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.status = :status")
    BigDecimal sumTotalAmountByStatus(@Param("status") Invoice.InvoiceStatus status);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status")
    long countByStatus(@Param("status") Invoice.InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE " +
           "LOWER(i.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Invoice> searchInvoices(@Param("search") String search, Pageable pageable);

    @Query(value = "SELECT generate_invoice_number()", nativeQuery = true)
    String generateInvoiceNumber();
}

