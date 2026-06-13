export type UserRole = 'litigator' | 'per_diem' | 'both';

export type Borough = 'manhattan' | 'brooklyn' | 'bronx' | 'queens' | 'staten_island';

export type CaseType = 'civil' | 'criminal' | 'family' | 'housing' | 'commercial' | 'other';

export type AppearanceType = 'adjournment' | 'conference' | 'status_call' | 'motion' | 'hearing' | 'other';

export type AppearanceStatus = 'open' | 'claimed' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';

export type OutcomeType = 'adjourned' | 'settled' | 'dismissed' | 'granted' | 'denied' | 'default' | 'other';

export type NotificationType =
  | 'appearance_posted'
  | 'appearance_claimed'
  | 'check_in'
  | 'report_submitted'
  | 'payment_released'
  | 'review_received'
  | 'verification_reviewed'
  | 'insurance_expiring'
  | 'insurance_expired'
  | 'message_received'
  | 'dispute_update';

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'released' | 'refunded' | 'disputed' | 'failed';

export type FeeModel = 'flat' | 'percentage';

export type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';

export type BarVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired';

export type BarVerificationMethod = 'manual' | 'oca_lookup' | 'persona' | 'stripe_identity';

export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected';

export type InsuranceStatus = 'none' | 'pending' | 'verified' | 'expired';

export interface BarVerificationRequest {
  id: string;
  user_id: string;
  bar_number: string;
  bar_state: string;
  full_name_legal: string;
  evidence_url: string | null;
  status: VerificationRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface InsuranceUpload {
  id: string;
  user_id: string;
  document_url: string | null;
  carrier: string | null;
  policy_number: string | null;
  coverage_amount_cents: number | null;
  effective_date: string | null;
  expires_date: string | null;
  status: VerificationRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  user?: Profile;
}

export interface ConflictDeclaration {
  id: string;
  user_id: string;
  conflicted_party_name: string;
  conflicted_party_firm: string | null;
  conflicted_party_bar_number: string | null;
  reason: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  role: UserRole;
  bar_number: string | null;
  bar_state: string | null;
  bar_verified: boolean;
  is_admin: boolean;
  bar_verification_status: BarVerificationStatus;
  bar_verified_at: string | null;
  bar_verification_method: BarVerificationMethod | null;
  bar_verification_notes: string | null;
  bar_expires_at: string | null;
  insurance_status: InsuranceStatus;
  insurance_verified_at: string | null;
  insurance_expires_at: string | null;
  insurance_carrier: string | null;
  insurance_policy_number: string | null;
  insurance_coverage_amount_cents: number | null;
  firm_name: string | null;
  firm_bar_numbers: string[];
  ai_processing_consent: boolean;
  practice_areas: string[];
  courts_familiar: string[];
  bio: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Appearance {
  id: string;
  posted_by: string;
  claimed_by: string | null;
  status: AppearanceStatus;
  court_name: string;
  court_address: string;
  borough: Borough;
  appearance_date: string;
  appearance_time: string;
  case_type: CaseType;
  case_caption: string;
  case_index_number: string;
  appearance_type: AppearanceType;
  opposing_counsel_name: string | null;
  opposing_counsel_firm: string | null;
  opposing_counsel_bar_number: string | null;
  instructions: string;
  pay_rate: number;
  payment_status: PaymentStatus;
  fee_model: FeeModel;
  platform_fee_cents: number;
  sales_tax_cents: number;
  total_charged_cents: number | null;
  payment_authorized_at: string | null;
  payment_captured_at: string | null;
  payment_released_at: string | null;
  auto_release_at: string | null;
  stripe_application_fee_amount: number | null;
  stripe_transfer_id: string | null;
  stripe_refund_id: string | null;
  stripe_payment_intent_id: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  poster?: Profile;
  claimer?: Profile;
  outcome_report?: OutcomeReport;
}

export interface Payout {
  id: string;
  user_id: string;
  amount_cents: number;
  fee_cents: number;
  stripe_payout_id: string | null;
  status: PayoutStatus;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  appearance_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  payload: Record<string, unknown>;
  stripe_event_id: string | null;
  created_at: string;
}

export interface OutcomeReport {
  id: string;
  appearance_id: string;
  submitted_by: string;
  outcome: OutcomeType;
  next_date: string | null;
  judge_name: string;
  judge_notes: string;
  opposing_counsel: string;
  action_items: string;
  red_flags: string;
  raw_notes: string;
  ai_structured_report: Record<string, unknown> | null;
  ai_redaction_dictionary: Record<string, string> | null;
  created_at: string;
}

export interface Review {
  id: string;
  appearance_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ReferralClick {
  id: string;
  user_id: string | null;
  partner: string;
  source: string | null;
  created_at: string;
}

export type DisputeStatus =
  | 'open'
  | 'in_review'
  | 'resolved_for_raiser'
  | 'resolved_for_other'
  | 'split';

export interface Dispute {
  id: string;
  appearance_id: string;
  raised_by: string;
  against: string;
  reason: string;
  evidence_urls: string[];
  status: DisputeStatus;
  resolution_notes: string | null;
  refund_amount_cents: number | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  appearance?: Appearance;
  raiser?: Profile;
}

export interface MessageAttachment {
  path: string;
  name: string;
  size: number;
  content_type: string;
}

export interface Message {
  id: string;
  appearance_id: string;
  sender_id: string;
  body: string;
  attachments: MessageAttachment[];
  read_at: string | null;
  created_at: string;
  sender?: Profile;
}
