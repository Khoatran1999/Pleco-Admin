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

const AppInner: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
    <AppInner />
  </BrowserRouter>
);

export default App;
