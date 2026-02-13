import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ListingsFilters } from '@/hooks/useListings';

interface ListingFiltersProps {
  filters: ListingsFilters;
  onFiltersChange: (f: ListingsFilters) => void;
}

const SORT_OPTIONS = [
  { value: 'dom', label: 'Days on market' },
  { value: 'price', label: 'Price' },
  { value: 'date', label: 'Date added' },
];

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function ListingFilters({
  filters,
  onFiltersChange,
}: ListingFiltersProps) {
  const status = filters.status ?? 'active';
  const sort = filters.sort ?? 'dom';
  const order = filters.order ?? 'desc';
  const priceMin = filters.priceMin ?? '';
  const priceMax = filters.priceMax ?? '';

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <select
          className={cn(selectClass, 'w-[120px]')}
          value={status}
          onChange={(e) =>
            onFiltersChange({ ...filters, status: e.target.value })
          }
        >
          <option value="active">Active</option>
          <option value="delisted">Delisted</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Sort by</label>
        <select
          className={cn(selectClass, 'w-[140px]')}
          value={sort}
          onChange={(e) =>
            onFiltersChange({ ...filters, sort: e.target.value })
          }
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Order</label>
        <select
          className={cn(selectClass, 'w-[100px]')}
          value={order}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              order: e.target.value as 'asc' | 'desc',
            })
          }
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Price min</label>
        <Input
          type="number"
          placeholder="Min"
          className="w-[100px]"
          value={priceMin}
          onChange={(e) => {
            const v = e.target.value;
            onFiltersChange({
              ...filters,
              priceMin: v === '' ? undefined : parseInt(v, 10),
            });
          }}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Price max</label>
        <Input
          type="number"
          placeholder="Max"
          className="w-[100px]"
          value={priceMax}
          onChange={(e) => {
            const v = e.target.value;
            onFiltersChange({
              ...filters,
              priceMax: v === '' ? undefined : parseInt(v, 10),
            });
          }}
        />
      </div>
    </div>
  );
}
