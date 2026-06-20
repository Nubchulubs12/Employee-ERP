package com.example.erp.models;

import java.util.Arrays;

public enum CompanyPlan {
    TRIAL("TRIAL", "Trial", 10),
    SMALL("SMALL", "Small", 25),
    GROWING("GROWING", "Growing", 100);

    private final String code;
    private final String displayName;
    private final int employeeLimit;

    CompanyPlan(String code, String displayName, int employeeLimit) {
        this.code = code;
        this.displayName = displayName;
        this.employeeLimit = employeeLimit;
    }

    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getEmployeeLimit() {
        return employeeLimit;
    }

    public boolean isTrial() {
        return this == TRIAL;
    }

    public static CompanyPlan fromCode(String code) {
        if (code == null || code.isBlank() || code.trim().equalsIgnoreCase("FREE")) {
            return TRIAL;
        }

        return Arrays.stream(values())
                .filter(plan -> plan.code.equalsIgnoreCase(code.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown company plan: " + code));
    }
}
