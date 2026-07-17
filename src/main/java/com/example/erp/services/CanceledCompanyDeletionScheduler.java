package com.example.erp.services;

import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class CanceledCompanyDeletionScheduler {
    private static final Logger logger = LoggerFactory.getLogger(CanceledCompanyDeletionScheduler.class);
    private static final long RETENTION_DAYS = 30;

    private final CompanyRepository companyRepository;
    private final CanceledCompanyDeletionService deletionService;

    public CanceledCompanyDeletionScheduler(
            CompanyRepository companyRepository,
            CanceledCompanyDeletionService deletionService
    ) {
        this.companyRepository = companyRepository;
        this.deletionService = deletionService;
    }

    @Scheduled(cron = "0 15 * * * *", zone = "UTC")
    public void deleteExpiredCanceledCompanies() {
        Instant now = Instant.now();
        Instant cutoff = now.minus(RETENTION_DAYS, ChronoUnit.DAYS);

        // Existing canceled rows predate the retention timestamp. Start their
        // full retention period now rather than deleting them unexpectedly.
        for (Company company : companyRepository
                .findByBillingStatusIgnoreCaseAndSubscriptionCanceledAtIsNull("CANCELED")) {
            company.setSubscriptionCanceledAt(now);
            companyRepository.save(company);
            logger.info("Started 30-day retention period for previously canceled company {}", company.getId());
        }

        for (Company company : companyRepository
                .findByBillingStatusIgnoreCaseAndSubscriptionCanceledAtLessThanEqual("CANCELED", cutoff)) {
            try {
                deletionService.permanentlyDeleteIfEligible(company.getId(), cutoff);
            } catch (RuntimeException ex) {
                logger.error("Failed to delete expired canceled company {}", company.getId(), ex);
            }
        }
    }
}
