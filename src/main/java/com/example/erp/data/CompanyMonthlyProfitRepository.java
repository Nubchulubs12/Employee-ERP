package com.example.erp.data;

import com.example.erp.models.CompanyMonthlyProfit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyMonthlyProfitRepository extends JpaRepository<CompanyMonthlyProfit, Long> {
    List<CompanyMonthlyProfit> findByCompanyIdAndProfitYearOrderByProfitMonthAsc(Long companyId, Integer profitYear);

    Optional<CompanyMonthlyProfit> findByCompanyIdAndProfitYearAndProfitMonth(
            Long companyId,
            Integer profitYear,
            Integer profitMonth
    );
}
