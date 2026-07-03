package com.example.erp.models;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "company_monthly_jobs")
public class CompanyMonthlyJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "job_year", nullable = false)
    private Integer jobYear;

    @Column(name = "job_month", nullable = false)
    private Integer jobMonth;

    @Column(name = "job_name", nullable = false)
    private String jobName;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    public Long getId() { return id; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Integer getJobYear() { return jobYear; }
    public void setJobYear(Integer jobYear) { this.jobYear = jobYear; }
    public Integer getJobMonth() { return jobMonth; }
    public void setJobMonth(Integer jobMonth) { this.jobMonth = jobMonth; }
    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
