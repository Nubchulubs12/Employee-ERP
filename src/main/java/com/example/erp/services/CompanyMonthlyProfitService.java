package com.example.erp.services;

import com.example.erp.Dto.CompanyMonthlyProfitDto;
import com.example.erp.Dto.UpdateCompanyMonthlyProfitRequest;
import com.example.erp.data.CompanyMonthlyProfitRepository;
import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyMonthlyProfit;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyMonthlyProfitService {

    private final CompanyMonthlyProfitRepository monthlyProfitRepository;
    private final CompanyRepository companyRepository;
    private final CompanyService companyService;

    public CompanyMonthlyProfitService(
            CompanyMonthlyProfitRepository monthlyProfitRepository,
            CompanyRepository companyRepository,
            CompanyService companyService
    ) {
        this.monthlyProfitRepository = monthlyProfitRepository;
        this.companyRepository = companyRepository;
        this.companyService = companyService;
    }

    public List<CompanyMonthlyProfitDto> getYear(Long companyId, Integer year) {
        validateYear(year);
        ensureCompanyExists(companyId);

        return monthlyProfitRepository
                .findByCompanyIdAndProfitYearOrderByProfitMonthAsc(companyId, year)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public CompanyMonthlyProfitDto update(
            Long companyId,
            Integer year,
            Integer month,
            UpdateCompanyMonthlyProfitRequest request
    ) {
        validateYear(year);
        validateMonth(month);
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));
        companyService.assertCompanyCanWrite(company);

        CompanyMonthlyProfit monthlyProfit = monthlyProfitRepository
                .findByCompanyIdAndProfitYearAndProfitMonth(companyId, year, month)
                .orElseGet(CompanyMonthlyProfit::new);

        monthlyProfit.setCompany(company);
        monthlyProfit.setProfitYear(year);
        monthlyProfit.setProfitMonth(month);
        monthlyProfit.setGrossProfit(request.getGrossProfit());

        return toDto(monthlyProfitRepository.save(monthlyProfit));
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

    private CompanyMonthlyProfitDto toDto(CompanyMonthlyProfit monthlyProfit) {
        return new CompanyMonthlyProfitDto(
                monthlyProfit.getId(),
                monthlyProfit.getCompany().getId(),
                monthlyProfit.getProfitYear(),
                monthlyProfit.getProfitMonth(),
                monthlyProfit.getGrossProfit()
        );
    }
}
