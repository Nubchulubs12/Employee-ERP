import { Link } from "react-router-dom";
const LEGAL_LINKS = [["/terms","Terms of Service"],["/privacy","Privacy Policy"],["/subscription-terms","Subscription Terms"],["/data-retention","Data Retention Policy"],["/payroll-disclaimer","Payroll Disclaimer"],["/contact","Contact"]];
function LegalLinks({ employee = false, className = "legal-links" }) {
  const links = employee ? LEGAL_LINKS.filter(([path]) => ["/privacy","/payroll-disclaimer","/contact"].includes(path)) : LEGAL_LINKS;
  return <div className={className}>{links.map(([path,label]) => <Link key={path} to={path}>{label}</Link>)}</div>;
}
export default LegalLinks;
