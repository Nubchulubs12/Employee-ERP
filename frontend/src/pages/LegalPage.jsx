import LegalPageLayout from "../components/LegalPageLayout";
import { legalDocuments } from "../content/legalDocuments";
const documents = { terms:["Terms of Service",legalDocuments.terms], privacy:["Privacy Policy",legalDocuments.privacy], subscription:["Subscription and Billing Terms",legalDocuments.subscription], retention:["Data Retention and Deletion Policy",legalDocuments.retention], payroll:["Payroll Disclaimer",legalDocuments.payroll] };
export default function LegalPage({ document: key }) { const [title,document] = documents[key]; return <LegalPageLayout title={title} document={document} />; }
