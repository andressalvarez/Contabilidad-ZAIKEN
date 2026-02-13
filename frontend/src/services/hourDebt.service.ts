import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api/v1';

export enum DebtStatus {
  ACTIVE = 'ACTIVE',
  FULLY_PAID = 'FULLY_PAID',
  CANCELLED = 'CANCELLED',
}

export interface HourDebt {
  id: number;
  negocioId: number;
  usuarioId: number;
  date: string;
  minutesOwed: number;
  remainingMinutes: number;
  reason?: string;
  status: DebtStatus;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  editedById?: number;
  editedAt?: string;
  deletedById?: number;
  deletedAt?: string;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
  createdBy?: {
    id: number;
    nombre: string;
  };
  editedBy?: {
    id: number;
    nombre: string;
  };
  deductions?: DebtDeduction[];
}

export interface DebtDeduction {
  id: number;
  debtId: number;
  registroHorasId: number;
  minutesDeducted: number;
  excessMinutes: number;
  deductedAt: string;
  deletedAt?: string;
  totalDayHours?: number;
  registroHoras?: {
    id: number;
    fecha: string;
    horas: number;
    timerInicio?: string;
    timerFin?: string;
  };
}

export interface CreateDebtDto {
  usuarioId?: number;
  minutesOwed: number;
  date: string;
  reason?: string;
}

export interface UpdateDebtDto {
  minutesOwed?: number;
  remainingMinutes?: number;
  adminReason?: string;
}

export interface DebtFilters {
  usuarioId?: number;
  status?: DebtStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface BusinessStats {
  totalActiveDebt: number;
  usersWithDebt: number;
  paidThisMonth: number;
}

export interface MonthlyDebtReviewResponse {
  requestedAt: string;
  requestedBy: number;
  monthStart: string;
  monthEnd: string;
  thresholdHours: number;
  usersAnalyzed: number;
  usersWithGaps: number;
  totalExpectedExcessMinutes: number;
  totalDeductedMinutes: number;
  remainingGapMinutes: number;
  balanceFixesApplied: number;
  autoAppliedMinutes: number;
  autoAppliedUsers: number;
  autoAppliedUserDays: number;
  deductionOperations: number;
  users: Array<{
    usuarioId: number;
    nombre: string;
    email: string;
    expectedExcessMinutes: number;
    deductedMinutes: number;
    gapMinutes: number;
    requiresManualReview: boolean;
  }>;
  message: string;
}

class HourDebtService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create own debt
   */
  async createDebt(dto: CreateDebtDto): Promise<HourDebt> {
    const response = await axios.post(`${API_URL}/hour-debt`, dto, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get own balance
   */
  async getMyBalance(): Promise<number> {
    const response = await axios.get(`${API_URL}/hour-debt/my-balance`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get own debt history
   */
  async getMyHistory(): Promise<HourDebt[]> {
    const response = await axios.get(`${API_URL}/hour-debt/my-history`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get all debts (admin)
   */
  async getAllDebts(filters?: DebtFilters): Promise<HourDebt[]> {
    const params = new URLSearchParams();
    if (filters?.usuarioId) params.append('usuarioId', filters.usuarioId.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await axios.get(`${API_URL}/hour-debt?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get debts by usuario (admin)
   */
  async getUserDebts(usuarioId: number): Promise<HourDebt[]> {
    const response = await axios.get(`${API_URL}/hour-debt/usuario/${usuarioId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get specific debt
   */
  async getDebt(id: number): Promise<HourDebt> {
    const response = await axios.get(`${API_URL}/hour-debt/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Update debt (admin)
   */
  async updateDebt(id: number, dto: UpdateDebtDto): Promise<HourDebt> {
    const response = await axios.patch(`${API_URL}/hour-debt/${id}`, dto, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Delete debt (admin)
   */
  async deleteDebt(id: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_URL}/hour-debt/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Cancel debt (admin)
   */
  async cancelDebt(id: number, reason: string): Promise<HourDebt> {
    const response = await axios.patch(
      `${API_URL}/hour-debt/${id}/cancel`,
      { reason },
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  /**
   * Get deduction history
   */
  async getDeductionHistory(debtId: number): Promise<DebtDeduction[]> {
    const response = await axios.get(`${API_URL}/hour-debt/${debtId}/deductions`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get audit log (admin)
   */
  async getAuditLog(debtId: number): Promise<any[]> {
    const response = await axios.get(`${API_URL}/hour-debt/${debtId}/audit-log`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get business statistics (admin)
   */
  async getBusinessStats(): Promise<BusinessStats> {
    const response = await axios.get(`${API_URL}/hour-debt/stats/business`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Request monthly debt review for all users with active debt (admin)
   */
  async requestMonthlyReview(): Promise<MonthlyDebtReviewResponse> {
    const response = await axios.post(
      `${API_URL}/hour-debt/review-monthly`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  /**
   * ROBUST CORRECTOR: Delete all deductions for the month and recalculate from scratch (admin)
   */
  async correctMonthlyDeductions(): Promise<any> {
    const response = await axios.post(
      `${API_URL}/hour-debt/correct-monthly`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data;
  }

  /**
   * Utility: Convert minutes to hours string
   */
  minutesToHoursString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  /**
   * Utility: Convert hours to minutes
   */
  hoursToMinutes(hours: number): number {
    return Math.round(hours * 60);
  }
}

export default new HourDebtService();
