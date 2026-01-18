import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../../services/api";

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active?: boolean;
  fish_count?: number;
  created_at: string;
  updated_at: string;
}

interface CategoryState {
  data: Category[];
  selected: Category | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  data: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  "category/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/categories");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories",
      );
    }
  },
);

export const fetchCategoryById = createAsyncThunk(
  "category/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch category",
      );
    }
  },
);

export const createCategory = createAsyncThunk(
  "category/create",
  async (
    categoryData: { name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post("/categories", categoryData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category",
      );
    }
  },
);

export const updateCategory = createAsyncThunk(
  "category/update",
  async (
    { id, data }: { id: number; data: { name?: string; description?: string } },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category",
      );
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "category/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/categories/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category",
      );
    }
  },
);

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<Category | null>) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.data.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.data = state.data.filter((c) => c.id !== action.payload);
        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      });
  },
});

export const { setSelected, clearError } = categorySlice.actions;
export default categorySlice.reducer;
