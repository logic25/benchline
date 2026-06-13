// Malpractice-insurance referral partners surfaced to per diems. The URLs are
// placeholders — replace with the real affiliate/referral links (including any
// tracking parameters) when partnerships are signed. The redirect route
// /r/insurance/[partner] logs the click then 302s to `url`.

export interface InsurancePartner {
  slug: string;
  name: string;
  description: string;
  url: string;
}

export const INSURANCE_PARTNERS: InsurancePartner[] = [
  {
    slug: 'alps',
    name: 'ALPS',
    description: 'Lawyers professional liability insurance built for solo and small firms.',
    url: 'https://www.alpsinsurance.com/', // TODO: replace with affiliate link
  },
  {
    slug: 'embroker',
    name: 'Embroker',
    description: 'Digital-first malpractice coverage with fast online quotes.',
    url: 'https://www.embroker.com/', // TODO: replace with affiliate link
  },
  {
    slug: 'usi-affinity',
    name: 'USI Affinity',
    description: 'Bar-endorsed professional liability programs for attorneys.',
    url: 'https://www.mybarinsurance.com/', // TODO: replace with affiliate link
  },
];

export function getInsurancePartner(slug: string): InsurancePartner | undefined {
  return INSURANCE_PARTNERS.find((p) => p.slug === slug);
}
