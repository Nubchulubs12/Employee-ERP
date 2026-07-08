package com.example.erp.services;

import com.example.erp.Dto.TimeEntryDto;
import com.example.erp.Dto.UpdateTimeEntryRequest;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.data.TimeEntryRepository;
import com.example.erp.models.Employee;
import com.example.erp.models.TimeEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeEntryServiceTest {

    @Mock
    private TimeEntryRepository timeEntryRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private CompanyService companyService;

    private TimeEntryService timeEntryService;

    @BeforeEach
    void setUp() {
        timeEntryService = new TimeEntryService(timeEntryRepository, employeeRepository, companyService);
    }

    @Test
    void createTimeEntryCreatesManualEntryForDayWithoutEntry() {
        Employee employee = employee(1L);
        UpdateTimeEntryRequest request = timeRequest("2026-06-15T09:00", "2026-06-15T17:00");

        when(employeeRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(timeEntryRepository.existsByEmployeeIdAndWorkDate(employee.getId(), LocalDate.of(2026, 6, 15)))
                .thenReturn(false);
        when(timeEntryRepository.save(any(TimeEntry.class))).thenAnswer(invocation -> {
            TimeEntry saved = invocation.getArgument(0);
            saved.setWorkDate(saved.getClockInTime().toLocalDate());
            return saved;
        });

        TimeEntryDto created = timeEntryService.createTimeEntry(employee.getId(), request);

        assertEquals(LocalDate.of(2026, 6, 15), created.getWorkDate());
        assertEquals(LocalDateTime.parse("2026-06-15T09:00"), created.getClockInTime());
        assertEquals(LocalDateTime.parse("2026-06-15T17:00"), created.getClockOutTime());

        ArgumentCaptor<TimeEntry> captor = ArgumentCaptor.forClass(TimeEntry.class);
        verify(timeEntryRepository).save(captor.capture());
        assertEquals(employee, captor.getValue().getEmployee());
    }

    @Test
    void createTimeEntryRejectsDayThatAlreadyHasEntry() {
        Employee employee = employee(1L);
        UpdateTimeEntryRequest request = timeRequest("2026-06-15T09:00", "2026-06-15T17:00");

        when(employeeRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(timeEntryRepository.existsByEmployeeIdAndWorkDate(employee.getId(), LocalDate.of(2026, 6, 15)))
                .thenReturn(true);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> timeEntryService.createTimeEntry(employee.getId(), request)
        );

        assertEquals("A time entry already exists for this day.", exception.getMessage());
        verify(timeEntryRepository, never()).save(any(TimeEntry.class));
    }

    @Test
    void createTimeEntryRejectsClockOutBeforeClockIn() {
        Employee employee = employee(1L);
        UpdateTimeEntryRequest request = timeRequest("2026-06-15T17:00", "2026-06-15T09:00");

        when(employeeRepository.findById(employee.getId())).thenReturn(Optional.of(employee));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> timeEntryService.createTimeEntry(employee.getId(), request)
        );

        assertEquals("Clock out time cannot be before clock in time.", exception.getMessage());
        verify(timeEntryRepository, never()).save(any(TimeEntry.class));
    }

    private Employee employee(Long id) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setFirstName("Avery");
        employee.setLastName("Employee");
        employee.setEmail("avery@example.com");
        employee.setPwHash("hash");
        return employee;
    }

    private UpdateTimeEntryRequest timeRequest(String clockIn, String clockOut) {
        UpdateTimeEntryRequest request = new UpdateTimeEntryRequest();
        request.setClockInTime(LocalDateTime.parse(clockIn));
        request.setClockOutTime(LocalDateTime.parse(clockOut));
        return request;
    }
}
