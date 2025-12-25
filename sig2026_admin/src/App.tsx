import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireRole from "./components/auth/RequireRole";
import { AdminLayout, AdminDashboard, AdminEmployees, AdminRecords, AdminPayments } from "./pages/admin";

// صفحاتك الحالية (مثال)
import Home from "./pages/admin/Home";
import Login from "./pages/admin/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireRole allowed={["admin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="records" element={<AdminRecords />} />
          <Route path="payments" element={<AdminPayments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
