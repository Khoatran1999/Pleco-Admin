import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../../services/api";

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
}

interface SupplierState {
  data: Supplier[];
  selected: Supplier | null;
  loading: boolean;
  error: string | null;
}

const initialState: SupplierState = {
  data: [],
  selected: null,
  loading: false,
  error: null,
};

export const fetchSuppliers = createAsyncThunk(
  "supplier/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/suppliers");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch suppliers",
      );
    }
  },
);

export const createSupplier = createAsyncThunk(
  "supplier/create",
  async (supplierData: any, { rejectWithValue }) => {
    try {
      // Let axios/browser set the correct multipart Content-Type (with boundary)
      const response = await api.post("/suppliers", supplierData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create supplier",
      );
    }
  },
);

export const updateSupplier = createAsyncThunk(
  "supplier/update",
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      // Let axios/browser set the correct multipart Content-Type (with boundary)
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update supplier",
      );
    }
  },
);

export const deleteSupplier = createAsyncThunk(
  "supplier/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/suppliers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete supplier",
      );
    }
  },
);

const supplierSlice = createSlice({
  name: "supplier",
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<Supplier | null>) => {
      state.selected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.data.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.data = state.data.filter((s) => s.id !== action.payload);
      });
  },
});

export const { setSelected, clearError } = supplierSlice.actions;
export default supplierSlice.reducer;
