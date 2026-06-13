# Benchline AI Data Processing Disclosure

**Last Updated: June 13, 2026**

> **NOTICE: This document is a first draft prepared for attorney review. It has not been finalized by a licensed attorney and should not be relied upon as legal advice or as a final legal document. The NY-barred co-founder must review and approve before publication.**

---

## 1. Overview

Benchline uses artificial intelligence technology to assist with processing Outcome Reports submitted by Per Diem attorneys following court appearances. This disclosure explains, in plain language:

- What AI processing we use;
- What data is sent to the AI system and what happens to it;
- The zero-data-retention guarantee that applies to this processing;
- How we protect the information before sending it;
- What the AI produces and where that output is stored;
- Your rights, including the right to opt out entirely; and
- How to contact us with questions.

This disclosure is incorporated into and should be read alongside our [Terms of Service](#) and [Privacy Policy](#). Defined terms used herein have the meanings given in those documents.

---

## 2. What AI Processing We Perform

### 2.1 The Outcome Report Use Case

After each court Appearance, the Per Diem attorney is required to submit an **Outcome Report** describing what occurred at the proceeding. Outcome Reports typically contain:

- A description of the court proceeding, including the judge's comments, any orders entered, adjourned dates, and procedural instructions;
- Next steps and any deadlines the Litigator needs to be aware of; and
- General observational notes about the proceeding.

**Benchline uses an AI language model to transform the Per Diem's free-text Outcome Report into a structured, standardized summary** that is more immediately useful to the Litigator, including organized sections for: (a) Summary of Proceedings, (b) Court Orders and Decisions, (c) Next Steps and Deadlines, (d) Risk Flags and Items Requiring Immediate Attention, and (e) General Observations.

### 2.2 AI Model and Provider

We use **AWS Bedrock**, Amazon Web Services' managed AI service, to access **Anthropic's Claude** large language model. AWS Bedrock provides access to foundation models in a managed, enterprise-grade infrastructure environment.

Benchline selected AWS Bedrock specifically because of its **zero data retention guarantee** for API-based inference, described in detail in Section 4 below.

---

## 3. What Data Is Sent to the AI System

### 3.1 Input: Outcome Report Text

The primary input to the AI model is the free-text Outcome Report submitted by the Per Diem. This report may contain:

- Descriptions of court proceedings;
- Judge names and comments;
- Procedural observations;
- Dates and deadlines; and
- General notes about the matter.

### 3.2 Client-Side Redaction Before Transmission

Before transmitting Outcome Report text to AWS Bedrock, Benchline applies a **client-side redaction step** to remove or replace certain identifying information where technically feasible. Specifically, Benchline's systems will attempt to redact or pseudonymize:

- The full case caption (plaintiff v. defendant);
- The index number / case number;
- The full names of parties (replaced with placeholders, e.g., "Party A," "Party B");
- The judge's name (replaced with a placeholder, e.g., "the presiding judge"); and
- Any attorney bar numbers that appear in the report text.

**Important limitation:** Redaction is applied on a best-efforts basis using automated pattern matching. It is not guaranteed to catch all identifying information, particularly information in non-standard formats or embedded in narrative text. **Per Diem attorneys should be aware of this limitation and should draft Outcome Reports using minimal identifying information where possible.**

> **[NOTICE: For attorney review]** The adequacy of automated redaction as a protection for attorney-client privileged information, client confidential information, and court record information is an important question. Consider whether the disclosure should be stronger — e.g., recommending that Per Diems avoid naming parties at all in Outcome Reports, or whether a mandatory structured template (with no free-text fields for party names) is a better design approach that reduces legal risk.

### 3.3 System Prompt

In addition to the Outcome Report text, we send a system prompt (Benchline's instructions to the AI model) describing the desired format of the structured output. The system prompt does not contain any User personal data.

---

## 4. Zero Data Retention — What This Means

This is the most important protection in this disclosure. **AWS Bedrock's API-based inference operates with zero data retention by default.** This means:

- **Your Outcome Report text is not stored by Amazon Web Services after the API response is returned.**
- **The AI-generated output is not stored by Amazon Web Services or Anthropic after the API response is returned.**
- **Amazon Web Services does not use your data to train or improve AI models.**
- **Anthropic does not have access to your data submitted through AWS Bedrock.** AWS Bedrock is an AWS-managed service; Anthropic provides the model weights to AWS but does not receive or process your inference requests.
- **No human at Amazon Web Services or Anthropic reviews the content of your Outcome Reports.**

This is governed by AWS's contractual commitments in its [AWS Service Terms](https://aws.amazon.com/service-terms/) and AWS's data processing addendum for business customers. Benchline's AWS configuration is set to use only the zero-retention inference API endpoints.

> **[NOTICE: For attorney review]** The co-founder should review Benchline's specific AWS Bedrock service agreement to confirm that zero-retention is contractually guaranteed, not merely a default setting that could be changed. If Benchline has an AWS Enterprise Agreement or BAA-tier agreement, this section should be updated to reflect those specific contractual protections.

---

## 5. What the AI Produces and Where It Is Stored

### 5.1 Structured Output

The AI model returns a structured JSON object containing the summarized sections of the Outcome Report (Summary, Orders, Next Steps, Risk Flags, Observations). This output is returned to Benchline's server at the moment of the API response.

### 5.2 Storage in Benchline's Database

The AI-generated structured output is stored in **Benchline's Supabase database**, associated with the relevant Appearance record. This output is:

- Accessible to the relevant Litigator (the Posting creator) and the relevant Per Diem (the Claim holder) through their Platform accounts;
- Protected by **row-level security (RLS)** policies that prevent any other User or platform administrator from accessing the record without specific authorization;
- Encrypted at rest in Supabase's database infrastructure; and
- Retained for five (5) years from the date of the Appearance, consistent with the data retention schedule in our Privacy Policy.

### 5.3 Original Outcome Report

The original unstructured Outcome Report submitted by the Per Diem is also stored in Benchline's database under the same RLS and retention policies. You may request access to the original report at any time through your Platform account.

---

## 6. No Use for Training

Benchline does not use Outcome Reports, case metadata, or any other User data to train, fine-tune, or otherwise improve any AI model, whether Benchline's own or a third party's. The AI processing described in this disclosure is inference-only (input → output, processed in real time), not training.

---

## 7. Attorney-Client Privilege and Confidentiality Considerations

Benchline recognizes that Outcome Reports may contain information that is:

- Subject to the attorney-client privilege of the Litigator's client;
- Protected as attorney work product;
- Subject to court confidentiality orders or sealing requirements; or
- Subject to the Per Diem's independent duty of confidentiality under NY RPC Rule 1.6.

The protections described in this disclosure — including pre-transmission redaction and AWS Bedrock's zero data retention — are designed to minimize the exposure of privileged and confidential information. However:

- **Litigators and Per Diems bear independent professional responsibility** for the information they share or include in Platform content.
- Benchline's processing of Outcome Reports through AWS Bedrock is carried out as a service provider acting on the instructions of Users, not as an independent user of that information.
- The disclosure of information to a third-party service provider for the operational purpose of running the Platform is generally not treated as a waiver of attorney-client privilege under New York law, where such disclosure is made in confidence and for a limited purpose consistent with the representation, consistent with the principles underlying N.Y. Evid. Rule 506 and the common interest doctrine as applied in New York courts.

> **[NOTICE: For attorney review]** The privilege analysis is nuanced. The co-founder should review whether the Kovel doctrine (United States v. Kovel, 296 F.2d 918 (2d Cir. 1961)) or its New York state equivalents support the proposition that disclosure to Benchline as a service provider does not waive attorney-client privilege. A brief summary of the applicable analysis, or a direction to review Kovel before launch, would be valuable here. Consider whether Benchline should execute a confidentiality undertaking with Users specifically with respect to privileged information.

---

## 8. Your Right to Opt Out

### 8.1 Opting Out

**You may opt out of AI-assisted processing of your Outcome Reports at any time.** To opt out:

- **In your account settings:** Navigate to Settings → AI Processing → Disable AI-Assisted Reports; or
- **By contacting us:** Email privacy@benchline.com with the subject line "AI Processing Opt-Out" and your account email address.

Your opt-out preference will take effect within twenty-four (24) hours of your request.

### 8.2 What Happens When You Opt Out

If you opt out of AI processing:

- Your Outcome Reports will be delivered to the Litigator in the original unstructured text form you submitted, without AI-generated summarization.
- Your Outcome Reports will still be stored in Benchline's database under the same security and retention policies.
- You remain required to submit a complete and accurate Outcome Report meeting the content requirements in the Per Diem Agreement.
- Opting out does not reduce your obligations under the Per Diem Agreement or affect your compensation.

### 8.3 Litigator Preferences

> **[NOTICE: For attorney review]** Consider whether Litigators should also have a preference setting to request that Postings under their account be exempt from AI processing of associated Outcome Reports, and whether this creates product complexity or misaligned incentives that should be addressed before launch.

---

## 9. Future AI Use Cases

Benchline may in the future apply AI-assisted tools to additional aspects of the Platform, including but not limited to: automated conflict screening, bar status monitoring, or scheduling optimization. Any material new AI use case that involves personal data, attorney-client information, or privileged matter information will be disclosed to Users via an updated disclosure and, where required, with an opportunity to opt out, before the new use case is launched.

---

## 10. Data Subject Rights

For requests to access, delete, or correct your personal data (including AI-generated outputs stored in our database), see Section 6 of our [Privacy Policy](#). To specifically request deletion of AI-generated Outcome Report summaries associated with your account, contact privacy@benchline.com.

---

## 11. Contact Us

If you have questions about this AI Data Processing Disclosure or about how your Outcome Reports are processed, contact:

**Benchline LLC**
[Address — to be added]
Email: privacy@benchline.com
Website: benchline.com

---

## 12. Summary Table

For quick reference:

| Question | Answer |
|---|---|
| What AI system is used? | AWS Bedrock (Anthropic Claude model) |
| Who processes the data? | AWS Bedrock (Amazon Web Services) |
| Does AWS store your data? | No — zero data retention after API response |
| Does Anthropic receive your data? | No — Anthropic provides model weights to AWS; they do not receive inference requests |
| Is data used to train AI models? | No |
| Do humans at AWS/Anthropic see your data? | No |
| Is redaction applied before transmission? | Yes — case caption, index number, party names, judge name (best-efforts automated) |
| Where is the AI output stored? | Benchline's database (Supabase), encrypted, RLS-protected |
| Can you opt out? | Yes — in account settings or by emailing privacy@benchline.com |
| What if you opt out? | You submit unstructured reports only; no other change to your account |

---

*This AI Data Processing Disclosure is a first draft prepared for attorney review and is not final. Do not publish without review and approval by Benchline's NY-barred co-founder and/or outside counsel.*
