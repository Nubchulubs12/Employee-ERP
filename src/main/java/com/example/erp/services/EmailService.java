package com.example.erp.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String displayName;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from}") String mailFrom,
                        @Value("${app.mail.display-name}") String displayName) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.displayName = displayName;
    }

    public void sendPasswordResetCode(String to, String code) {
        String body = "Your ESS Portal password reset code is:\n\n"
                + code
                + "\n\nThis code expires in 15 minutes.\n\n"
                + "If you did not request this password reset, you can ignore this email.";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(new InternetAddress(mailFrom, displayName));
            helper.setTo(to);
            helper.setSubject("ESS Portal Password Reset Code");
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException ex) {
            throw new RuntimeException("Unable to send password reset email.");
        }
    }
}
