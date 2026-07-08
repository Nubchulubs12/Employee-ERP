package com.example.erp.Dto;

public class StripeBillingSessionResponse {
    private String url;

    public StripeBillingSessionResponse() {
    }

    public StripeBillingSessionResponse(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
