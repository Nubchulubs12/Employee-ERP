package com.example.erp.Dto;

import java.time.LocalDate;

public class StripeInvoiceDto {
    private LocalDate invoiceDate;
    private Long amountPaid;
    private String status;
    private String hostedInvoiceUrl;
    private String invoicePdf;

    public StripeInvoiceDto() {
    }

    public StripeInvoiceDto(LocalDate invoiceDate, Long amountPaid, String status, String hostedInvoiceUrl, String invoicePdf) {
        this.invoiceDate = invoiceDate;
        this.amountPaid = amountPaid;
        this.status = status;
        this.hostedInvoiceUrl = hostedInvoiceUrl;
        this.invoicePdf = invoicePdf;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public Long getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(Long amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getHostedInvoiceUrl() {
        return hostedInvoiceUrl;
    }

    public void setHostedInvoiceUrl(String hostedInvoiceUrl) {
        this.hostedInvoiceUrl = hostedInvoiceUrl;
    }

    public String getInvoicePdf() {
        return invoicePdf;
    }

    public void setInvoicePdf(String invoicePdf) {
        this.invoicePdf = invoicePdf;
    }
}
