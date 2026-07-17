package com.example.erp.services;

import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class CanceledCompanyDeletionService {
    private static final Logger logger = LoggerFactory.getLogger(CanceledCompanyDeletionService.class);

    private final CompanyRepository companyRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public CanceledCompanyDeletionService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional
    public boolean permanentlyDeleteIfEligible(Long companyId, Instant cutoff) {
        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null
                || !"CANCELED".equalsIgnoreCase(company.getBillingStatus())
                || company.getSubscriptionCanceledAt() == null
                || company.getSubscriptionCanceledAt().isAfter(cutoff)) {
            return false;
        }

        // Remove account-scoped records in foreign-key dependency order.
        execute("DELETE FROM password_reset_codes WHERE email = :companyEmail OR email IN "
                + "(SELECT email FROM employees WHERE company_id = :companyId)", companyId, company.getEmail());
        execute("DELETE FROM commission_entries WHERE company_id = :companyId", companyId, null);
        execute("DELETE FROM time_entries WHERE employee_id IN "
                + "(SELECT id FROM employees WHERE company_id = :companyId)", companyId, null);
        execute("DELETE FROM pto_requests WHERE employee_id IN "
                + "(SELECT id FROM employees WHERE company_id = :companyId)", companyId, null);
        execute("DELETE FROM documents WHERE company_id = :companyId", companyId, null);
        execute("DELETE FROM company_monthly_jobs WHERE company_id = :companyId", companyId, null);
        execute("DELETE FROM company_monthly_profits WHERE company_id = :companyId", companyId, null);
        execute("DELETE FROM employees WHERE company_id = :companyId", companyId, null);

        int deleted = entityManager.createNativeQuery(
                        "DELETE FROM companies WHERE id = :companyId "
                                + "AND UPPER(billing_status) = 'CANCELED' "
                                + "AND subscription_canceled_at <= :cutoff")
                .setParameter("companyId", companyId)
                .setParameter("cutoff", cutoff)
                .executeUpdate();

        if (deleted == 1) {
            logger.info("Permanently deleted canceled company {} after its 30-day retention period", companyId);
            return true;
        }

        throw new IllegalStateException("Company eligibility changed during account deletion.");
    }

    private void execute(String sql, Long companyId, String companyEmail) {
        var query = entityManager.createNativeQuery(sql).setParameter("companyId", companyId);
        if (companyEmail != null) {
            query.setParameter("companyEmail", companyEmail);
        }
        query.executeUpdate();
    }
}
