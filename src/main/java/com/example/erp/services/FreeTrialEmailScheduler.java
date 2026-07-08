package com.example.erp.services;

import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyPlan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class FreeTrialEmailScheduler {
    private static final Logger logger = LoggerFactory.getLogger(FreeTrialEmailScheduler.class);
    private static final ZoneId APP_ZONE = ZoneId.of("America/Chicago");

    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final EmailService emailService;

    public FreeTrialEmailScheduler(
            CompanyRepository companyRepository,
            CompanyService companyService,
            EmailService emailService
    ) {
        this.companyRepository = companyRepository;
        this.companyService = companyService;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 9 * * *", zone = "America/Chicago")
    public void sendFreeTrialReminderEmails() {
        LocalDate today = LocalDate.now(APP_ZONE);

        companyRepository.findAll().forEach(company -> {
            if (companyService.isInternalCompany(company)) {
                return;
            }

            CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());
            if (!plan.isTrial()) {
                return;
            }

            LocalDate trialEndsOn = companyService.getTrialEndsOn(company);
            if (trialEndsOn == null) {
                return;
            }

            if (today.equals(trialEndsOn.minusDays(5)) && company.getFreeTrialFiveDayEmailSentOn() == null) {
                sendFiveDayReminder(company, today);
            }

            if (today.equals(trialEndsOn) && company.getFreeTrialExpirationEmailSentOn() == null) {
                sendExpirationReminder(company, today);
            }
        });
    }

    private void sendFiveDayReminder(Company company, LocalDate sentOn) {
        try {
            emailService.sendFreeTrialFiveDayReminder(company.getEmail());
            company.setFreeTrialFiveDayEmailSentOn(sentOn);
            companyRepository.save(company);
        } catch (RuntimeException ex) {
            logger.warn("Free trial 5-day reminder could not be sent to company {}", company.getId(), ex);
        }
    }

    private void sendExpirationReminder(Company company, LocalDate sentOn) {
        try {
            emailService.sendFreeTrialExpirationReminder(company.getEmail());
            company.setFreeTrialExpirationEmailSentOn(sentOn);
            companyRepository.save(company);
        } catch (RuntimeException ex) {
            logger.warn("Free trial expiration email could not be sent to company {}", company.getId(), ex);
        }
    }
}
