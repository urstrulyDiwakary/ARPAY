# Expense Database Integration Guide

## Overview
The expense system has been updated to use a proper database backend instead of localStorage. All expenses are now persisted in the database with proper validation and error handling.

## Frontend Changes

### 1. API Endpoints Updated
The frontend now calls the following REST API endpoints:

```
GET    /api/expenses              - Fetch all expenses
POST   /api/expenses              - Create new expense
PUT    /api/expenses/{id}         - Update existing expense
DELETE /api/expenses/{id}         - Delete expense
```

### 2. Error Handling & Logging
- All mutations now include comprehensive error handling
- Console logs show what's being sent/received
- Toast notifications display success/error messages
- Failed operations show detailed error messages from backend

### 3. Data Flow

#### Creating an Expense
```
1. User clicks "Add Expense"
   ↓
2. Dialog opens with auto-generated Expense No (AR-EXP-001)
   ↓
3. User fills form fields
   ↓
4. User clicks "Save"
   ↓
5. handleSubmit() packages formData
   ↓
6. createMutation calls expenseApi.create(formData)
   ↓
7. Frontend POSTs to /api/expenses with expense data
   ↓
8. Backend validates and saves to database
   ↓
9. Backend returns created expense with generated ID
   ↓
10. Frontend displays success message
   ↓
11. Expenses list refreshed from database
```

#### Fetching Expenses
```
1. ExpensesPage loads
   ↓
2. useQuery hook calls expenseApi.getAll()
   ↓
3. Frontend GETs from /api/expenses
   ↓
4. Backend queries database and returns all expenses
   ↓
5. Frontend transforms and displays expenses
```

## Backend Implementation Required

### 1. Database Schema (Expense Table)

```sql
CREATE TABLE expenses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,  -- AR-EXP-001, etc
    category VARCHAR(50) NOT NULL,                -- TRAVEL, OFFICE, etc
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL,                 -- PENDING, APPROVED, REJECTED
    payment_mode VARCHAR(50),                    -- CASH, CARD, BANK_TRANSFER, UPI
    project_name VARCHAR(255),
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Spring Boot Controller

```java
@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<?> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody ExpenseDTO expenseDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(expenseService.createExpense(expenseDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(
        @PathVariable Long id,
        @RequestBody ExpenseDTO expenseDTO) {
        return ResponseEntity.ok(expenseService.updateExpense(id, expenseDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 3. Expense Entity

```java
@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Expense {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String invoiceNumber;  // AR-EXP-001
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(nullable = false)
    private String status;  // PENDING, APPROVED, REJECTED
    
    private String paymentMode;  // CASH, CARD, BANK_TRANSFER, UPI
    
    private String projectName;
    
    @Column(columnDefinition = "JSON")
    private String attachments;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

### 4. Expense Service

```java
@Service
@Transactional
public class ExpenseService {
    
    @Autowired
    private ExpenseRepository expenseRepository;
    
    public List<ExpenseDTO> getAllExpenses() {
        return expenseRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public ExpenseDTO createExpense(ExpenseDTO dto) {
        Expense expense = new Expense();
        expense.setInvoiceNumber(dto.getInvoiceNumber());
        expense.setCategory(dto.getCategory());
        expense.setAmount(dto.getAmount());
        expense.setDate(dto.getDate());
        expense.setNotes(dto.getNotes());
        expense.setStatus(dto.getStatus());
        expense.setPaymentMode(dto.getPaymentMode());
        expense.setProjectName(dto.getProjectName());
        expense.setAttachments(dto.getAttachments());
        
        Expense saved = expenseRepository.save(expense);
        return convertToDTO(saved);
    }
    
    public ExpenseDTO updateExpense(Long id, ExpenseDTO dto) {
        Expense expense = expenseRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Expense not found"));
        
        // Update only non-null fields
        if (dto.getCategory() != null) expense.setCategory(dto.getCategory());
        if (dto.getAmount() != null) expense.setAmount(dto.getAmount());
        if (dto.getDate() != null) expense.setDate(dto.getDate());
        if (dto.getNotes() != null) expense.setNotes(dto.getNotes());
        if (dto.getStatus() != null) expense.setStatus(dto.getStatus());
        if (dto.getPaymentMode() != null) expense.setPaymentMode(dto.getPaymentMode());
        if (dto.getProjectName() != null) expense.setProjectName(dto.getProjectName());
        
        Expense updated = expenseRepository.save(expense);
        return convertToDTO(updated);
    }
    
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
    
    private ExpenseDTO convertToDTO(Expense expense) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(expense.getId());
        dto.setInvoiceNumber(expense.getInvoiceNumber());
        // ... map other fields
        return dto;
    }
}
```

### 5. Expense DTO

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDTO {
    private Long id;
    private String invoiceNumber;
    private String category;
    private BigDecimal amount;
    private LocalDate date;
    private String notes;
    private String status;
    private String paymentMode;
    private String projectName;
    private String attachments;
}
```

### 6. Expense Repository

```java
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    Optional<Expense> findByInvoiceNumber(String invoiceNumber);
    List<Expense> findByStatus(String status);
    List<Expense> findByProjectName(String projectName);
}
```

## Frontend Frontend API Configuration

The frontend expects:
- Base URL: `http://localhost:8080/api`
- All responses should return the expense object or list
- Error responses should include meaningful error messages
- HTTP Status Codes:
  - 200: Success (GET, PUT)
  - 201: Created (POST)
  - 204: No Content (DELETE)
  - 400: Bad Request
  - 404: Not Found
  - 500: Server Error

## Testing the Integration

### 1. Check Console Logs
- Open browser DevTools (F12)
- Check Console tab for API calls and responses
- Look for "Creating expense:", "Updating expense:", etc logs

### 2. Verify Database Storage
```sql
-- Check if expenses are being stored
SELECT * FROM expenses;

-- Check expense numbers
SELECT invoice_number, category, amount FROM expenses ORDER BY id DESC;
```

### 3. Test Each Operation

**Create Expense:**
- Click "Add Expense" button
- Fill in all fields
- Click "Save"
- Check console for POST request
- Check database for new record

**Update Expense:**
- Click "Edit" on an expense
- Change any field
- Click "Save"
- Check console for PUT request
- Verify database update

**Delete Expense:**
- Click "Delete" on an expense
- Confirm deletion
- Check console for DELETE request
- Verify database deletion

**Fetch Expenses:**
- Refresh page
- Check console for GET request
- Verify expenses display correctly

## Troubleshooting

### Expenses Not Saving
1. Check browser console for error messages
2. Check backend logs for exception details
3. Verify database connection is working
4. Ensure all required fields are provided

### API 404 Errors
- Verify backend is running on port 8080
- Check endpoint URLs match exactly
- Verify CORS is enabled in backend

### Data Not Displaying
1. Check that GET /api/expenses returns data
2. Verify transformation of attachments JSON
3. Check for JavaScript errors in console

### Duplicate Entries
- Verify database constraints are properly set
- Check invoice_number uniqueness constraint
- Review transaction handling in service layer

## Important Notes

✅ **Database Priority**: All operations now primarily use the database
✅ **Error Handling**: All mutations include try-catch and error reporting
✅ **Logging**: Console logs help debug API calls
✅ **Auto-Generated Numbers**: Expense numbers are generated on frontend before saving
✅ **No Fallback**: Unlike before, there's NO localStorage fallback - backend errors will be reported to user


