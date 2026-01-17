import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../../services/api";

export interface Fish {
  id: number;
  sku: string;
  name: string;
  scientific_name: string;
  size: string;
  category_id: number;
  category_name?: string;
  description: string;
  retail_price: number;
  wholesale_price: number;
  cost_price: number;
  unit: string;
  image: string;
  min_stock: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

interface FishState {
  data: Fish[];
  selected: Fish | null;
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: FishState = {
  data: [],
  selected: null,
  loading: false,
  error: null,
  total: 0,
};

export const fetchFishes = createAsyncThunk(
  "fish/fetchAll",
  async (
    filters: {
      category_id?: string;
      category?: string;
      status?: string;
      search?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      // prefer category_id if provided (backend expects category_id)
      if (filters.category_id)
        params.append("category_id", filters.category_id);
      else if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/fishes?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch fishes"
      );
    }
  }
);

export const fetchFishById = createAsyncThunk(
  "fish/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/fishes/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch fish"
      );
    }
  }
);

export const createFish = createAsyncThunk(
  "fish/create",
  async (fishData: Partial<Fish>, { rejectWithValue }) => {
    try {
      const response = await api.post("/fishes", fishData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create fish"
      );
    }
  }
);

export const updateFish = createAsyncThunk(
  "fish/update",
  async (
    { id, data }: { id: number; data: Partial<Fish> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/fishes/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update fish"
      );
    }
  }
);

export const deleteFish = createAsyncThunk(
  "fish/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/fishes/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete fish"
      );
    }
  }
);

const fishSlice = createSlice({
  name: "fish",
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<Fish | null>) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFishes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFishes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.total = action.payload.meta?.total || action.payload.data.length;
      })
      .addCase(fetchFishes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFishById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createFish.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateFish.fulfilled, (state, action) => {
        const index = state.data.findIndex((f) => f.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })
      .addCase(deleteFish.fulfilled, (state, action) => {
        state.data = state.data.filter((f) => f.id !== action.payload);
        state.total -= 1;
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      });
  },
});

export const { setSelected, clearError } = fishSlice.actions;
export default fishSlice.reducer;
