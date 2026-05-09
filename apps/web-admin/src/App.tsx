import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import { Shell } from "./components/Shell";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { BillingPage } from "./pages/BillingPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { TemplatesPage } from "./pages/TemplatesPage";


export default function App() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <LoginPage />;
  }

  if (user.role !== "SUPER_ADMIN") {
    return <LoginPage message="Super admin access is required for this console." />;
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
