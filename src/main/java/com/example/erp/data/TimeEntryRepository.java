package com.example.erp.data;

import com.example.erp.models.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    List<TimeEntry> findByEmployeeIdAndClockInBetween(Long employeeId, LocalDateTime start, LocalDateTime end);
    Optional<TimeEntry> findFirstByEmployeeIdAndClockOutIsNullOrderByClockInDesc(Long employeeId);
}
