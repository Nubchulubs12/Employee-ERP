package com.example.erp.controller;

import com.example.erp.Dto.TimeEntryDto;
import com.example.erp.services.TimeEntryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.erp.Dto.UpdateTimeEntryRequest;
import java.util.List;

@RestController
@RequestMapping("/api/time")
@CrossOrigin(origins = {"http://localhost:5173","https://employee-erps.onrender.com"})
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    public TimeEntryController(TimeEntryService timeEntryService) {
        this.timeEntryService = timeEntryService;
    }

    @PostMapping("/employees/{employeeId}/clock-in")
    public ResponseEntity<TimeEntryDto> clockIn(@PathVariable Long employeeId) {
        return ResponseEntity.ok(timeEntryService.clockIn(employeeId));
    }

    @PostMapping("/employees/{employeeId}/clock-out")
    public ResponseEntity<TimeEntryDto> clockOut(@PathVariable Long employeeId) {
        return ResponseEntity.ok(timeEntryService.clockOut(employeeId));
    }
    @PutMapping("/entries/{entryId}")
    public ResponseEntity<TimeEntryDto> updateTimeEntry(
            @PathVariable Long entryId,
            @RequestBody UpdateTimeEntryRequest request
    ) {
        return ResponseEntity.ok(timeEntryService.updateTimeEntry(entryId, request));
    }

    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<List<TimeEntryDto>> getEmployeeEntries(@PathVariable Long employeeId) {
        return ResponseEntity.ok(timeEntryService.getEntriesForEmployee(employeeId));
    }
}