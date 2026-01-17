import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../../services/api";

interface InventoryItem {
  id: number;
  fish_id: number;
  fish_name: string;
  sku: string;
  size: string;
  category_id: number;
  category_name: string;
  retail_price: number;
  wholesale_price: number;
  quantity: number;
  min_stock: number;
  status: string;
}

interface InventoryLog {
  id: number;
  fish_id: number;
  fish_name: string;
  type: "import" | "sale" | "adjustment" | "loss";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string;
  reference_id: number;
  note: string;
  loss_reason?: string;
  created_by_name: string;
  created_at: string;
}

interface LossLog {
  id: number;
  fish_id: number;
  fish_name: string;
  sku: string;
  quantity_change: number;
  loss_reason: string;
  note: string;
  created_by_name: string;
  created_at: string;
}

interface InventoryState {
  data: InventoryItem[];
  logs: InventoryLog[];
  lossLogs: LossLog[];
  selected: InventoryItem | null;
  loading: boolean;
  error: string | null;
  totalQuantity: number;
  totalProducts: number;
}

const initialState: InventoryState = {
  data: [],
  logs: [],
  lossLogs: [],
  selected: null,
  loading: false,
  error: null,
  totalQuantity: 0,
  totalProducts: 0,
};

export const fetchInventory = createAsyncThunk(
  "inventory/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/inventory");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch inventory"
      );
    }
  }
);

export const fetchInventoryTotal = createAsyncThunk(
  "inventory/fetchTotal",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/inventory/total");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch inventory total"
      );
    }
  }
);

export const fetchInventoryLogs = createAsyncThunk(
  "inventory/fetchLogs",
  async (fishId: number | undefined, { rejectWithValue }) => {
    try {
      const url = fishId
        ? `/inventory/logs?fish_id=${fishId}`
        : "/inventory/logs";
      const response = await api.get(url);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch inventory logs"
      );
    }
  }
);

export const adjustStock = createAsyncThunk(
  "inventory/adjust",
  async (
    data: {
      fish_id: number;
      quantity: number;
      type: "add" | "reduce";
      note?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/inventory/adjust", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to adjust stock"
      );
    }
  }
);

export const recordLoss = createAsyncThunk(
  "inventory/recordLoss",
  async (
    data: {
      fish_id: number;
      quantity: number;
      loss_reason: string;
      note?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/inventory/record-loss", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to record loss"
      );
    }
  }
);

export const fetchLossLogs = createAsyncThunk(
  "inventory/fetchLossLogs",
  async (fishId: number | undefined, { rejectWithValue }) => {
    try {
      const url = fishId
        ? `/inventory/loss-logs?fish_id=${fishId}`
        : "/inventory/loss-logs";
      const response = await api.get(url);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch loss logs"
      );
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<InventoryItem | null>) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchInventoryTotal.fulfilled, (state, action) => {
        state.totalQuantity = action.payload.total_quantity || 0;
        state.totalProducts = action.payload.total_products || 0;
      })
      .addCase(fetchInventoryLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      })
      .addCase(adjustStock.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (i) => i.fish_id === action.payload.fish_id
        );
        if (index !== -1) {
          state.data[index].quantity = action.payload.new_quantity;
        }
      })
      .addCase(recordLoss.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (i) => i.fish_id === action.payload.fish_id
        );
        if (index !== -1) {
          state.data[index].quantity = action.payload.new_quantity;
        }
      })
      .addCase(fetchLossLogs.fulfilled, (state, action) => {
        state.lossLogs = action.payload;
      });
  },
});

export const { setSelected, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;
