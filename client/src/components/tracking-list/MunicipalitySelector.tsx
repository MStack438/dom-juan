import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Region {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId: string | null;
}

interface MunicipalitySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function MunicipalitySelector({ selectedIds, onChange }: MunicipalitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all municipalities (level 2)
  const { data: municipalities = [], isLoading } = useQuery({
    queryKey: ['regions', 'municipalities'],
    queryFn: async () => {
      const response = await api.get<Region[]>('/api/regions?level=2');
      return response.data;
    },
  });

  // Fetch selected municipalities for display
  const { data: allRegions = [] } = useQuery({
    queryKey: ['regions', 'all'],
    queryFn: async () => {
      const response = await api.get<Region[]>('/api/regions');
      return response.data;
    },
  });

  // Filter municipalities based on search
  const filteredMunicipalities = useMemo(() => {
    if (!searchQuery.trim()) return municipalities;
    const query = searchQuery.toLowerCase();
    return municipalities.filter((m) => m.name.toLowerCase().includes(query));
  }, [municipalities, searchQuery]);

  // Get selected municipality names
  const selectedMunicipalities = useMemo(() => {
    return allRegions.filter((r) => selectedIds.includes(r.id));
  }, [allRegions, selectedIds]);

  const handleSelect = (municipalityId: string) => {
    if (selectedIds.includes(municipalityId)) {
      onChange(selectedIds.filter((id) => id !== municipalityId));
    } else {
      onChange([...selectedIds, municipalityId]);
    }
  };

  const handleRemove = (municipalityId: string) => {
    onChange(selectedIds.filter((id) => id !== municipalityId));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length === 0
              ? 'Select municipalities...'
              : `${selectedIds.length} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search municipalities..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading...' : 'No municipalities found.'}
              </CommandEmpty>
              <CommandGroup>
                {filteredMunicipalities.slice(0, 100).map((municipality) => (
                  <CommandItem
                    key={municipality.id}
                    value={municipality.id}
                    onSelect={() => handleSelect(municipality.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedIds.includes(municipality.id)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {municipality.name}
                  </CommandItem>
                ))}
                {filteredMunicipalities.length > 100 && (
                  <CommandItem disabled>
                    ... and {filteredMunicipalities.length - 100} more. Keep typing to narrow results.
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedIds.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} {selectedIds.length === 1 ? 'municipality' : 'municipalities'} selected
            </span>
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedMunicipalities.map((municipality) => (
              <Badge key={municipality.id} variant="secondary" className="gap-1">
                {municipality.name}
                <button
                  onClick={() => handleRemove(municipality.id)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
