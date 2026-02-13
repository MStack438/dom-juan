import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Region {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  urlFragment: string | null;
  level: number;
  createdAt: string;
}

export interface RegionTreeNode extends Region {
  children: RegionTreeNode[];
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => api.get<Region[]>('/regions'),
  });
}

export function useRegionTree() {
  return useQuery({
    queryKey: ['regions', 'tree'],
    queryFn: () => api.get<RegionTreeNode[]>('/regions/tree'),
  });
}
