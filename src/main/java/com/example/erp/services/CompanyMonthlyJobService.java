package com.example.erp.services;

import com.example.erp.Dto.CompanyMonthlyJobDto;
import com.example.erp.Dto.SaveCompanyMonthlyJobRequest;
import com.example.erp.data.CompanyMonthlyJobRepository;
import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyMonthlyJob;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyMonthlyJobService {

    private final CompanyMonthlyJobRepository monthlyJobRepository;
    private final CompanyRepository companyRepository;

    public CompanyMonthlyJobService(
            CompanyMonthlyJobRepository monthlyJobRepository,
            CompanyRepository companyRepository
    ) {
        this.monthlyJobRepository = monthlyJobRepository;
        this.companyRepository = companyRepository;
    }

    public List<CompanyMonthlyJobDto> getYear(Long companyId, Integer year) {
        validateYear(year);
        ensureCompanyExists(companyId);
        return monthlyJobRepository.findByCompanyIdAndJobYearOrderByJobMonthAscIdAsc(companyId, year)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public CompanyMonthlyJobDto create(
            Long companyId,
            Integer year,
            Integer month,
            SaveCompanyMonthlyJobRequest request
    ) {
        validateYear(year);
        validateMonth(month);
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        CompanyMonthlyJob job = new CompanyMonthlyJob();
        job.setCompany(company);
        job.setJobYear(year);
        job.setJobMonth(month);
        applyRequest(job, request);
        return toDto(monthlyJobRepository.save(job));
    }

    public CompanyMonthlyJobDto update(
            Long companyId,
            Long jobId,
            SaveCompanyMonthlyJobRequest request
    ) {
        CompanyMonthlyJob job = monthlyJobRepository.findByIdAndCompanyId(jobId, companyId)
                .orElseThrow(() -> new RuntimeException("Monthly job not found with id: " + jobId));
        applyRequest(job, request);
        return toDto(monthlyJobRepository.save(job));
    }

    public void delete(Long companyId, Long jobId) {
        CompanyMonthlyJob job = monthlyJobRepository.findByIdAndCompanyId(jobId, companyId)
                .orElseThrow(() -> new RuntimeException("Monthly job not found with id: " + jobId));
        monthlyJobRepository.delete(job);
    }

    private void applyRequest(CompanyMonthlyJob job, SaveCompanyMonthlyJobRequest request) {
        job.setJobName(request.getJobName().trim());
        job.setAmount(request.getAmount());
    }

    private void ensureCompanyExists(Long companyId) {
        if (!companyRepository.existsById(companyId)) {
            throw new RuntimeException("Company not found with id: " + companyId);
        }
    }

    private void validateYear(Integer year) {
        if (year == null || year < 1900 || year > 9999) {
            throw new IllegalArgumentException("Year must be between 1900 and 9999.");
        }
    }

    private void validateMonth(Integer month) {
        if (month == null || month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12.");
        }
    }

    private CompanyMonthlyJobDto toDto(CompanyMonthlyJob job) {
        return new CompanyMonthlyJobDto(
                job.getId(),
                job.getCompany().getId(),
                job.getJobYear(),
                job.getJobMonth(),
                job.getJobName(),
                job.getAmount()
        );
    }
}
