package com.example.erp.services;

import com.example.erp.Dto.TimeEntryDto;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.data.TimeEntryRepository;
import com.example.erp.models.Employee;
import com.example.erp.models.TimeEntry;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;
    private final EmployeeRepository employeeRepository;

    public TimeEntryService(TimeEntryRepository timeEntryRepository, EmployeeRepository employeeRepository) {
        this.timeEntryRepository = timeEntryRepository;
        this.employeeRepository = employeeRepository;
    }

    public TimeEntryDto clockIn(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        boolean alreadyClockedIn = timeEntryRepository
                .findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(employeeId)
                .isPresent();

        if (alreadyClockedIn) {
            throw new RuntimeException("Employee is already clocked in.");
        }

        ZoneId zone = ZoneId.of("America/Chicago");
        LocalDateTime now = LocalDateTime.now(zone);
        System.out.println("CLOCK IN DEBUG");
        System.out.println("ZONE: " + zone);
        System.out.println("NOW: " + now);
        TimeEntry entry = new TimeEntry();
        entry.setEmployee(employee);
        entry.setWorkDate(now.toLocalDate());
        entry.setClockInTime(now);

        return toDto(timeEntryRepository.save(entry));
    }

    public TimeEntryDto clockOut(Long employeeId) {
        TimeEntry entry = timeEntryRepository
                .findFirstByEmployeeIdAndClockOutTimeIsNullOrderByClockInTimeDesc(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee is not currently clocked in."));

        ZoneId zone = ZoneId.of("America/Chicago");
        LocalDateTime now = LocalDateTime.now(zone);

        entry.setClockOutTime(now);

        return toDto(timeEntryRepository.save(entry));
    }

    public List<TimeEntryDto> getEntriesForEmployee(Long employeeId) {
        return timeEntryRepository.findByEmployeeIdOrderByClockInTimeDesc(employeeId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private TimeEntryDto toDto(TimeEntry entry) {
        return new TimeEntryDto(
                entry.getId(),
                entry.getWorkDate(),
                entry.getClockInTime(),
                entry.getClockOutTime()
        );
    }
}