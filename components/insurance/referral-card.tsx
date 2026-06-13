import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { INSURANCE_PARTNERS } from '@/lib/insurance-partners';

interface InsuranceReferralCardProps {
  // Logged with each click for attribution (e.g. 'earnings', 'settings').
  source?: string;
}

export function InsuranceReferralCard({ source }: InsuranceReferralCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Get malpractice insurance
        </CardTitle>
        <CardDescription>
          Per diem work may not be covered by a firm policy. Compare professional liability coverage from our partners.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {INSURANCE_PARTNERS.map((p) => {
          const href = source ? `/r/insurance/${p.slug}?source=${encodeURIComponent(source)}` : `/r/insurance/${p.slug}`;
          return (
            <div key={p.slug} className="flex flex-col justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <a href={href} target="_blank" rel="noopener noreferrer sponsored" className="mt-3">
                <Button variant="outline" size="sm" className="w-full">
                  Get a quote <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </a>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
