import { api } from '@/lib/api';

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
};

export default SettingsService;
