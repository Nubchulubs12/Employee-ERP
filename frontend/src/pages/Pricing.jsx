import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCompanyById, startStripeBillingSession, updateCompanyPlan } from "../api/companyApi";
import "../App.css";

const plans = [
  {
    code: "TRIAL",
    name: "Free Trial",
    range: "30 days",
    description: "Try the portal for 30 days. After trial ends your account becomes read-only until you choose a paid plan. No automatic charges.",
    action: "Start Free Trial",
    to: "/register?plan=TRIAL",
    featured: false,
    features: [
        "1-10 Employees",
      "Full portal access",
      "Time tracking setup",
      "PTO request workflow",
      "Document storage preview",
    ],
  },
  {
    code: "SMALL",
    name: "Small",
    range: "Up to 25 employees",
    description: "Built for lean teams getting payroll and HR organized.",
    action: "Choose Small",
    to: "/register?plan=SMALL",
    featured: true,
    features: [
        "1-25 Employees",
      "Time Tracking",
      "PTO Management",
      "Documents",
      "Payroll Summary",
    ],
  },
  {
    code: "GROWING",
    name: "Growing",
    range: "Up to 100 employees",
    description: "More room for growing companies with the same simple workflow.",
    action: "Choose Growing",
    to: "/register?plan=GROWING",
    featured: false,
    features: [
        "Up to 100 Employees",
      "Time Tracking",
      "PTO Management",
      "Documents",
      "Payroll Summary",
    ],
  },
];

function getStoredCompanyId() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.userType === "company" ? user.id : null;
  } catch {
    return null;
  }
}

function updateStoredCompany(updatedCompany) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.userType === "company" && Number(user.id) === Number(updatedCompany.id)) {
      localStorage.setItem("user", JSON.stringify({ ...user, ...updatedCompany, userType: "company" }));
    }
  } catch {
    // Ignore invalid local storage; the saved plan still comes from the API response.
  }
}

function getPlanDisplayName(company) {
  if (company?.planCode === "TRIAL") {
    return "Free Trial";
  }

  return company?.planName || "Free Trial";
}

function getUpgradeActionLabel(company, plan) {
  if (company?.planCode === "GROWING" && plan.code === "SMALL") {
    return "Downgrade to Small";
  }

  return `Upgrade to ${plan.name}`;
}

function isInternalAccount(company) {
  return company?.billingStatus === "INTERNAL";
}

function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const upgradeCompanyId = searchParams.get("upgradeCompanyId") || getStoredCompanyId();

  const [company, setCompany] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const checkoutStatus = searchParams.get("checkout");

  const isUpgradeMode = Boolean(upgradeCompanyId);

  useEffect(() => {
    async function loadCompany() {
      if (!upgradeCompanyId) return;

      try {
        const data = await fetchCompanyById(upgradeCompanyId);
        setCompany(data);
      } catch (err) {
        setError(err.message || "Failed to load company plan.");
      }
    }

    loadCompany();
  }, [upgradeCompanyId]);

  function handlePlanClick(plan) {
    setError("");
    setMessage("");

    if (!isUpgradeMode) {
      navigate(plan.to);
      return;
    }

    if (company?.planCode === plan.code) {
      setMessage(`${plan.name} is already your current plan.`);
      return;
    }

    setSelectedPlan(plan);
  }

  async function handleConfirmUpgrade() {
    if (!selectedPlan || !upgradeCompanyId) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (selectedPlan.code !== "TRIAL" && !isInternalAccount(company)) {
        const session = await startStripeBillingSession(upgradeCompanyId, selectedPlan.code);
        if (session.url?.includes(`/companies/${upgradeCompanyId}`)) {
          setSelectedPlan(null);
          setMessage(`${selectedPlan.name} will be used for future subscription billing.`);
          const refreshedCompany = await fetchCompanyById(upgradeCompanyId);
          setCompany(refreshedCompany);
          updateStoredCompany(refreshedCompany);
          return;
        }
        window.location.href = session.url;
        return;
      }

      const updatedCompany = await updateCompanyPlan(upgradeCompanyId, selectedPlan.code);
      updateStoredCompany(updatedCompany);
      navigate(`/companies/${updatedCompany.id}`);
    } catch (err) {
      setError(err.message || "Failed to update company plan.");
      setSelectedPlan(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pricing-page">
      <section className="pricing-hero">
        <div>
          <span className="pricing-eyebrow">
            {isInternalAccount(company) ? "Internal ESS account" : isUpgradeMode ? "Upgrade your ESS plan" : "Simple ESS pricing"}
          </span>
          <h1>Choose the plan that fits your team.</h1>
          <p>
            {isUpgradeMode && company
              ? isInternalAccount(company)
                ? `${company.name} is an internal account. Plan changes do not use Stripe billing.`
                : `${company.name} is currently on the ${getPlanDisplayName(company)} plan.`
              : "Start with a professional employee self service portal for time, PTO, documents, and payroll summaries."}
          </p>
        </div>
      </section>

      {(message || error) && (
        <div className="pricing-status">
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {checkoutStatus === "success" && (
        <div className="pricing-status">
          <p className="success-message">Stripe checkout completed. Your plan will update after Stripe confirms the subscription.</p>
        </div>
      )}

      {checkoutStatus === "cancel" && (
        <div className="pricing-status">
          <p className="error-message">Stripe checkout was canceled. No billing changes were made.</p>
        </div>
      )}

      <section className="pricing-grid" aria-label="Pricing plans">
        {plans.map((plan) => {
          const isCurrentPlan = company?.planCode === plan.code;
          const hideAction = isUpgradeMode
            && ["SMALL", "GROWING"].includes(company?.planCode)
            && plan.code === "TRIAL";

          return (
            <article
              key={plan.code}
              className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}
            >
              {plan.featured && <span className="pricing-badge">Best fit</span>}

              <div className="pricing-card-header">
                <h2>{plan.name}</h2>
                <strong>{plan.range}</strong>
                <p>{plan.description}</p>
              </div>

              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {!hideAction && (
                <button
                  type="button"
                  disabled={isCurrentPlan || saving}
                  onClick={() => handlePlanClick(plan)}
                  className={`pricing-action${plan.featured ? " pricing-action--primary" : ""}${isCurrentPlan ? " pricing-action--current" : ""}`}
                >
                  {isCurrentPlan ? "Current plan" : isUpgradeMode ? isInternalAccount(company) ? `Switch to ${plan.name}` : getUpgradeActionLabel(company, plan) : plan.action}
                </button>
              )}
            </article>
          );
        })}
      </section>

      {selectedPlan && (
        <div className="plan-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-confirm-title">
          <div className="plan-confirm-modal">
            <h2 id="plan-confirm-title">Are you sure you want to upgrade?</h2>
            <p>
              This will update {company?.name || "your company"} to the {selectedPlan.name} plan.
            </p>
            <div className="plan-confirm-actions">
              <button type="button" onClick={handleConfirmUpgrade} disabled={saving}>
                {saving ? "Updating..." : "Yes"}
              </button>
              <button type="button" onClick={() => setSelectedPlan(null)} disabled={saving}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Pricing;
