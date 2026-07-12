import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './components/auth/RequireAdmin';
import { AdminShell } from './components/layout/AdminShell';
import { PageShell } from './components/layout/PageShell';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { GuestbookPage } from './pages/GuestbookPage';
import { LoginPage } from './pages/LoginPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { PostListPage } from './pages/PostListPage';
import { AdminAiPostingPage } from './pages/admin/AdminAiPostingPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminErrorLogDetailPage } from './pages/admin/AdminErrorLogDetailPage';
import { AdminErrorLogsPage } from './pages/admin/AdminErrorLogsPage';
import { AdminMenusPage } from './pages/admin/AdminMenusPage';
import { AdminPostsPage } from './pages/admin/AdminPostsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PageShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/guestbook" element={<GuestbookPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/posts/:categorySlug" element={<PostListPage />} />
        <Route path="/posts/:categorySlug/:postSlug" element={<PostDetailPage />} />
      </Route>

      <Route path="/admin" element={<RequireAdmin />}>
        <Route element={<AdminShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="ai-posting" element={<AdminAiPostingPage />} />
          <Route path="error-logs" element={<AdminErrorLogsPage />} />
          <Route path="error-logs/:id" element={<AdminErrorLogDetailPage />} />
          <Route path="menus" element={<AdminMenusPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
