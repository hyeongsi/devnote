import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './components/auth/RequireAdmin';
import { AdminShell } from './components/layout/AdminShell';
import { PageShell } from './components/layout/PageShell';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { PostListPage } from './pages/PostListPage';
import { AdminAiPostingPage } from './pages/admin/AdminAiPostingPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMenusPage } from './pages/admin/AdminMenusPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PageShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/posts/:categorySlug" element={<PostListPage />} />
        <Route path="/posts/:categorySlug/:postSlug" element={<PostDetailPage />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="ai-posting" element={<AdminAiPostingPage />} />
          <Route path="menus" element={<AdminMenusPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
