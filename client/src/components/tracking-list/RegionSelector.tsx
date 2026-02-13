import { useRegions } from '@/hooks/useRegions';
import { cn } from '@/lib/utils';

interface RegionSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function RegionSelector({
  value,
  onChange,
  className,
}: RegionSelectorProps) {
  const { data: regions, isLoading } = useRegions();

  if (isLoading || !regions?.length) return null;

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">Regions</label>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-md border border-input p-2">
        {regions.map((r) => (
          <label
            key={r.id}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value.includes(r.id)}
              onChange={() => toggle(r.id)}
              className="rounded border-input"
            />
            {r.name}
          </label>
        ))}
      </div>
    </div>
  );
}
