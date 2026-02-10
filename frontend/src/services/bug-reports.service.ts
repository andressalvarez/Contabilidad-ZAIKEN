import { api } from '@/lib/api';

export type BugReportStatus = 'OPEN' | 'RESOLVED';

export interface BugReportUser {
  id: number;
  nombre: string;
  email: string;
}

export interface BugReport {
  id: number;
  negocioId: number;
  reporterId: number;
  moduleUrl: string;
  evidenceUrl: string;
  description: string;
  status: BugReportStatus;
  resolvedAt: string | null;
  resolvedById: number | null;
  createdAt: string;
  updatedAt: string;
  reporter?: BugReportUser;
  resolvedBy?: BugReportUser | null;
}

export interface CreateBugReportDto {
  description: string;
  evidenceUrl: string;
  moduleUrl?: string;
}

export interface BugReportListQuery {
  status?: BugReportStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BugReportListResponse {
  data: BugReport[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const BugReportsService = {
  createBugReport: async (dto: CreateBugReportDto): Promise<BugReport> => {
    const { data } = await api.post('/bug-reports', dto);
    return data?.data || data;
  },

  getBugReports: async (query?: BugReportListQuery): Promise<BugReportListResponse> => {
    const params = new URLSearchParams();

    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const queryString = params.toString();
    const { data } = await api.get(`/bug-reports${queryString ? `?${queryString}` : ''}`);
    const payload = data?.data ? data : { data, meta: undefined };

    return {
      data: payload?.data || [],
      meta: payload?.meta || {
        total: 0,
        page: query?.page || 1,
        limit: query?.limit || 20,
        totalPages: 0,
      },
    };
  },

  updateBugReportStatus: async (
    id: number,
    status: BugReportStatus,
  ): Promise<BugReport> => {
    const { data } = await api.patch(`/bug-reports/${id}/status`, { status });
    return data?.data || data;
  },
};

export default BugReportsService;
