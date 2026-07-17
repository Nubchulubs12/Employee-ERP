import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerCompany, startStripeBillingSession } from '../api/companyApi';

const PLANS = [
  { code: "TRIAL", name: "Free Trial", limit: "Up to 10 employees for 30 days" },
  { code: "SMALL", name: "Small", limit: "Up to 25 employees" },
  { code: "GROWING", name: "Growing", limit: "Up to 100 employees" },
];

function getPlan(code) {
  return PLANS.find((plan) => plan.code === code) || PLANS[0];
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

function isInternalAccount(company) {
  return company?.billingStatus === "INTERNAL";
}

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = getPlan(searchParams.get("plan"));

  const [formData, setFormData] = useState({
    planCode: selectedPlan.code,
    name: "",
    email: "",
    password: "",
    phone: "",
    streetAddress: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    termsAccepted: false,
    privacyAccepted: false,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      setError("You must agree to the Terms of Service and Privacy Policy before registering.");
      return;
    }
    setLoading(true);

    try {
      const createdCompany = await registerCompany(formData);
      localStorage.setItem("user", JSON.stringify(createdCompany));

      if (selectedPlan.code !== "TRIAL" && !isInternalAccount(createdCompany)) {
        const session = await startStripeBillingSession(createdCompany.id, selectedPlan.code);
        window.location.href = session.url;
        return;
      }

      setMessage("Registered successfully!");
      navigate(`/companies/${createdCompany.id}`);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Register Company</h1>
        <p className="register-subtext">Create your company account to get started.</p>

        <div className="selected-plan-summary">
          <div>
            <span>Selected plan</span>
            <strong>{getPlan(formData.planCode).name}</strong>
            <p>{getPlan(formData.planCode).limit}</p>
          </div>
          <Link to="/pricing">Change</Link>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <label>
            Plan
            <select name="planCode" value={formData.planCode} onChange={handleChange} required>
              {PLANS.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} - {plan.limit}
                </option>
              ))}
            </select>
          </label>

          <label>
            Company Name
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter company name" required />
          </label>

          <label>
            Email
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter company email" required />
          </label>

          <label>
            Password
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
          </label>

          <label>
            Phone
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 555-5555" />
          </label>

          <hr />
          <h4 style={{ margin: "8px 0 4px" }}>Address</h4>

          <label>
            Street Address
            <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="123 Main St" />
          </label>

          <label>
            Address Line 2
            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Suite, Apt, Unit (optional)" />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              City
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
            </label>
            <label>
              State / Province / Region
              <select name="state" value={formData.state} onChange={handleChange}>
                <option value="">Select state</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              ZIP / Postal Code
              <input type="text" name="zip" value={formData.zip} onChange={handleChange} placeholder="12345" />
            </label>
            <label>
              Country
              <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="United States" />
            </label>
          </div>

          <label className="legal-consent">
            <input type="checkbox" checked={formData.termsAccepted && formData.privacyAccepted} onChange={(event) => setFormData((prev) => ({ ...prev, termsAccepted: event.target.checked, privacyAccepted: event.target.checked }))} />
            <span>I have read and agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
          </label>
          {formData.planCode !== "TRIAL" && (
            <p className="subscription-notice">Monthly subscription. Cancel anytime. By subscribing, you agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/subscription-terms">Subscription Terms</Link>.</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Register;
