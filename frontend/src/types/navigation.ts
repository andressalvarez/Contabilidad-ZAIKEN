import type { Subjects } from '@/contexts/AbilityContext';

export type NavigationAction =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject';

export type NavigationIconType = 'bootstrap' | 'lucide';

export interface NavigationPermission {
  action: NavigationAction;
  subject: Subjects;
}

export interface NavigationCatalogItem {
  itemKey: string;
  path: string;
  title: string;
  icon?: string;
  iconType?: NavigationIconType;
  activeMatchers?: string[];
  defaultPermission?: NavigationPermission;
  isKnownCoreItem: boolean;
}

export interface NavigationPlacement {
  itemKey: string;
  order: number;
  shortcut?: boolean;
}

export interface NavigationSection {
  id: string;
  title: string;
  order: number;
  items: NavigationPlacement[];
}

export interface NavigationWorld {
  id: string;
  name: string;
  order: number;
  enabled?: boolean;
  sections: NavigationSection[];
}

export interface NavigationLayout {
  version: number;
  worlds: NavigationWorld[];
  updatedAt?: string;
  updatedBy?: number | null;
}
