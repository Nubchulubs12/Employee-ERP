package com.example.erp.services;

import com.example.erp.Dto.StartStripeBillingRequest;
import com.example.erp.Dto.StripeBillingSessionResponse;
import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyPlan;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

@Service
public class StripeBillingService {
    private final CompanyRepository companyRepository;
    private final String webhookSecret;
    private final String smallPriceId;
    private final String growingPriceId;
    private final String frontendBaseUrl;

    public StripeBillingService(
            CompanyRepository companyRepository,
            @Value("${app.stripe.secret-key}") String secretKey,
            @Value("${app.stripe.webhook-secret}") String webhookSecret,
            @Value("${app.stripe.small-price-id}") String smallPriceId,
            @Value("${app.stripe.growing-price-id}") String growingPriceId,
            @Value("${app.frontend-base-url}") String frontendBaseUrl
    ) {
        this.companyRepository = companyRepository;
        this.webhookSecret = webhookSecret;
        this.smallPriceId = smallPriceId;
        this.growingPriceId = growingPriceId;
        this.frontendBaseUrl = stripTrailingSlash(frontendBaseUrl);
        Stripe.apiKey = secretKey;
    }

    public StripeBillingSessionResponse startBillingSession(StartStripeBillingRequest request) throws StripeException {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + request.getCompanyId()));
        CompanyPlan plan = CompanyPlan.fromCode(request.getPlanCode());

        if (plan.isTrial()) {
            throw new RuntimeException("Stripe billing is only used for paid plans.");
        }

        if ("INTERNAL".equalsIgnoreCase(company.getBillingStatus())) {
            throw new RuntimeException("Internal accounts do not use Stripe billing.");
        }

        if (hasText(company.getStripeSubscriptionId())) {
            return new StripeBillingSessionResponse(createBillingPortalSession(company));
        }

        String customerId = ensureStripeCustomer(company);
        String priceId = getPriceId(plan);
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .setSuccessUrl(frontendBaseUrl + "/pricing?upgradeCompanyId=" + company.getId() + "&checkout=success")
                .setCancelUrl(frontendBaseUrl + "/pricing?upgradeCompanyId=" + company.getId() + "&checkout=cancel")
                .putMetadata("companyId", company.getId().toString())
                .putMetadata("planCode", plan.getCode())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPrice(priceId)
                                .setQuantity(1L)
                                .build()
                )
                .build();

        Session session = Session.create(params);
        return new StripeBillingSessionResponse(session.getUrl());
    }

    public void handleWebhook(String payload, String signatureHeader) {
        if (!hasText(webhookSecret)) {
            throw new RuntimeException("Stripe webhook secret is not configured.");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid Stripe webhook signature.");
        }

        StripeObject stripeObject = event.getDataObjectDeserializer().getObject().orElse(null);
        if (stripeObject instanceof Session session && "checkout.session.completed".equals(event.getType())) {
            handleCheckoutCompleted(session);
            return;
        }

        if (stripeObject instanceof Subscription subscription) {
            if ("customer.subscription.updated".equals(event.getType())) {
                handleSubscriptionUpdated(subscription);
            } else if ("customer.subscription.deleted".equals(event.getType())) {
                handleSubscriptionDeleted(subscription);
            }
        }
    }

    private void handleCheckoutCompleted(Session session) {
        Map<String, String> metadata = session.getMetadata();
        if (metadata == null || !metadata.containsKey("companyId") || !metadata.containsKey("planCode")) {
            return;
        }

        Long companyId = Long.valueOf(metadata.get("companyId"));
        CompanyPlan plan = CompanyPlan.fromCode(metadata.get("planCode"));
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        company.setPlanCode(plan.getCode());
        company.setPlanStartedOn(LocalDate.now());
        company.setBillingStatus("ACTIVE");
        company.setStripeSubscriptionStatus("active");
        company.setStripeCustomerId(session.getCustomer());
        company.setStripeSubscriptionId(session.getSubscription());
        company.setStripePriceId(getPriceId(plan));
        companyRepository.save(company);
    }

    private void handleSubscriptionUpdated(Subscription subscription) {
        Company company = companyRepository.findByStripeSubscriptionId(subscription.getId()).orElse(null);
        if (company == null) {
            return;
        }

        String status = subscription.getStatus();
        company.setStripeSubscriptionStatus(status);
        company.setBillingStatus(toBillingStatus(status));

        String priceId = getSubscriptionPriceId(subscription);
        if (hasText(priceId)) {
            company.setStripePriceId(priceId);
            CompanyPlan plan = getPlanForPriceId(priceId);
            if (plan != null) {
                company.setPlanCode(plan.getCode());
            }
        }

        companyRepository.save(company);
    }

    private void handleSubscriptionDeleted(Subscription subscription) {
        Company company = companyRepository.findByStripeSubscriptionId(subscription.getId()).orElse(null);
        if (company == null) {
            return;
        }

        company.setStripeSubscriptionStatus(subscription.getStatus());
        company.setBillingStatus("CANCELED");
        companyRepository.save(company);
    }

    private String ensureStripeCustomer(Company company) throws StripeException {
        if (hasText(company.getStripeCustomerId())) {
            return company.getStripeCustomerId();
        }

        com.stripe.model.Customer customer = com.stripe.model.Customer.create(
                CustomerCreateParams.builder()
                        .setEmail(company.getEmail())
                        .setName(company.getName())
                        .putMetadata("companyId", company.getId().toString())
                        .build()
        );
        company.setStripeCustomerId(customer.getId());
        companyRepository.save(company);
        return customer.getId();
    }

    private String createBillingPortalSession(Company company) throws StripeException {
        com.stripe.param.billingportal.SessionCreateParams params = com.stripe.param.billingportal.SessionCreateParams.builder()
                .setCustomer(company.getStripeCustomerId())
                .setReturnUrl(frontendBaseUrl + "/companies/" + company.getId())
                .build();

        return com.stripe.model.billingportal.Session.create(params).getUrl();
    }

    private String getPriceId(CompanyPlan plan) {
        if (plan == CompanyPlan.SMALL) {
            return requireConfigured(smallPriceId, "STRIPE_SMALL_PRICE_ID");
        }

        if (plan == CompanyPlan.GROWING) {
            return requireConfigured(growingPriceId, "STRIPE_GROWING_PRICE_ID");
        }

        throw new RuntimeException("No Stripe price configured for plan: " + plan.getCode());
    }

    private CompanyPlan getPlanForPriceId(String priceId) {
        if (priceId.equals(smallPriceId)) {
            return CompanyPlan.SMALL;
        }

        if (priceId.equals(growingPriceId)) {
            return CompanyPlan.GROWING;
        }

        return null;
    }

    private String getSubscriptionPriceId(Subscription subscription) {
        if (subscription.getItems() == null || subscription.getItems().getData().isEmpty()) {
            return null;
        }

        return subscription.getItems().getData().get(0).getPrice().getId();
    }

    private String toBillingStatus(String stripeStatus) {
        if ("active".equalsIgnoreCase(stripeStatus) || "trialing".equalsIgnoreCase(stripeStatus)) {
            return "ACTIVE";
        }

        if ("past_due".equalsIgnoreCase(stripeStatus)) {
            return "PAST_DUE";
        }

        if ("unpaid".equalsIgnoreCase(stripeStatus)) {
            return "UNPAID";
        }

        if ("incomplete_expired".equalsIgnoreCase(stripeStatus)) {
            return "INCOMPLETE_EXPIRED";
        }

        return stripeStatus == null ? null : stripeStatus.toUpperCase();
    }

    private String requireConfigured(String value, String name) {
        if (!hasText(value)) {
            throw new RuntimeException(name + " is not configured.");
        }

        return value;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:5173";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
