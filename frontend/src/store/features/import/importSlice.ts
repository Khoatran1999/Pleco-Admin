import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../../services/api";

interface ImportOrderItem {
  id: number;
  fish_id: number;
  fish_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch_id: string;
}

interface ImportOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_contact: string | null;
  supplier_phone: string | null;
  supplier_email: string | null;
  expected_delivery: string;
  delivery_date: string | null;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  total_amount: number;
  notes: string;
  item_count: number;
  items?: ImportOrderItem[];
  created_at: string;
  created_by_name: string | null;
}

interface ImportState {
  data: ImportOrder[];
  selected: ImportOrder | null;
  loading: boolean;
  error: string | null;
}

const initialState: ImportState = {
  data: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchImportOrders = createAsyncThunk(
  "import/fetchAll",
  async (
    filters: { status?: string; supplier_id?: number } = {},
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.supplier_id)
        params.append("supplier_id", filters.supplier_id.toString());

      const response = await api.get(`/import-orders?${params.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch import orders",
      );
    }
  },
);

export const fetchImportOrderById = createAsyncThunk(
  "import/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/import-orders/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch import order",
      );
    }
  },
);

export const createImportOrder = createAsyncThunk(
  "import/create",
  async (
    orderData: {
      supplier_id: number;
      expected_delivery?: string;
      notes?: string;
      total_amount?: number;
      items: { fish_id: number; quantity: number; unit_price: number }[];
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/import-orders", orderData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create import order",
      );
    }
  },
);

export const updateImportOrderStatus = createAsyncThunk(
  "import/updateStatus",
  async (
    {
      id,
      status,
      total_amount,
    }: { id: number; status: string; total_amount?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(`/import-orders/${id}/status`, {
        status,
        total_amount,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update import order status",
      );
    }
  },
);

export const deleteImportOrder = createAsyncThunk(
  "import/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/import-orders/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete import order",
      );
    }
  },
);

const importSlice = createSlice({
  name: "import",
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<ImportOrder | null>) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchImportOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchImportOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchImportOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchImportOrderById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createImportOrder.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      .addCase(updateImportOrderStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })
      .addCase(deleteImportOrder.fulfilled, (state, action) => {
        state.data = state.data.filter((o) => o.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      });
  },
});

export const { setSelected, clearError } = importSlice.actions;
export default importSlice.reducer;
