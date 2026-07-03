package com.example.erp.data;

import com.example.erp.models.CommissionEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CommissionEntryRepository extends JpaRepository<CommissionEntry, Long> {
    List<CommissionEntry> findByCompanyIdOrderByDateEarnedDescIdDesc(Long companyId);
    List<CommissionEntry> findByCompanyIdAndDateEarnedBetweenOrderByDateEarnedAscIdAsc(
            Long companyId, LocalDate startDate, LocalDate endDate);
    List<CommissionEntry> findByEmployeeIdOrderByDateEarnedDescIdDesc(Long employeeId);
    List<CommissionEntry> findByEmployeeIdAndDateEarnedBetweenOrderByDateEarnedAscIdAsc(
            Long employeeId, LocalDate startDate, LocalDate endDate);
}
