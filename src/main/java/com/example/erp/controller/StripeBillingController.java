package com.example.erp.controller;

import com.example.erp.Dto.StartStripeBillingRequest;
import com.example.erp.Dto.StripeBillingSessionResponse;
import com.example.erp.services.StripeBillingService;
import com.stripe.exception.StripeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader
    ) {
        stripeBillingService.handleWebhook(payload, signatureHeader);
        return ResponseEntity.ok().build();
    }
}
