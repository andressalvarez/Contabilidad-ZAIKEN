import { api } from '@/lib/api';
import type { NavigationCatalogItem, NavigationLayout } from '@/types/navigation';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export const SettingsService = {
  getSmtpConfig: async (): Promise<SmtpConfig | null> => {
    const { data } = await api.get('/settings/smtp');
    return data?.data || null;
  },

  updateSmtpConfig: async (config: SmtpConfig): Promise<SmtpConfig> => {
    const { data } = await api.patch('/settings/smtp', config);
    return data?.data;
  },

  testSmtpConnection: async (config: SmtpConfig): Promise<boolean> => {
    const { data } = await api.post('/settings/smtp/test', config);
    return data?.success || false;
  },

  getNavigationCatalog: async (): Promise<NavigationCatalogItem[]> => {
    const { data } = await api.get('/settings/navigation/catalog');
    return data?.data || [];
  },

  getNavigationLayout: async (): Promise<NavigationLayout | null> => {
    const { data } = await api.get('/settings/navigation/layout');
    return data?.data || null;
  },

  updateNavigationLayout: async (
    layout: NavigationLayout,
  ): Promise<NavigationLayout> => {
    const payload = {
      version: layout.version,
      worlds: layout.worlds,
    };
    const { data } = await api.patch('/settings/navigation/layout', payload);
    return data?.data;
  },

  resetNavigationLayout: async (): Promise<NavigationLayout> => {
    const { data } = await api.post('/settings/navigation/layout/reset');
    return data?.data;
  },
};

export default SettingsService;
