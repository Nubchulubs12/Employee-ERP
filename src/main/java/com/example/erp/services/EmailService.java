package com.example.erp.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.UnsupportedEncodingException;
import java.util.Map;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String displayName;
    private final String resendApiKey;
    private final RestClient restClient;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from}") String mailFrom,
                        @Value("${app.mail.display-name}") String displayName,
                        @Value("${app.mail.resend-api-key:}") String resendApiKey) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.displayName = displayName;
        this.resendApiKey = resendApiKey;
        this.restClient = RestClient.create("https://api.resend.com");
    }

    public void sendPasswordResetCode(String to, String code) {
        String body = "Your ESS Portal password reset code is:\n\n"
                + code
                + "\n\nThis code expires in 15 minutes.\n\n"
                + "If you did not request this password reset, you can ignore this email.";

        sendEmail(to, "ESS Portal Password Reset Code", body);
    }

    public void sendWelcomeEmail(String to, String planName) {
        String body = "Welcome and thank you for choosing ESS Portal\n\n"
                + "Plan: " + planName;

        sendEmail(to, "Welcome to ESS Portal", body);
    }

    public void sendFreeTrialFiveDayReminder(String to) {
        String body = "Your ESS Portal free trial ends in 5 days. To continue using the portal after your trial ends, please upgrade to Small or Growing from your company dashboard.";
        sendEmail(to, "Your ESS Portal free trial ends in 5 days", body);
    }

    public void sendFreeTrialExpirationReminder(String to) {
        String body = "Your free trial ends today. To continue using ESS Portal, please upgrade your plan from your company dashboard.";
        sendEmail(to, "Your ESS Portal free trial ends today", body);
    }

    public void sendSubscriptionPaymentSucceeded(String to, String planName) {
        String body = "Your ESS Portal subscription payment was successful.\n"
                + "Plan: " + planName + "\n"
                + "Thank you for using ESS Portal.";

        sendEmail(to, "ESS Portal subscription payment successful", body);
    }

    public void sendSubscriptionPaymentFailed(String to) {
        String body = "Your ESS Portal subscription payment failed. Please update your payment method to avoid losing access.";
        sendEmail(to, "ESS Portal subscription payment failed", body);
    }

    public void sendSubscriptionCanceled(String to) {
        String body = "Your ESS Portal subscription has been canceled. No further subscription payments will occur.";
        sendEmail(to, "ESS Portal subscription canceled", body);
    }

    public void sendEmail(String to, String subject, String body) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendWithResend(to, subject, body);
            return;
        }

        sendWithSmtp(to, subject, body);
    }

    private void sendWithResend(String to, String subject, String body) {
        String from = displayName + " <" + mailFrom + ">";

        try {
            restClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", from,
                            "to", to,
                            "subject", subject,
                            "text", body
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException ex) {
            throw new RuntimeException("Unable to send password reset email.", ex);
        }
    }

    private void sendWithSmtp(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(new InternetAddress(mailFrom, displayName));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException ex) {
            throw new RuntimeException("Unable to send password reset email.");
        }
    }
}
