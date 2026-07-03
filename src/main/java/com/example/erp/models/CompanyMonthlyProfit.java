package com.example.erp.models;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "company_monthly_profits",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_company_monthly_profit_period",
                columnNames = {"company_id", "profit_year", "profit_month"}
        )
)
public class CompanyMonthlyProfit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "profit_year", nullable = false)
    private Integer profitYear;

    @Column(name = "profit_month", nullable = false)
    private Integer profitMonth;

    @Column(name = "gross_profit", nullable = false, precision = 19, scale = 2)
    private BigDecimal grossProfit;

    public Long getId() {
        return id;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Integer getProfitYear() {
        return profitYear;
    }

    public void setProfitYear(Integer profitYear) {
        this.profitYear = profitYear;
    }

    public Integer getProfitMonth() {
        return profitMonth;
    }

    public void setProfitMonth(Integer profitMonth) {
        this.profitMonth = profitMonth;
    }

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public void setGrossProfit(BigDecimal grossProfit) {
        this.grossProfit = grossProfit;
    }
}
