'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BOROUGHS, CASE_TYPES, APPEARANCE_TYPES } from '@/lib/constants';

interface FiltersProps {
  borough: string;
  caseType: string;
  appearanceType: string;
  date: string;
  onBoroughChange: (v: string | null) => void;
  onCaseTypeChange: (v: string | null) => void;
  onAppearanceTypeChange: (v: string | null) => void;
  onDateChange: (v: string) => void;
}

export function Filters({
  borough, caseType, appearanceType, date,
  onBoroughChange, onCaseTypeChange, onAppearanceTypeChange, onDateChange,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Select value={borough} onValueChange={onBoroughChange}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Boroughs" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Boroughs</SelectItem>
          {BOROUGHS.map((b) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}
        </SelectContent>
      </Select>
      <Select value={caseType} onValueChange={onCaseTypeChange}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Case Types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Case Types</SelectItem>
          {CASE_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
        </SelectContent>
      </Select>
      <Select value={appearanceType} onValueChange={onAppearanceTypeChange}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Appearance Types</SelectItem>
          {APPEARANCE_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
        </SelectContent>
      </Select>
      <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="w-[180px]" />
    </div>
  );
}
