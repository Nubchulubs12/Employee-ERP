package com.example.erp.models;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CompanyPlanTest {

    @Test
    void planEmployeeLimitsMatchTierRules() {
        assertEquals(10, CompanyPlan.TRIAL.getEmployeeLimit());
        assertEquals(25, CompanyPlan.SMALL.getEmployeeLimit());
        assertEquals(100, CompanyPlan.GROWING.getEmployeeLimit());
    }

    @Test
    void missingOrLegacyFreePlanDefaultsToTrial() {
        assertEquals(CompanyPlan.TRIAL, CompanyPlan.fromCode(null));
        assertEquals(CompanyPlan.TRIAL, CompanyPlan.fromCode(""));
        assertEquals(CompanyPlan.TRIAL, CompanyPlan.fromCode("FREE"));
    }
}
