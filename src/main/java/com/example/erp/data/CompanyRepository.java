package com.example.erp.data;

import com.example.erp.models.Company;
import org.springframework.data.domain.Example;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.time.Instant;
import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByEmail(String email);
    boolean existsByName(String name);
    Optional<Company> findByEmail(String email);
    Optional<Company> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<Company> findByStripeCustomerId(String stripeCustomerId);
    List<Company> findByBillingStatusIgnoreCaseAndSubscriptionCanceledAtLessThanEqual(
            String billingStatus,
            Instant cutoff
    );
    List<Company> findByBillingStatusIgnoreCaseAndSubscriptionCanceledAtIsNull(String billingStatus);
}
