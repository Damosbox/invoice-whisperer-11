import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ExceptionFiltersState {
  search: string;
  status: string;
  anomalyType: string;
}

interface ExceptionFiltersProps {
  filters: ExceptionFiltersState;
  onFiltersChange: (filters: ExceptionFiltersState) => void;
  anomalyTypes: string[];
}

const statusOptions = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'exception', label: 'Exception' },
  { value: 'litige', label: 'Litige' },
];

export function ExceptionFilters({
  filters,
  onFiltersChange,
  anomalyTypes,
}: ExceptionFiltersProps) {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.anomalyType !== 'all';

  const clearFilters = () => {
    onFiltersChange({ search: '', status: 'all', anomalyType: 'all' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par n° facture, fournisseur..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.anomalyType}
        onValueChange={(value) => onFiltersChange({ ...filters, anomalyType: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type d'anomalie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les anomalies</SelectItem>
          {anomalyTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Effacer
        </Button>
      )}
    </div>
  );
}
