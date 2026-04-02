export type UserRole = 'litigator' | 'per_diem' | 'both';

export type Borough = 'manhattan' | 'brooklyn' | 'bronx' | 'queens' | 'staten_island';

export type CaseType = 'civil' | 'criminal' | 'family' | 'housing' | 'commercial' | 'other';

export type AppearanceType = 'adjournment' | 'conference' | 'status_call' | 'motion' | 'hearing' | 'other';

export type AppearanceStatus = 'open' | 'claimed' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';

export type OutcomeType = 'adjourned' | 'settled' | 'dismissed' | 'granted' | 'denied' | 'default' | 'other';

export type NotificationType = 'appearance_posted' | 'appearance_claimed' | 'check_in' | 'report_submitted' | 'payment_released' | 'review_received';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  bar_number: string | null;
  bar_state: string | null;
  bar_verified: boolean;
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
  instructions: string;
  pay_rate: number;
  platform_fee: number;
  stripe_payment_intent_id: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  poster?: Profile;
  claimer?: Profile;
  outcome_report?: OutcomeReport;
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
