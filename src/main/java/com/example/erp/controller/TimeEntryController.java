package com.example.erp.controller;

import com.example.erp.models.Employee;
import com.example.erp.models.TimeEntry;
import com.example.erp.services.EmployeeService;
import com.example.erp.services.TimeEntryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@RestController @RequestMapping("/api/time-entries")
public class TimeEntryController {
    private final TimeEntryService timeSvc;
    private final EmployeeService empSvc;

    public TimeEntryController(TimeEntryService timeSvc, EmployeeService empSvc) {
        this.timeSvc = timeSvc; this.empSvc = empSvc;
    }

    @PostMapping("/{employeeId}/clock-in")
    public ResponseEntity<?> clockIn(@PathVariable Long employeeId) {
        Employee e = empSvc.findById(employeeId).orElse(null);
        if (e == null) return ResponseEntity.notFound().build();
        TimeEntry te = timeSvc.clockIn(e, LocalDateTime.now());
        return ResponseEntity.ok(te);
    }

    @PostMapping("/{employeeId}/clock-out")
    public ResponseEntity<?> clockOut(@PathVariable Long employeeId) {
        return timeSvc.clockOut(employeeId, LocalDateTime.now())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.badRequest().body("No open clock-in found."));
    }

    @GetMapping("/{employeeId}/weekly")
    public ResponseEntity<?> weekly(@PathVariable Long employeeId,
                                    @RequestParam(required=false) String weekOf) {
        Employee e = empSvc.findById(employeeId).orElse(null);
        if (e == null) return ResponseEntity.notFound().build();

        LocalDate today = LocalDate.now();
        LocalDate monday = (weekOf != null) ? LocalDate.parse(weekOf)
                : today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        List<TimeEntry> entries = timeSvc.weeklyEntries(employeeId, monday);

        Map<LocalDate, Double> byDayHours = new HashMap<>();
        double total = 0.0;

        for (TimeEntry te : entries) {
            var in = te.getClockIn();
            var out = te.getClockOut() != null ? te.getClockOut() : LocalDateTime.now();
            if (out.isBefore(in)) continue;
            double hrs = Duration.between(in, out).toMinutes()/60.0;
            LocalDate day = in.toLocalDate();
            if (day.getDayOfWeek().getValue() >= 1 && day.getDayOfWeek().getValue() <= 5) {
                byDayHours.merge(day, hrs, Double::sum);
                total += hrs;
            }
        }

        Map<String,Object> result = new HashMap<>();
        result.put("weekStartMonday", monday);
        result.put("perDayHours", byDayHours);
        result.put("totalHours", Math.round(total*100.0)/100.0);
        return ResponseEntity.ok(result);
    }
}
