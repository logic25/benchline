'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, DollarSign, Gavel } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/constants';
import type { Appearance } from '@/lib/types';
import { format } from 'date-fns';

interface AppearanceCardProps {
  appearance: Appearance;
}

export function AppearanceCard({ appearance }: AppearanceCardProps) {
  return (
    <Link href={`/appearances/${appearance.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{appearance.case_caption}</h3>
              <p className="text-sm text-muted-foreground">{appearance.court_name}</p>
            </div>
            <Badge className={STATUS_COLORS[appearance.status] || ''}>
              {appearance.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(appearance.appearance_date + 'T00:00:00'), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {appearance.appearance_time}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {appearance.borough.charAt(0).toUpperCase() + appearance.borough.slice(1).replace('_', ' ')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gavel className="h-4 w-4" />
              {appearance.appearance_type.replace('_', ' ')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1 text-lg font-semibold text-green-700">
              <DollarSign className="h-5 w-5" />
              {(appearance.pay_rate / 100).toFixed(2)}
            </div>
            <span className="text-xs text-muted-foreground capitalize">{appearance.case_type}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
