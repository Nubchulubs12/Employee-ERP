package com.example.erp.services;

import com.example.erp.Dto.BillingDetailsDto;
import com.example.erp.Dto.StartStripeBillingRequest;
import com.example.erp.Dto.StripeBillingSessionResponse;
import com.example.erp.Dto.StripeInvoiceDto;
import com.example.erp.data.CompanyRepository;
import com.example.erp.models.Company;
import com.example.erp.models.CompanyPlan;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.Price;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionItem;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.InvoiceCreatePreviewParams;
import com.stripe.param.InvoiceListParams;
import com.stripe.param.SubscriptionUpdateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Service
public class StripeBillingService {
    private static final Logger logger = LoggerFactory.getLogger(StripeBillingService.class);
    private static final ZoneId APP_ZONE = ZoneId.of("America/Chicago");

    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final EmailService emailService;
    private final String secretKey;
    private final String webhookSecret;
    private final String smallPriceId;
    private final String growingPriceId;
    private final String frontendBaseUrl;

    public StripeBillingService(
            CompanyRepository companyRepository,
            CompanyService companyService,
            EmailService emailService,
            @Value("${app.stripe.secret-key}") String secretKey,
            @Value("${app.stripe.webhook-secret}") String webhookSecret,
            @Value("${app.stripe.small-price-id}") String smallPriceId,
            @Value("${app.stripe.growing-price-id}") String growingPriceId,
            @Value("${app.frontend-base-url}") String frontendBaseUrl
    ) {
        this.companyRepository = companyRepository;
        this.companyService = companyService;
        this.emailService = emailService;
        this.secretKey = secretKey;
        this.webhookSecret = webhookSecret;
        this.smallPriceId = smallPriceId;
        this.growingPriceId = growingPriceId;
        this.frontendBaseUrl = stripTrailingSlash(frontendBaseUrl);
        if (hasText(secretKey)) {
            Stripe.apiKey = secretKey;
        }
    }

