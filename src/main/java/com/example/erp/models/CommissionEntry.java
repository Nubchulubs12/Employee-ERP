package com.example.erp.models;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "commission_entries", indexes = {
        @Index(name = "idx_commission_company_date", columnList = "company_id,date_earned"),
        @Index(name = "idx_commission_employee_date", columnList = "employee_id,date_earned")
})
public class CommissionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "date_earned", nullable = false)
    private LocalDate dateEarned;

    @Column(length = 2000)
    private String notes;

    public Long getId() { return id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDateEarned() { return dateEarned; }
    public void setDateEarned(LocalDate dateEarned) { this.dateEarned = dateEarned; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
