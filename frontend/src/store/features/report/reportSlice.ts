import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/api";

interface DashboardStats {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  inventory: {
    total: number;
    today_imports: number;
  };
  orders: {
    total: number;
    pending: number;
  };
}

interface WeeklyRevenue {
  day: string;
  revenue: number;
}

interface SpeciesSalesItem {
  name: string;
  quantity: number;
  color?: string;
}

interface ReportSummary {
  total_revenue?: number;
  total_orders?: number;
  total_quantity?: number;
  avg_order_value?: number;
  changes?: {
    revenue: number;
    orders: number;
    quantity: number;
    avg_order_value: number;
  };
}

interface ReportState {
  summary: ReportSummary | null;
  dashboardStats: DashboardStats | null;
  weeklyRevenue: WeeklyRevenue[];
  speciesSales: SpeciesSalesItem[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  summary: null,
  dashboardStats: null,
  weeklyRevenue: [],
  speciesSales: [],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  "report/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/dashboard");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats"
      );
    }
  }
);

export const fetchWeeklyRevenue = createAsyncThunk(
  "report/fetchWeeklyRevenue",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/reports/weekly-revenue");
      return response.data.data; // expect [{ day, revenue }]
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch weekly revenue"
      );
    }
  }
);

export const fetchSpeciesSales = createAsyncThunk(
  "report/fetchSpeciesSales",
  async (
    params: { startDate?: string; endDate?: string; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const qs = [] as string[];
      if (params.startDate) qs.push(`date_from=${params.startDate}`);
      if (params.endDate) qs.push(`date_to=${params.endDate}`);
      if (params.limit) qs.push(`limit=${params.limit}`);
      const query = qs.length ? `?${qs.join("&")}` : "";
      const response = await api.get(`/reports/sales-by-species${query}`);
      // normalize to [{ name, quantity }]
      const data = response.data.data.map((d: any) => ({
        name: d.name || d.species || d.label,
        quantity: Number(d.quantity || d.quantity_sold || d.qty || 0),
        color: d.color,
      }));
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch species sales"
      );
    }
  }
);

export const fetchReportSummary = createAsyncThunk(
  "report/fetchSummary",
  async (
    { startDate, endDate }: { startDate?: string; endDate?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const qs = [] as string[];
      if (startDate) qs.push(`date_from=${startDate}`);
      if (endDate) qs.push(`date_to=${endDate}`);
      const query = qs.length ? `?${qs.join("&")}` : "";
      const response = await api.get(`/reports/summary${query}`);
      return response.data.data; // expect { summary: {...}, revenue_by_date: [...] }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch report summary"
      );
    }
  }
);

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload || null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWeeklyRevenue.fulfilled, (state, action) => {
        state.weeklyRevenue = action.payload || [];
      })
      .addCase(fetchSpeciesSales.fulfilled, (state, action) => {
        state.speciesSales = action.payload || [];
      })
      .addCase(fetchReportSummary.fulfilled, (state, action) => {
        const payload = action.payload || {};
        state.summary = payload.summary || payload;
      });
  },
});

export const { clearError } = reportSlice.actions;
export default reportSlice.reducer;
