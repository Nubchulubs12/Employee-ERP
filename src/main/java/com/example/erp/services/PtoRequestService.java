package com.example.erp.services;

import com.example.erp.Dto.CreatePtoRequest;
import com.example.erp.Dto.PtoRequestDto;
import com.example.erp.Dto.ReviewPtoRequest;
import com.example.erp.data.EmployeeRepository;
import com.example.erp.data.PtoRequestRepository;
import com.example.erp.models.Employee;
import com.example.erp.models.PtoRequest;
import com.example.erp.models.PtoStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PtoRequestService {

    private final PtoRequestRepository ptoRequestRepository;
    private final EmployeeRepository employeeRepository;

    public PtoRequestService(PtoRequestRepository ptoRequestRepository, EmployeeRepository employeeRepository) {
        this.ptoRequestRepository = ptoRequestRepository;
        this.employeeRepository = employeeRepository;
    }

    public PtoRequestDto createRequest(Long employeeId, CreatePtoRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new RuntimeException("End date cannot be before start date.");
        }

        if (request.getHoursRequested() == null ||
                request.getHoursRequested().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("PTO hours requested must be greater than 0.");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

        BigDecimal balance = employee.getPtoBalanceHours() == null
                ? BigDecimal.ZERO
                : employee.getPtoBalanceHours();

        if (request.getHoursRequested().compareTo(balance) > 0) {
            throw new RuntimeException("Requested PTO hours exceed available balance.");
        }

        PtoRequest pto = new PtoRequest();
        pto.setEmployee(employee);
        pto.setStartDate(request.getStartDate());
        pto.setEndDate(request.getEndDate());
        pto.setReason(request.getReason());
        pto.setHoursRequested(request.getHoursRequested());
        pto.setStatus(PtoStatus.PENDING);
        pto.setCreatedAt(LocalDateTime.now());

        return toDto(ptoRequestRepository.save(pto));
    }

    public List<PtoRequestDto> getRequestsForEmployee(Long employeeId) {
        return ptoRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<PtoRequestDto> getRequestsForCompany(Long companyId) {
        return ptoRequestRepository.findByEmployeeCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public PtoRequestDto approveRequest(Long requestId, ReviewPtoRequest request) {
        PtoRequest pto = getRequestEntity(requestId);

        if (pto.getStatus() == PtoStatus.APPROVED) {
            throw new RuntimeException("PTO request has already been approved.");
        }

        if (pto.getStatus() == PtoStatus.DENIED) {
            throw new RuntimeException("Denied PTO requests cannot be approved.");
        }

        Employee employee = pto.getEmployee();

        BigDecimal balance = employee.getPtoBalanceHours() == null
                ? BigDecimal.ZERO
                : employee.getPtoBalanceHours();

        BigDecimal requested = pto.getHoursRequested() == null
                ? BigDecimal.ZERO
                : pto.getHoursRequested();

        if (requested.compareTo(balance) > 0) {
            throw new RuntimeException("Employee does not have enough PTO balance.");
        }

        employee.setPtoBalanceHours(balance.subtract(requested));
        employeeRepository.save(employee);

        pto.setStatus(PtoStatus.APPROVED);
        pto.setReviewedAt(LocalDateTime.now());
        pto.setReviewNote(request.getReviewNote());

        return toDto(ptoRequestRepository.save(pto));
    }

    public PtoRequestDto denyRequest(Long requestId, ReviewPtoRequest request) {
        PtoRequest pto = getRequestEntity(requestId);

        if (pto.getStatus() == PtoStatus.APPROVED) {
            throw new RuntimeException("Approved PTO requests cannot be denied.");
        }

        if (pto.getStatus() == PtoStatus.DENIED) {
            throw new RuntimeException("PTO request has already been denied.");
        }

        pto.setStatus(PtoStatus.DENIED);
        pto.setReviewedAt(LocalDateTime.now());
        pto.setReviewNote(request.getReviewNote());

        return toDto(ptoRequestRepository.save(pto));
    }

    private PtoRequest getRequestEntity(Long requestId) {
        return ptoRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("PTO request not found with id: " + requestId));
    }

    private PtoRequestDto toDto(PtoRequest pto) {
        Employee employee = pto.getEmployee();

        BigDecimal balance = employee.getPtoBalanceHours() == null
                ? BigDecimal.ZERO
                : employee.getPtoBalanceHours();

        BigDecimal hoursRequested = pto.getHoursRequested() == null
                ? BigDecimal.ZERO
                : pto.getHoursRequested();

        return new PtoRequestDto(
                pto.getId(),
                employee.getId(),
                employee.getFirstName() + " " + employee.getLastName(),
                pto.getStartDate(),
                pto.getEndDate(),
                pto.getReason(),
                pto.getStatus(),
                pto.getCreatedAt(),
                pto.getReviewedAt(),
                pto.getReviewNote(),
                hoursRequested,
                balance
        );
    }
}