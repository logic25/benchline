import { Card, CardContent } from '@/components/ui/card';
import { FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  stats: { active: number; completed: number; totalSpent?: number; totalEarned?: number; pending?: number };
  role: string;
}

export function StatsCards({ stats, role }: StatsCardsProps) {
  const cards = role === 'per_diem' || role === 'both' ? [
    { label: 'Active', value: stats.active, icon: Clock, color: 'text-primary' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-primary/70' },
    { label: 'Total Earned', value: `$${((stats.totalEarned || 0) / 100).toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
    { label: 'Pending', value: `$${((stats.pending || 0) / 100).toFixed(2)}`, icon: DollarSign, color: 'text-amber-700 dark:text-amber-500' },
  ] : [
    { label: 'Active', value: stats.active, icon: Clock, color: 'text-primary' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-primary/70' },
    { label: 'Total Spent', value: `$${((stats.totalSpent || 0) / 100).toFixed(2)}`, icon: DollarSign, color: 'text-foreground' },
    { label: 'Open Posts', value: stats.pending || 0, icon: FileText, color: 'text-amber-700 dark:text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Icon className={`h-8 w-8 ${card.color}`} />
                <div>
                  <p className="font-heading text-2xl font-normal tabular-nums tracking-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
