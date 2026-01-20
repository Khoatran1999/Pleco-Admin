import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./screens/Dashboard";
import Inventory from "./screens/Inventory";
import Reports from "./screens/Reports";
import Orders from "./screens/Orders";
import Suppliers from "./screens/Suppliers";
import NewImportOrder from "./screens/NewImportOrder";
import NewSaleOrder from "./screens/NewSaleOrder";
import NewFish from "./screens/NewFish";
import Customers from "./screens/Customers";
import Categories from "./screens/Categories";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Imports from "./screens/Imports";
import Quotation from "./screens/Quotation";
import Login from "./screens/Login";
import ProtectedRoute from "./components/ProtectedRoute";

const AppInner: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-soft relative">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-40"></div>
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/inventory"
              element={
                <Inventory
                  onAddItem={() => navigate("/inventory/new")}
                  onEditItem={(id: number) => navigate(`/fish/${id}/edit`)}
                />
              }
            />
            <Route
              path="/inventory/new"
              element={<NewFish onBack={() => navigate("/inventory")} />}
            />
            <Route
              path="/imports"
              element={<Imports onNewImport={() => navigate("/imports/new")} />}
            />
            <Route
              path="/imports/new"
              element={<NewImportOrder onBack={() => navigate("/imports")} />}
            />
            <Route path="/orders" element={<Orders />} />
            <Route
              path="/orders/new"
              element={<NewSaleOrder onBack={() => navigate("/orders")} />}
            />
            <Route path="/customers" element={<Customers />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/quotation" element={<Quotation />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route
              path="/fish/:id/edit"
              element={
                <NewFish onBack={() => navigate("/inventory")} editMode />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppInner />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

export default App;
