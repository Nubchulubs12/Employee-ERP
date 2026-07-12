package com.example.erp.controller;

import com.example.erp.Dto.BillingDetailsDto;
import com.example.erp.Dto.StartStripeBillingRequest;
import com.example.erp.Dto.StripeBillingSessionResponse;
import com.example.erp.Dto.StripeInvoiceDto;
import com.example.erp.services.StripeBillingService;
import com.stripe.exception.StripeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stripe")
@CrossOrigin(origins = {"http://localhost:5173", "https://employee-erps.onrender.com"})
public class StripeBillingController {
    private final StripeBillingService stripeBillingService;

    public StripeBillingController(StripeBillingService stripeBillingService) {
        this.stripeBillingService = stripeBillingService;
    }

    @PostMapping("/billing-session")
    public ResponseEntity<StripeBillingSessionResponse> startBillingSession(
            @RequestBody StartStripeBillingRequest request
    ) throws StripeException {
        return ResponseEntity.ok(stripeBillingService.startBillingSession(request));
    }

    @GetMapping("/companies/{companyId}/billing")
    public ResponseEntity<BillingDetailsDto> getBillingDetails(@PathVariable Long companyId) {
        return ResponseEntity.ok(stripeBillingService.getBillingDetails(companyId));
    }

    @GetMapping("/companies/{companyId}/invoices")
    public ResponseEntity<List<StripeInvoiceDto>> getInvoices(
            @PathVariable Long companyId
    ) throws StripeException {
        return ResponseEntity.ok(stripeBillingService.getInvoices(companyId));
    }

    @PostMapping("/companies/{companyId}/cancel")
    public ResponseEntity<Void> cancelSubscription(@PathVariable Long companyId) throws StripeException {
        stripeBillingService.cancelSubscription(companyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader
    ) {
        stripeBillingService.handleWebhook(payload, signatureHeader);
        return ResponseEntity.ok().build();
    }
}
