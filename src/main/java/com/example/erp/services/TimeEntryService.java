package com.example.erp.services;

import com.example.erp.data.TimeEntryRepository;
import com.example.erp.models.Employee;
import com.example.erp.models.TimeEntry;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.List;
import java.util.Optional;

@Service
public class TimeEntryService {
    private final TimeEntryRepository repo;
    public TimeEntryService(TimeEntryRepository repo) { this.repo = repo; }

    public TimeEntry clockIn(Employee e, LocalDateTime when) {
        Optional<TimeEntry> open = repo.findFirstByEmployeeIdAndClockOutIsNullOrderByClockInDesc(e.getId());
        if (open.isPresent()) return open.get(); // silently reuse open shift
        TimeEntry te = new TimeEntry();
        te.setEmployee(e);
        te.setClockIn(when);
        return repo.save(te);
    }

    public Optional<TimeEntry> clockOut(Long employeeId, LocalDateTime when) {
        Optional<TimeEntry> open = repo.findFirstByEmployeeIdAndClockOutIsNullOrderByClockInDesc(employeeId);
        if (open.isEmpty()) return Optional.empty();
        TimeEntry te = open.get();
        te.setClockOut(when);
        return Optional.of(repo.save(te));
    }

    public List<TimeEntry> weeklyEntries(Long employeeId, LocalDate monday) {
        LocalDateTime start = monday.atStartOfDay();
        LocalDateTime end = monday.plusDays(5).atTime(LocalTime.MAX); // Mon..Fri
        return repo.findByEmployeeIdAndClockInBetween(employeeId, start, end);
    }
}
