import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../../services/api";

interface SaleOrderItem {
  id: number;
  fish_id: number;
  fish_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SaleOrder {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string | null;
  customer_social: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_type: string | null;
  order_date: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  sale_type: "retail" | "wholesale";
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  notes: string;
  item_count: number;
  items?: SaleOrderItem[];
  created_at: string;
  created_by_name: string | null;
}

interface SaleState {
  data: SaleOrder[];
  selected: SaleOrder | null;
  loading: boolean;
  error: string | null;
  todaySales: {
    total_sales: number;
    order_count: number;
  };
}

const initialState: SaleState = {
  data: [],
  selected: null,
  loading: false,
  error: null,
  todaySales: {
    total_sales: 0,
    order_count: 0,
  },
};

export const fetchSaleOrders = createAsyncThunk(
  "sale/fetchAll",
  async (
    filters: {
      status?: string;
      customer_id?: number;
      date_from?: string;
      date_to?: string;
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.customer_id)
        params.append("customer_id", filters.customer_id.toString());
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);

      const response = await api.get(`/sale-orders?${params.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sale orders",
      );
    }
  },
);

export const fetchSaleOrderById = createAsyncThunk(
  "sale/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/sale-orders/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sale order",
      );
    }
  },
);

export const fetchTodaySales = createAsyncThunk(
  "sale/fetchToday",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/sale-orders/today");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch today sales",
      );
    }
  },
);

export const createSaleOrder = createAsyncThunk(
  "sale/create",
  async (
    orderData: {
      customer_id?: number;
      order_date?: string;
      sale_type?: "retail" | "wholesale";
      payment_method?: string;
      discount_amount?: number;
      notes?: string;
      items: { fish_id: number; quantity: number; unit_price: number }[];
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/sale-orders", orderData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create sale order",
      );
    }
  },
);

export const updateSaleOrderStatus = createAsyncThunk(
  "sale/updateStatus",
  async (
    { id, status }: { id: number; status: string },
    { rejectWithValue },
  ) => {
    try {
      await api.patch(`/sale-orders/${id}/status`, { status });
      // re-fetch full order to ensure items are present
      const res = await api.get(`/sale-orders/${id}`);
      return res.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update sale order status",
      );
    }
  },
);

export const updateSaleOrderDetails = createAsyncThunk(
  "sale/updateDetails",
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/sale-orders/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update sale order",
      );
    }
  },
);

const saleSlice = createSlice({
  name: "sale",
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<SaleOrder | null>) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSaleOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSaleOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSaleOrderById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(fetchTodaySales.fulfilled, (state, action) => {
        state.todaySales = action.payload;
      })
      .addCase(createSaleOrder.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      .addCase(updateSaleOrderDetails.fulfilled, (state, action) => {
        const index = state.data.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) state.data[index] = action.payload;
        if (state.selected?.id === action.payload.id)
          state.selected = action.payload;
      })
      .addCase(updateSaleOrderStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      });
  },
});

export const { setSelected, clearError } = saleSlice.actions;
export default saleSlice.reducer;
