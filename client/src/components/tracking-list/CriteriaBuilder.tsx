import { Input } from '@/components/ui/input';
import { RegionSelector } from './RegionSelector';
import { cn } from '@/lib/utils';
import type { TrackingCriteria, PropertyType } from '@/types';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-detached' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'multi_family', label: 'Multi-family' },
  { value: 'land', label: 'Land' },
  { value: 'farm', label: 'Farm' },
  { value: 'other', label: 'Other' },
];

interface CriteriaBuilderProps {
  criteria: TrackingCriteria;
  onChange: (c: TrackingCriteria) => void;
}

const inputClass = 'h-10';

export function CriteriaBuilder({ criteria, onChange }: CriteriaBuilderProps) {
  const update = (patch: Partial<TrackingCriteria>) => {
    onChange({ ...criteria, ...patch });
  };

  const togglePropertyType = (t: PropertyType) => {
    const current = criteria.propertyTypes ?? [];
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t];
    update({ propertyTypes: next.length ? next : undefined });
  };

  return (
    <div className="space-y-4">
      <RegionSelector
        value={criteria.regions ?? []}
        onChange={(ids) => update({ regions: ids.length ? ids : undefined })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Price min</label>
          <Input
            type="number"
            className={inputClass}
            placeholder="e.g. 200000"
            value={criteria.priceMin ?? ''}
            onChange={(e) =>
              update({
                priceMin:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price max</label>
          <Input
            type="number"
            className={inputClass}
            placeholder="e.g. 500000"
            value={criteria.priceMax ?? ''}
            onChange={(e) =>
              update({
                priceMax:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Bedrooms min</label>
          <Input
            type="number"
            min={0}
            className={inputClass}
            value={criteria.bedroomsMin ?? ''}
            onChange={(e) =>
              update({
                bedroomsMin:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bedrooms max</label>
          <Input
            type="number"
            min={0}
            className={inputClass}
            value={criteria.bedroomsMax ?? ''}
            onChange={(e) =>
              update({
                bedroomsMax:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bathrooms min</label>
        <Input
          type="number"
          min={0}
          className={cn(inputClass, 'max-w-[120px]')}
          value={criteria.bathroomsMin ?? ''}
          onChange={(e) =>
            update({
              bathroomsMin:
                e.target.value === ''
                  ? undefined
                  : parseInt(e.target.value, 10),
            })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Property types</label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((p) => (
            <label
              key={p.value}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={(criteria.propertyTypes ?? []).includes(p.value)}
                onChange={() => togglePropertyType(p.value)}
                className="rounded border-input"
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Year built min</label>
          <Input
            type="number"
            className={inputClass}
            placeholder="e.g. 1990"
            value={criteria.yearBuiltMin ?? ''}
            onChange={(e) =>
              update({
                yearBuiltMin:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Year built max</label>
          <Input
            type="number"
            className={inputClass}
            value={criteria.yearBuiltMax ?? ''}
            onChange={(e) =>
              update({
                yearBuiltMax:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Lot size min (sq ft)</label>
          <Input
            type="number"
            className={inputClass}
            value={criteria.lotSizeMinSqft ?? ''}
            onChange={(e) =>
              update({
                lotSizeMinSqft:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Living area min (sq ft)</label>
          <Input
            type="number"
            className={inputClass}
            value={criteria.livingAreaMinSqft ?? ''}
            onChange={(e) =>
              update({
                livingAreaMinSqft:
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Must have</label>
        <div className="flex flex-wrap gap-4">
          {(['garage', 'pool', 'basement', 'ac', 'fireplace'] as const).map(
            (key) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm capitalize cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={criteria.mustHave?.[key] ?? false}
                  onChange={(e) =>
                    update({
                      mustHave: {
                        ...criteria.mustHave,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-input"
                />
                {key}
              </label>
            )
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Must not have</label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={criteria.mustNotHave?.pool ?? false}
            onChange={(e) =>
              update({
                mustNotHave: {
                  ...criteria.mustNotHave,
                  pool: e.target.checked,
                },
              })
            }
            className="rounded border-input"
          />
          Pool
        </label>
      </div>
    </div>
  );
}
