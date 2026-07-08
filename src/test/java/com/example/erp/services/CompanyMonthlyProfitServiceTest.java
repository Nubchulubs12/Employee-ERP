package com.example.erp.services;

import com.example.erp.Dto.CompanyMonthlyProfitDto;
import com.example.erp.Dto.UpdateCompanyMonthlyProfitRequest;
import com.example.erp.data.CompanyMonthlyProfitRepository;
import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyMonthlyProfit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyMonthlyProfitServiceTest {

    @Mock
    private CompanyMonthlyProfitRepository monthlyProfitRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanyService companyService;

    @InjectMocks
    private CompanyMonthlyProfitService monthlyProfitService;

    @Test
    void updateCreatesMonthlyProfitForCompanyAndPeriod() {
        Company company = new Company();
        company.setId(7L);
        UpdateCompanyMonthlyProfitRequest request = new UpdateCompanyMonthlyProfitRequest();
        request.setGrossProfit(new BigDecimal("125000.50"));

        when(companyRepository.findById(7L)).thenReturn(Optional.of(company));
        when(monthlyProfitRepository.findByCompanyIdAndProfitYearAndProfitMonth(7L, 2026, 6))
                .thenReturn(Optional.empty());
        when(monthlyProfitRepository.save(any(CompanyMonthlyProfit.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CompanyMonthlyProfitDto result = monthlyProfitService.update(7L, 2026, 6, request);

        assertEquals(7L, result.companyId());
        assertEquals(2026, result.year());
        assertEquals(6, result.month());
        assertEquals(new BigDecimal("125000.50"), result.grossProfit());
    }

    @Test
    void updateRejectsMonthOutsideCalendarRange() {
        UpdateCompanyMonthlyProfitRequest request = new UpdateCompanyMonthlyProfitRequest();
        request.setGrossProfit(BigDecimal.TEN);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> monthlyProfitService.update(7L, 2026, 13, request)
        );

        assertEquals("Month must be between 1 and 12.", exception.getMessage());
        verify(companyRepository, never()).findById(any());
    }
}
