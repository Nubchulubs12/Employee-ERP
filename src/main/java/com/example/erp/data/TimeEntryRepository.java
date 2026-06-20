package com.example.erp.data;

import com.example.erp.models.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    List<TimeEntry> findByEmployeeIdOrderByClockInTimeDesc(Long employeeId);

    Optional<TimeEntry> findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(Long employeeId);

    boolean existsByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);
}
