export const PLATFORM_FEE_RATE = 0.15;

export const BOROUGHS: { value: string; label: string }[] = [
  { value: 'manhattan', label: 'Manhattan' },
  { value: 'brooklyn', label: 'Brooklyn' },
  { value: 'bronx', label: 'Bronx' },
  { value: 'queens', label: 'Queens' },
  { value: 'staten_island', label: 'Staten Island' },
];

export const CASE_TYPES: { value: string; label: string }[] = [
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'family', label: 'Family' },
  { value: 'housing', label: 'Housing' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
];

export const APPEARANCE_TYPES: { value: string; label: string }[] = [
  { value: 'adjournment', label: 'Adjournment' },
  { value: 'conference', label: 'Conference' },
  { value: 'status_call', label: 'Status Call' },
  { value: 'motion', label: 'Motion' },
  { value: 'hearing', label: 'Hearing' },
  { value: 'other', label: 'Other' },
];

export const OUTCOME_TYPES: { value: string; label: string }[] = [
  { value: 'adjourned', label: 'Adjourned' },
  { value: 'settled', label: 'Settled' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'granted', label: 'Motion Granted' },
  { value: 'denied', label: 'Motion Denied' },
  { value: 'default', label: 'Default' },
  { value: 'other', label: 'Other' },
];

export const NYC_COURTS: { value: string; label: string; borough: string }[] = [
  { value: 'ny_supreme_manhattan', label: 'Supreme Court - New York County', borough: 'manhattan' },
  { value: 'ny_civil_manhattan', label: 'Civil Court - New York County', borough: 'manhattan' },
  { value: 'ny_criminal_manhattan', label: 'Criminal Court - New York County', borough: 'manhattan' },
  { value: 'ny_family_manhattan', label: 'Family Court - New York County', borough: 'manhattan' },
  { value: 'ny_housing_manhattan', label: 'Housing Court - New York County', borough: 'manhattan' },
  { value: 'ny_supreme_brooklyn', label: 'Supreme Court - Kings County', borough: 'brooklyn' },
  { value: 'ny_civil_brooklyn', label: 'Civil Court - Kings County', borough: 'brooklyn' },
  { value: 'ny_criminal_brooklyn', label: 'Criminal Court - Kings County', borough: 'brooklyn' },
  { value: 'ny_family_brooklyn', label: 'Family Court - Kings County', borough: 'brooklyn' },
  { value: 'ny_housing_brooklyn', label: 'Housing Court - Kings County', borough: 'brooklyn' },
  { value: 'ny_supreme_bronx', label: 'Supreme Court - Bronx County', borough: 'bronx' },
  { value: 'ny_civil_bronx', label: 'Civil Court - Bronx County', borough: 'bronx' },
  { value: 'ny_criminal_bronx', label: 'Criminal Court - Bronx County', borough: 'bronx' },
  { value: 'ny_family_bronx', label: 'Family Court - Bronx County', borough: 'bronx' },
  { value: 'ny_housing_bronx', label: 'Housing Court - Bronx County', borough: 'bronx' },
  { value: 'ny_supreme_queens', label: 'Supreme Court - Queens County', borough: 'queens' },
  { value: 'ny_civil_queens', label: 'Civil Court - Queens County', borough: 'queens' },
  { value: 'ny_criminal_queens', label: 'Criminal Court - Queens County', borough: 'queens' },
  { value: 'ny_family_queens', label: 'Family Court - Queens County', borough: 'queens' },
  { value: 'ny_housing_queens', label: 'Housing Court - Queens County', borough: 'queens' },
  { value: 'ny_supreme_si', label: 'Supreme Court - Richmond County', borough: 'staten_island' },
  { value: 'ny_civil_si', label: 'Civil Court - Richmond County', borough: 'staten_island' },
  { value: 'ny_criminal_si', label: 'Criminal Court - Richmond County', borough: 'staten_island' },
  { value: 'ny_family_si', label: 'Family Court - Richmond County', borough: 'staten_island' },
  { value: 'ny_housing_si', label: 'Housing Court - Richmond County', borough: 'staten_island' },
];

export const PAY_RATE_SUGGESTIONS: { type: string; min: number; max: number }[] = [
  { type: 'adjournment', min: 7500, max: 15000 },
  { type: 'conference', min: 15000, max: 30000 },
  { type: 'status_call', min: 10000, max: 20000 },
  { type: 'motion', min: 25000, max: 50000 },
  { type: 'hearing', min: 30000, max: 75000 },
  { type: 'other', min: 15000, max: 40000 },
];

export const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  claimed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  disputed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};
