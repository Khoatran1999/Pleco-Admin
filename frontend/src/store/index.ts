import { configureStore } from "@reduxjs/toolkit";
import fishReducer from "./features/fish/fishSlice";
import categoryReducer from "./features/category/categorySlice";
import inventoryReducer from "./features/inventory/inventorySlice";
import importReducer from "./features/import/importSlice";
import saleReducer from "./features/sale/saleSlice";
import reportReducer from "./features/report/reportSlice";
import supplierReducer from "./features/supplier/supplierSlice";
import customerReducer from "./features/customer/customerSlice";
import authReducer from "./features/auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fish: fishReducer,
    category: categoryReducer,
    inventory: inventoryReducer,
    import: importReducer,
    sale: saleReducer,
    report: reportReducer,
    supplier: supplierReducer,
    customer: customerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
