package com.example.erp.data;

import com.example.erp.models.PtoRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PtoRequestRepository extends JpaRepository<PtoRequest, Long> {
    List<PtoRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<PtoRequest> findByEmployeeCompanyIdOrderByCreatedAtDesc(Long companyId);
}
