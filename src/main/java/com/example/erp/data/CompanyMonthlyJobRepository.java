package com.example.erp.data;

import com.example.erp.models.CompanyMonthlyJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyMonthlyJobRepository extends JpaRepository<CompanyMonthlyJob, Long> {
    List<CompanyMonthlyJob> findByCompanyIdAndJobYearOrderByJobMonthAscIdAsc(Long companyId, Integer jobYear);
    Optional<CompanyMonthlyJob> findByIdAndCompanyId(Long id, Long companyId);
}
