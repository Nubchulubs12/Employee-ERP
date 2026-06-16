import { Link } from "react-router-dom";
import "../App.css";

const plans = [
  {
    name: "Free Trial",
    range: "30 Days",
    description: "Up to 25 Employees",
    action: "Start Free Trial",
    to: "/register",
    featured: false,
    features: [
      "Full portal access",
      "Time tracking setup",
      "PTO request workflow",
      "Document storage preview",
    ],
  },
  {
    name: "Small Business",
    range: "1-25 Employees",
    description: "Built for lean teams getting payroll and HR organized.",
    action: "Choose Small",
    to: "/register",
    featured: true,
    features: [
      "Time Tracking",
      "PTO Management",
      "Documents",
      "Payroll Summary",
    ],
  },
  {
    name: "Growing Business",
    range: "26-100 Employees",
    description: "More room for growing companies with the same simple workflow.",
    action: "Choose Growing",
    to: "/register",
    featured: false,
    features: [
      "Time Tracking",
      "PTO Management",
      "Documents",
      "Payroll Summary",
    ],
  },
];

function Pricing() {
  return (
    <main className="pricing-page">
      <section className="pricing-hero">
        <div>
          <span className="pricing-eyebrow">Simple ESS pricing</span>
          <h1>Choose the plan that fits your team.</h1>
          <p>
            Start with a professional employee self service portal for time,
            PTO, documents, and payroll summaries.
          </p>
        </div>
      </section>

      <section className="pricing-grid" aria-label="Pricing plans">
        {plans.map((plan) => (
          <article
            key={plan.name}
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

            <Link
              to={plan.to}
              className={`pricing-action${plan.featured ? " pricing-action--primary" : ""}`}
            >
              {plan.action}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Pricing;