    public StripeBillingSessionResponse startBillingSession(StartStripeBillingRequest request) throws StripeException {
        prepareStripe();
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + request.getCompanyId()));
        CompanyPlan plan = CompanyPlan.fromCode(request.getPlanCode());

        if (plan.isTrial()) {
            throw new RuntimeException("Stripe billing is only used for paid plans.");
        }

        if (companyService.isInternalCompany(company)) {
            companyService.applyInternalBillingStatus(company);
            companyRepository.save(company);
            throw new RuntimeException("Internal accounts do not use Stripe billing.");
        }

        if (hasText(company.getStripeSubscriptionId())) {
            updateExistingSubscriptionPlan(company, plan);
            return new StripeBillingSessionResponse(frontendBaseUrl + "/companies/" + company.getId());
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

    public BillingDetailsDto getBillingDetails(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));
        CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());

        return new BillingDetailsDto(
                companyService.getPublicPlanName(plan),
                company.getBillingStatus(),
                company.getStripeSubscriptionStatus(),
                getNextBillingDate(company)
        );
    }

    public List<StripeInvoiceDto> getInvoices(Long companyId) throws StripeException {
        prepareStripe();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        logger.info("Loading Stripe invoices for company {}", companyId);

        if (companyService.isInternalCompany(company)) {
            logger.info("Skipping Stripe invoice lookup for internal company {}", companyId);
            return List.of();
        }

        if (!hasText(company.getStripeCustomerId())) {
            logger.info("No Stripe customer id found for company {}; returning empty invoice list", companyId);
            return List.of();
        }

        try {
            InvoiceListParams.Builder builder = InvoiceListParams.builder()
                    .setCustomer(company.getStripeCustomerId())
                    .setLimit(10L);

            if (hasText(company.getStripeSubscriptionId())) {
                builder.setSubscription(company.getStripeSubscriptionId());
            }

            return Invoice.list(builder.build())
                    .getData()
                    .stream()
                    .map(this::toInvoiceDto)
                    .toList();
        } catch (StripeException ex) {
            logger.warn("Stripe invoice lookup failed for company {}", companyId, ex);
            throw ex;
        }
    }

    public void cancelSubscription(Long companyId) throws StripeException {
        prepareStripe();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        if (companyService.isInternalCompany(company)) {
            throw new RuntimeException("Internal accounts do not use Stripe subscriptions.");
        }

        if (!hasText(company.getStripeSubscriptionId())) {
            throw new RuntimeException("No active Stripe subscription is connected to this company.");
        }

        Subscription subscription = Subscription.retrieve(company.getStripeSubscriptionId());
        Subscription canceledSubscription = subscription.cancel();
        applyCanceledSubscription(company, canceledSubscription, true);
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
            return;
        }

        if (stripeObject instanceof Invoice invoice) {
            if ("invoice.payment_succeeded".equals(event.getType())) {
                handleInvoicePaymentSucceeded(invoice);
            } else if ("invoice.payment_failed".equals(event.getType())) {
                handleInvoicePaymentFailed(invoice);
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

        if (companyService.isInternalCompany(company)) {
            companyService.applyInternalBillingStatus(company);
            companyRepository.save(company);
            return;
        }

        CompanyPlan previousPlan = CompanyPlan.fromCode(company.getPlanCode());
        String priceId = getPriceId(plan);
        String monthlyAmount = getMonthlyAmountForPriceOrFallback(priceId, company.getId());

        company.setPlanCode(plan.getCode());
        company.setPlanStartedOn(LocalDate.now());
        company.setBillingStatus("ACTIVE");
        company.setStripeSubscriptionStatus("active");
        company.setStripeCustomerId(session.getCustomer());
        company.setStripeSubscriptionId(session.getSubscription());
        company.setStripePriceId(priceId);
        storeCurrentPeriodEndFromSubscription(company, session.getSubscription());
        companyRepository.save(company);
        sendPlanChangedEmail(company, previousPlan, plan, monthlyAmount);
    }

    private void handleSubscriptionUpdated(Subscription subscription) {
        logger.info("Handling Stripe subscription update for subscription {}", subscription.getId());
        Company company = companyRepository.findByStripeSubscriptionId(subscription.getId()).orElse(null);
        if (company == null) {
            logger.warn("No company found for Stripe subscription update {}", subscription.getId());
            return;
        }

        if (companyService.isInternalCompany(company)) {
            companyService.applyInternalBillingStatus(company);
            companyRepository.save(company);
            return;
        }

        String status = subscription.getStatus();
        company.setStripeSubscriptionStatus(status);
        company.setBillingStatus(toBillingStatus(status));
        company.setStripeCurrentPeriodEnd(getCurrentPeriodEnd(subscription));

        String priceId = getSubscriptionPriceId(subscription);
        if (hasText(priceId)) {
            company.setStripePriceId(priceId);
            CompanyPlan plan = getPlanForPriceId(priceId);
            if (plan != null) {
                company.setPlanCode(plan.getCode());
            }
        }

        companyRepository.save(company);
        logger.info("Updated company {} from Stripe subscription {}; status={}, periodEnd={}",
                company.getId(), subscription.getId(), status, company.getStripeCurrentPeriodEnd());
    }

    private void handleSubscriptionDeleted(Subscription subscription) {
        Company company = companyRepository.findByStripeSubscriptionId(subscription.getId()).orElse(null);
        if (company == null) {
            return;
        }

        if (companyService.isInternalCompany(company)) {
            companyService.applyInternalBillingStatus(company);
            companyRepository.save(company);
            return;
        }

        company.setStripeSubscriptionStatus(subscription.getStatus());
        applyCanceledSubscription(company, subscription, false);
    }

    private void handleInvoicePaymentSucceeded(Invoice invoice) {
        Company company = getCompanyForInvoice(invoice);
        if (company == null || companyService.isInternalCompany(company)) {
            return;
        }

        company.setStripeCurrentPeriodEnd(toLocalDate(invoice.getPeriodEnd()));
        companyRepository.save(company);
        sendPaymentSucceededEmail(company);
    }

    private StripeInvoiceDto toInvoiceDto(Invoice invoice) {
        return new StripeInvoiceDto(
                toLocalDate(invoice.getCreated()),
                invoice.getAmountPaid(),
                invoice.getStatus(),
                invoice.getHostedInvoiceUrl(),
                invoice.getInvoicePdf()
        );
    }

    private void handleInvoicePaymentFailed(Invoice invoice) {
        Company company = getCompanyForInvoice(invoice);
        if (company == null || companyService.isInternalCompany(company)) {
            return;
        }

        sendPaymentFailedEmail(company);
    }

    private Company getCompanyForInvoice(Invoice invoice) {
        String customerId = invoice.getCustomer();
        if (!hasText(customerId)) {
            return null;
        }

        return companyRepository.findByStripeCustomerId(customerId).orElse(null);
    }

    private LocalDate getNextBillingDate(Company company) {
        if (!hasText(company.getStripeSubscriptionId())) {
            return company.getStripeCurrentPeriodEnd();
        }

        try {
            prepareStripe();
            Invoice preview = Invoice.createPreview(
                    InvoiceCreatePreviewParams.builder()
                            .setCustomer(company.getStripeCustomerId())
                            .setSubscription(company.getStripeSubscriptionId())
                            .build()
            );

            LocalDate previewDate = toLocalDate(preview.getPeriodEnd());
            if (previewDate != null) {
                company.setStripeCurrentPeriodEnd(previewDate);
                companyRepository.save(company);
                return previewDate;
            }
        } catch (StripeException | RuntimeException ex) {
            logger.warn("Could not fetch Stripe invoice preview for company {}", company.getId(), ex);
            // Fall back to the most recent invoice or stored webhook value below.
        }

        LocalDate latestInvoiceDate = getLatestInvoicePeriodEnd(company);
        return latestInvoiceDate != null ? latestInvoiceDate : company.getStripeCurrentPeriodEnd();
    }

    private LocalDate getLatestInvoicePeriodEnd(Company company) {
        try {
            prepareStripe();
            Invoice invoice = getLatestInvoice(company);
            if (invoice == null) {
                return null;
            }

            LocalDate periodEnd = toLocalDate(invoice.getPeriodEnd());
            if (periodEnd != null) {
                company.setStripeCurrentPeriodEnd(periodEnd);
                companyRepository.save(company);
            }
            return periodEnd;
        } catch (StripeException | RuntimeException ex) {
            logger.warn("Could not fetch latest Stripe invoice period end for company {}", company.getId(), ex);
            return null;
        }
    }

    private Invoice getLatestInvoice(Company company) throws StripeException {
        prepareStripe();
        if (!hasText(company.getStripeCustomerId())) {
            return null;
        }

        InvoiceListParams.Builder builder = InvoiceListParams.builder()
                .setCustomer(company.getStripeCustomerId())
                .setLimit(1L);

        if (hasText(company.getStripeSubscriptionId())) {
            builder.setSubscription(company.getStripeSubscriptionId());
        }

        return Invoice.list(builder.build()).getData().stream().findFirst().orElse(null);
    }

    private void storeCurrentPeriodEndFromSubscription(Company company, String subscriptionId) {
        if (!hasText(subscriptionId)) {
            return;
        }

        try {
            prepareStripe();
            Subscription subscription = Subscription.retrieve(subscriptionId);
            company.setStripeCurrentPeriodEnd(getCurrentPeriodEnd(subscription));
        } catch (StripeException ex) {
            logger.warn("Could not fetch subscription period end for company {} subscription {}",
                    company.getId(), subscriptionId, ex);
        }
    }

    private void updateExistingSubscriptionPlan(Company company, CompanyPlan plan) throws StripeException {
        prepareStripe();

        Subscription subscription = Subscription.retrieve(company.getStripeSubscriptionId());
        if (subscription.getItems() == null || subscription.getItems().getData().isEmpty()) {
            throw new RuntimeException("No Stripe subscription item is connected to this company.");
        }

        CompanyPlan previousPlan = CompanyPlan.fromCode(company.getPlanCode());
        String priceId = getPriceId(plan);
        String monthlyAmount = getMonthlyAmountForPrice(priceId);
        String subscriptionItemId = subscription.getItems().getData().get(0).getId();
        SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                .setProrationBehavior(SubscriptionUpdateParams.ProrationBehavior.NONE)
                .addItem(
                        SubscriptionUpdateParams.Item.builder()
                                .setId(subscriptionItemId)
                                .setPrice(priceId)
                                .build()
                )
                .build();

        Subscription updatedSubscription = subscription.update(params);

        company.setPlanCode(plan.getCode());
        company.setStripePriceId(priceId);
        company.setStripeSubscriptionStatus(updatedSubscription.getStatus());
        company.setBillingStatus(toBillingStatus(updatedSubscription.getStatus()));
        company.setStripeCurrentPeriodEnd(getCurrentPeriodEnd(updatedSubscription));
        companyRepository.save(company);
        sendPlanChangedEmail(company, previousPlan, plan, monthlyAmount);

        logger.info("Updated Stripe subscription {} for company {} to plan {} with no proration; next invoice uses new price.",
                updatedSubscription.getId(), company.getId(), plan.getCode());
    }

    private LocalDate getCurrentPeriodEnd(Subscription subscription) {
        if (subscription == null || subscription.getItems() == null || subscription.getItems().getData().isEmpty()) {
            return null;
        }

        SubscriptionItem item = subscription.getItems().getData().get(0);
        return toLocalDate(item.getCurrentPeriodEnd());
    }

    private void applyCanceledSubscription(Company company, Subscription subscription, boolean sendEmailImmediately) {
        boolean alreadyCanceled = "CANCELED".equalsIgnoreCase(company.getBillingStatus());

        company.setStripeSubscriptionStatus(subscription.getStatus());
        company.setBillingStatus("CANCELED");
        companyRepository.save(company);

        if (sendEmailImmediately || !alreadyCanceled) {
            sendSubscriptionCanceledEmail(company);
        }
    }

    private void sendPaymentSucceededEmail(Company company) {
        try {
            CompanyPlan plan = CompanyPlan.fromCode(company.getPlanCode());
            emailService.sendSubscriptionPaymentSucceeded(
                    company.getEmail(),
                    companyService.getPublicPlanName(plan)
            );
        } catch (RuntimeException ex) {
            // Webhooks should still acknowledge Stripe even if notification email fails.
        }
    }

    private void sendPaymentFailedEmail(Company company) {
        try {
            emailService.sendSubscriptionPaymentFailed(company.getEmail());
        } catch (RuntimeException ex) {
            // Webhooks should still acknowledge Stripe even if notification email fails.
        }
    }

    private void sendSubscriptionCanceledEmail(Company company) {
        try {
            emailService.sendSubscriptionCanceled(company.getEmail());
        } catch (RuntimeException ex) {
            // Webhooks should still acknowledge Stripe even if notification email fails.
        }
    }

    private void sendPlanChangedEmail(Company company, CompanyPlan previousPlan, CompanyPlan newPlan, String monthlyAmount) {
        if (previousPlan == newPlan) {
            return;
        }

        String action = newPlan.getEmployeeLimit() > previousPlan.getEmployeeLimit() ? "upgrade" : "downgrade";
        try {
            emailService.sendSubscriptionPlanChanged(
                    company.getEmail(),
                    action,
                    companyService.getPublicPlanName(newPlan),
                    monthlyAmount
            );
        } catch (RuntimeException ex) {
            logger.warn("Could not send Stripe plan {} email for company {}", action, company.getId(), ex);
        }
    }

    private String ensureStripeCustomer(Company company) throws StripeException {
        prepareStripe();
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
        prepareStripe();
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

    private String getMonthlyAmountForPrice(String priceId) throws StripeException {
        Price price = Price.retrieve(priceId);
        BigDecimal amount = null;

        if (price.getUnitAmount() != null) {
            amount = BigDecimal.valueOf(price.getUnitAmount(), 2);
        } else if (price.getUnitAmountDecimal() != null) {
            amount = price.getUnitAmountDecimal().movePointLeft(2);
        }

        if (amount == null) {
            return "the updated plan amount";
        }

        String currency = price.getCurrency();
        String formattedAmount = amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
        return "usd".equalsIgnoreCase(currency) ? "$" + formattedAmount : formattedAmount + " " + currency.toUpperCase();
    }

    private String getMonthlyAmountForPriceOrFallback(String priceId, Long companyId) {
        try {
            return getMonthlyAmountForPrice(priceId);
        } catch (StripeException ex) {
            logger.warn("Could not fetch Stripe price amount for company {} price {}", companyId, priceId, ex);
            return "the updated plan amount";
        }
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

    private void prepareStripe() {
        Stripe.apiKey = requireConfigured(secretKey, "STRIPE_SECRET_KEY");
    }

    private LocalDate toLocalDate(Long epochSeconds) {
        if (epochSeconds == null) {
            return null;
        }

        return Instant.ofEpochSecond(epochSeconds).atZone(APP_ZONE).toLocalDate();
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
