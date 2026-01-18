import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "../../../services/api";

interface Customer {
  id: number;
  name: string;
  email: string;
  social?: string;
  phone: string;
  address: string;
  customer_type?: string;
  is_active: boolean;
  created_at: string;
}

interface CustomerState {
  data: Customer[];
  selected: Customer | null;
  searchResults: Customer[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  data: [],
  selected: null,
  searchResults: [],
  loading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk(
  "customer/fetchAll",
  async (_: {} | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get("/customers");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers",
      );
    }
  },
);

export const searchCustomers = createAsyncThunk(
  "customer/search",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/customers/search?q=${encodeURIComponent(query)}`,
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search customers",
      );
    }
  },
);

export const createCustomer = createAsyncThunk(
  "customer/create",
  async (customerData: Partial<Customer>, { rejectWithValue }) => {
    try {
      const response = await api.post("/customers", customerData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create customer",
      );
    }
  },
);

export const updateCustomer = createAsyncThunk(
  "customer/update",
  async (
    { id, data }: { id: number; data: Partial<Customer> },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(`/customers/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update customer",
      );
    }
  },
);

export const deleteCustomer = createAsyncThunk(
  "customer/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete customer",
      );
    }
  },
);

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setSelected: (state, action: PayloadAction<Customer | null>) => {
      state.selected = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchCustomers.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.data.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.data = state.data.filter((c) => c.id !== action.payload);
      });
  },
});

export const { setSelected, clearSearchResults, clearError } =
  customerSlice.actions;
export default customerSlice.reducer;
