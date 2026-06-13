// NY OCA (Office of Court Administration) attorney-registration lookup.
//
// Phase 2 ships a stub: every lookup returns source: 'manual', signalling that
// an admin must review the request by hand. Phase 3 will wire this to the live
// OCA attorney search (https://iapps.courts.state.ny.us/attorneyservices/search)
// and populate the fields below from the response.

export type AttorneyRegistrationStatus =
  | 'currently_registered'
  | 'inactive'
  | 'suspended'
  | 'disbarred';

export interface OcaLookupResult {
  found: boolean;
  fullName?: string;
  barNumber?: string;
  admittedDate?: string;
  status?: AttorneyRegistrationStatus;
  disciplinaryHistory?: string;
  source: 'manual' | 'oca_lookup';
}

// TODO(phase-3): replace with a real OCA registration lookup. For now we never
// claim to have found a record automatically, forcing admin review.
export async function lookupAttorney(
  barNumber: string,
  state: string = 'NY'
): Promise<OcaLookupResult> {
  void barNumber;
  void state;
  return { found: false, source: 'manual' };
}
