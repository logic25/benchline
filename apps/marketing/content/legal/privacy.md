# Benchline Privacy Policy

**Last Updated: June 13, 2026**

> **NOTICE: This document is a first draft prepared for attorney review. It has not been finalized by a licensed attorney and should not be relied upon as legal advice or as a final legal document. The NY-barred co-founder must review and approve before publication.**

---

## 1. Introduction

Benchline LLC ("**Benchline**," "**we**," "**our**," or "**us**") operates the Benchline Platform at benchline.com and related applications (the "**Platform**"). This Privacy Policy explains how we collect, use, share, and protect information about you when you use the Platform.

By creating an account or using the Platform, you acknowledge that you have read and understood this Privacy Policy. Please read it carefully.

This Policy applies to all Users of the Platform, including both Litigators and Per Diem attorneys. Defined terms used herein have the meanings given in our [Terms of Service](#).

---

## 2. Information We Collect

We collect information in the following ways:

### 2.1 Information You Provide Directly

**Account Information:** When you register, we collect your full legal name, email address, phone number, New York State bar admission number, bar admission date, and any professional license or certificate information you provide.

**Profile Information:** We collect your law firm or organization name, practice area(s), location (county), professional biography, and photograph if you choose to upload one.

**Case and Appearance Information:** When Litigators create Postings, we collect court name, matter type, index number, appearance date and time, the name of opposing counsel (for conflict screening), appearance instructions, and the Appearance Fee. This information is referred to as "**Case Metadata**."

**Outcome Reports:** After an Appearance, Per Diems submit Outcome Reports describing what occurred. These reports may contain details about court proceedings, judge observations, procedural history, and next steps.

**Insurance Information (Per Diems):** We collect malpractice insurance carrier name, policy number, coverage amounts, and policy expiration date.

**Communications:** If you contact us by email or through the Platform's messaging features, we collect and retain those communications.

**Payment Information:** We collect limited payment information as described in Section 2.3 below.

### 2.2 Information Collected Automatically

When you use the Platform, we automatically collect:

- **Usage Data:** Pages visited, features used, timestamps, search queries, click events, and navigation paths within the Platform;
- **Log Data:** IP address, browser type and version, operating system, referring URL, and error logs;
- **Device Information:** Device type, device identifiers, and time zone settings;
- **Cookies and Similar Technologies:** See Section 9 (Cookies) for details.

### 2.3 Payment Information

Payment processing is handled by **Stripe, Inc.** and **Stripe Connect**. Benchline does not directly store your full credit card number, bank account number, or other sensitive financial account credentials. Stripe collects and processes payment information directly and in accordance with its own [Privacy Policy](https://stripe.com/privacy) and PCI DSS compliance standards. Benchline receives and stores limited payment records including: transaction IDs, payout amounts, payout status, last four digits of the card or bank account on file, and billing address for fraud prevention purposes.

### 2.4 Bar and Professional Information

We may collect and store publicly available bar admission records from the New York State Unified Court System's Attorney Online Services or other public databases, used for the purpose of verifying and monitoring attorney eligibility as described in our Terms of Service.

### 2.5 Information from Third Parties

We may receive information about you from third parties, including:

- **Stripe:** Payment status, account verification status, and identity verification outcomes;
- **Twilio:** SMS delivery status and phone number verification outcomes;
- **Resend:** Email delivery status and bounce information.

---

## 3. How We Use Your Information

We use information collected about you for the following purposes:

### 3.1 Providing the Platform

- To create and manage your account;
- To verify your bar admission and professional eligibility;
- To match Litigators with available Per Diems;
- To facilitate conflict-of-interest screening;
- To process and disburse payments via Stripe Connect;
- To process Outcome Reports, including via AI-assisted tools (see Section 4.3 and our [AI Data Processing Disclosure](#));
- To send you transactional communications via email (through **Resend**) and SMS (through **Twilio**), including booking confirmations, payment notifications, and Outcome Report reminders; and
- To provide customer support.

### 3.2 Safety, Security, and Legal Compliance

- To verify identities and prevent fraud, unauthorized access, and off-platform circumvention;
- To enforce our Terms of Service and Agreements;
- To comply with applicable law, including responding to lawful subpoenas, court orders, and regulatory inquiries;
- To protect the rights, property, or safety of Benchline, Users, and the public; and
- To detect and prevent money laundering and other financial crimes.

### 3.3 Platform Improvement

- To analyze usage patterns and improve Platform features and user experience;
- To conduct internal research and development; and
- To generate aggregate, de-identified analytics (which we may share with investors or business partners).

### 3.4 Legal Basis for Processing

> **[NOTICE: For attorney review]** New York does not currently have a comprehensive consumer privacy statute requiring disclosure of legal bases for processing in the same manner as GDPR. However, the NY SHIELD Act (N.Y. Gen. Bus. Law § 899-aa et seq.) and potential future NY comprehensive privacy legislation may warrant a more detailed legal basis disclosure. Review whether this section should be expanded, particularly given that attorney-users may have heightened sensitivity to data handling.

We process your information based on: (a) the necessity to perform our contract with you (i.e., to provide the Platform); (b) our legitimate interests in operating a secure and lawful business; and (c) compliance with our legal obligations.

---

## 4. How We Share Your Information

We do not sell your personal information to third parties. We share your information only as described in this Section.

### 4.1 With Other Users (Limited)

When a Litigator posts an Appearance, certain information from that Posting (court name, appearance date, matter type, and general instructions) is displayed to eligible Per Diems for matching purposes. The Litigator's identity is disclosed to the matched Per Diem once a Claim is confirmed. Per Diem profile information (name, bar number, photo, and experience summary) is displayed to Litigators for matching and booking purposes.

Sensitive case details, including full index numbers and party names, are handled in accordance with the AI Data Processing Disclosure and are subject to client-side redaction before AI processing where feasible.

### 4.2 With Service Providers (Data Processors)

We share data with the following service providers who process data on our behalf, subject to contractual data processing agreements:

| Provider | Purpose | Data Shared |
|---|---|---|
| **Stripe, Inc.** | Payment processing, identity verification | Payment data, identity data |
| **Amazon Web Services / AWS Bedrock** | AI processing of Outcome Reports | Outcome Report text (redacted); zero data retention by AWS after API response |
| **Supabase** | Database hosting and infrastructure | All Platform data (subject to RLS controls) |
| **Resend** | Transactional email delivery | Email address, email content |
| **Twilio** | SMS notifications | Phone number, SMS content |

### 4.3 AWS Bedrock — AI Processing

**IMPORTANT:** Outcome Report content submitted by Per Diems is processed using AWS Bedrock, which provides access to Anthropic's Claude AI model. **AWS Bedrock operates under a zero data retention policy: your input data and the AI-generated output are not stored by Amazon Web Services or Anthropic after the API response is returned.** Benchline applies client-side redaction of case caption, index number, party names, and judge name before transmitting data to AWS Bedrock where technically feasible. The AI-generated structured output is stored only in Benchline's own database, protected by row-level security controls. For a full explanation, see our [AI Data Processing Disclosure](#).

### 4.4 Legal and Safety Disclosures

We may disclose your information to government authorities, courts, or law enforcement if required by applicable law, legal process, or to protect the safety of any person or to investigate fraud or professional misconduct.

### 4.5 Business Transfers

If Benchline is involved in a merger, acquisition, sale of assets, or bankruptcy proceeding, your information may be transferred as part of that transaction. We will notify you via email and/or Platform notice before your personal information is transferred and becomes subject to a different privacy policy.

### 4.6 With Your Consent

We may share your information for other purposes with your explicit consent.

---

## 5. Data Retention

We retain your personal information for as long as your account is active or as needed to provide the Platform. Specific retention periods:

| Data Type | Retention Period |
|---|---|
| Account information | Duration of account + 3 years after closure |
| Case Metadata and Postings | 5 years from creation (to assist with bar-related or malpractice disputes) |
| Outcome Reports | 5 years from submission |
| Payment records | 7 years (for tax and legal compliance) |
| Bar verification records | Duration of account + 3 years |
| Malpractice insurance records | Duration of account + 3 years |
| Usage logs and IP addresses | 12 months |
| Support communications | 3 years |

> **[NOTICE: For attorney review]** Confirm these retention periods are appropriate given potential malpractice statutes of limitation (NY CPLR § 214-a for legal malpractice is 3 years; some claims involving minors may extend further), court record-keeping practices, and bar disciplinary investigation timelines.

After the applicable retention period, we delete or de-identify personal information unless further retention is required by law.

---

## 6. Your Rights and Choices

### 6.1 Access and Correction

You may access and update your account information at any time through your account settings. If you cannot correct information through your account settings, contact us at privacy@benchline.com.

### 6.2 Deletion

You may request deletion of your personal information by contacting us at privacy@benchline.com. We will honor deletion requests except where we are required or permitted to retain certain data (e.g., for legal compliance, fraud prevention, or dispute resolution). Deletion of your account data does not affect information already disclosed to other Users or incorporated into our aggregate analytics.

### 6.3 Data Portability

You may request a copy of the personal data you have provided to Benchline in a structured, commonly used, machine-readable format by contacting privacy@benchline.com.

### 6.4 Opt-Out of AI Processing

You may opt out of AI-assisted processing of your Outcome Reports at any time by adjusting your account settings or contacting us at privacy@benchline.com. If you opt out, you will still be required to submit a complete Outcome Report in unstructured text form.

### 6.5 Marketing Communications

Benchline may send you promotional emails about Platform updates or new features. You may opt out of marketing emails at any time by clicking "Unsubscribe" in any marketing email or by contacting us. Opting out of marketing communications does not affect transactional communications (booking confirmations, payment receipts, etc.), which are necessary for the provision of the Platform.

### 6.6 SMS Notifications

If you opt in to SMS notifications, you may opt out at any time by texting STOP to any SMS message from Benchline or by contacting us. Standard carrier message and data rates may apply.

---

## 7. Security

We take reasonable technical and organizational measures to protect your information, including:

- **Encryption in Transit:** All data transmitted between your browser or device and our servers is encrypted using TLS (Transport Layer Security) 1.2 or higher.
- **Encryption at Rest:** Personal data stored in our Supabase database is encrypted at rest.
- **Row-Level Security (RLS):** Our database employs RLS policies so that Users can access only their own data and data explicitly shared with them through Platform functions.
- **Access Controls:** Access to personal data within Benchline is limited to personnel with a need to access it for business purposes.
- **Payment Security:** All payment data is processed and stored by Stripe in accordance with PCI DSS standards.

No method of data transmission or storage is completely secure. We cannot guarantee absolute security, and you use the Platform at your own risk with respect to security. If you believe your account has been compromised, contact us immediately at support@benchline.com.

In the event of a data breach affecting your personal information, we will notify you as required by applicable law, including the New York SHIELD Act (N.Y. Gen. Bus. Law § 899-bb).

---

## 8. Cookies and Tracking Technologies

### 8.1 What We Use

Benchline uses the following types of cookies and similar technologies:

- **Strictly Necessary Cookies:** Required for the Platform to function, including session authentication tokens.
- **Functional Cookies:** Remember your preferences and settings (e.g., county filter settings).
- **Analytics Cookies:** Collect aggregate information about how Users interact with the Platform to help us improve it (e.g., page views, feature usage).

We do not currently use advertising or targeting cookies.

### 8.2 Managing Cookies

You can manage cookies through your browser settings. Disabling strictly necessary cookies will impair your ability to use the Platform. Disabling other cookies will not prevent you from using the Platform's core features.

---

## 9. Children's Privacy

The Platform is not intended for use by persons under the age of eighteen (18). We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected personal information from a person under 18 without appropriate consent, we will take steps to delete it promptly. If you believe a person under 18 has provided personal information through our Platform, please contact us at privacy@benchline.com.

---

## 10. New York SHIELD Act Compliance

As a business that collects private information of New York residents, Benchline maintains a reasonable data security program that includes the administrative, technical, and physical safeguards described in Section 7 above, consistent with the requirements of the New York Stop Hacks and Improve Electronic Data Security (SHIELD) Act, N.Y. Gen. Bus. Law § 899-bb.

In the event of a "breach of the security of the system" as defined under N.Y. Gen. Bus. Law § 899-aa, Benchline will provide timely notification to affected New York residents and to the New York Attorney General's office, the Department of State, and the Division of State Police, as required by law.

> **[NOTICE: For attorney review]** Confirm the SHIELD Act notification obligations and timeline (in the most expedient time possible and without unreasonable delay) are accurately captured, and whether any additional notice obligations apply under other New York statutes or regulations applicable to professional services platforms.

---

## 11. California Privacy Rights (CCPA/CPRA)

While Benchline is a New York-based platform serving New York-barred attorneys, some Users may be California residents. To the extent the California Consumer Privacy Act (as amended by the California Privacy Rights Act, "**CCPA/CPRA**") applies, California residents have the following rights:

- The right to **know** what personal information we collect, use, disclose, and sell;
- The right to **delete** personal information we have collected;
- The right to **correct** inaccurate personal information;
- The right to **opt out of sale or sharing** of personal information (Benchline does not sell or share personal information for cross-context behavioral advertising);
- The right to **limit use** of sensitive personal information (we do not use sensitive personal information for purposes beyond those specified in this Policy); and
- The right to **non-discrimination** for exercising these rights.

To exercise CCPA/CPRA rights, contact us at privacy@benchline.com. We will respond within forty-five (45) days as required by law.

> **[NOTICE: For attorney review]** Because Benchline serves only NY-barred attorneys and operates exclusively in New York at launch, the practical applicability of CCPA is likely limited. The co-founder should advise whether a full CCPA section is warranted, especially given that bar admission in New York alone is a threshold eligibility requirement.

---

## 12. Attorney-Specific Considerations

Benchline is a platform used exclusively by licensed attorneys. We recognize that:

- Information shared on the Platform may be subject to attorney-client privilege or work product protection, to the extent applicable to the attorney-client relationships of our Users;
- Benchline acts as a data processor for such information and does not claim any right to use it other than to provide the Platform;
- Benchline will resist requests for disclosure of potentially privileged User data to the extent permitted by law and will notify affected Users of any legal process seeking such data, unless prohibited from doing so.

> **[NOTICE: For attorney review]** Consider whether the Platform should include explicit provisions regarding Benchline's obligations if served with a subpoena or court order seeking attorney-client or work-product-protected data belonging to a User's client.

---

## 13. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by email to your registered address and/or by prominent notice on the Platform at least fourteen (14) days before the changes take effect. We encourage you to review this Policy periodically.

---

## 14. Contact Us

For questions, concerns, or to exercise your data rights, contact:

**Privacy Officer**
Benchline LLC
[Address — to be added]
Email: privacy@benchline.com

We will respond to requests within a reasonable time, and in any case within the timeframe required by applicable law.

---

*This Privacy Policy is a first draft prepared for attorney review and is not final. Do not publish without review and approval by Benchline's NY-barred co-founder and/or outside counsel.*
