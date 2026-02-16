import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { CriteriaBuilder } from './CriteriaBuilder';
import type { TrackingCriteria } from '@/types';
import type { TrackingListWithStats } from '@/types';

interface TrackingListFormProps {
  mode: 'create' | 'edit';
  initial?: TrackingListWithStats | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    criteria?: TrackingCriteria;
    custom_url?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function TrackingListForm({
  mode,
  initial,
  onSubmit,
  onCancel,
}: TrackingListFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(
    initial?.description ?? ''
  );
  const [customUrl, setCustomUrl] = useState(
    initial?.customUrl ?? ''
  );
  const [criteria, setCriteria] = useState<TrackingCriteria>(
    initial?.criteria ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: trimmed,
        description: description.trim() || undefined,
        criteria: Object.keys(criteria).length ? criteria : undefined,
        custom_url: customUrl.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {mode === 'create' ? 'New tracking list' : 'Edit tracking list'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Montérégie houses"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
          </div>

          {!customUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Search criteria</label>
              <CriteriaBuilder criteria={criteria} onChange={setCriteria} />
            </div>
          )}

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
              Advanced options
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Custom Realtor.ca URL
                </label>
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://www.realtor.ca/..."
                />
                <p className="text-xs text-muted-foreground">
                  Use a custom Realtor.ca search URL instead of criteria above. Useful for
                  very specific searches that can't be expressed with the criteria builder.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
