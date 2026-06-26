import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  requestPasswordResetCode,
  resetPassword,
  verifyPasswordResetCode,
} from "../api/authApi";

function ForgotPassword() {
  const location = useLocation();
  const initialAccountType = location.state?.accountType || "EMPLOYEE";

  const [accountType, setAccountType] = useState(initialAccountType);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestCode(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await requestPasswordResetCode({ email, accountType });
      setMessage(result);
      setStep("verify");
    } catch (err) {
      setError(err.message || "Unable to send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await verifyPasswordResetCode({ email, accountType, code });
      setMessage("Code verified. Enter your new password.");
      setStep("reset");
    } catch (err) {
      setError(err.message || "Invalid or expired reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ email, accountType, code, newPassword });
      setStep("success");
      setMessage("Password reset successfully.");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Forgot Password</h1>
        <p className="register-subtext">Reset access for your ESS Portal account.</p>

        {step === "request" && (
          <form onSubmit={handleRequestCode} className="register-form forgot-password-form">
            <label>
              Account Type
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="COMPANY">Company</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyCode} className="register-form forgot-password-form">
            <label>
              5 Digit Code
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength="5"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </label>
            <button type="submit" disabled={loading || code.length !== 5}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="register-form forgot-password-form">
            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength="8"
                required
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength="8"
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Submit New Password"}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="forgot-password-success">
            <Link
              className="forgot-password-login-link"
              to={accountType === "COMPANY" ? "/login/company" : "/login"}
            >
              Back to login
            </Link>
          </div>
        )}

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;
