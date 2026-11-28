import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../services/auth';

const link = ({ isActive }: { isActive: boolean }) => `rounded-md px-3 py-2 font-medium ${isActive ? 'bg-ink text-white' : 'border border-ink/30 hover:bg-surface'}`;

export default function AdminLayout() {
  const { t } = useTranslation();
  const { session, roles, loading } = useAuth();

  if (loading) return <p>{t('common.loading')}</p>;
  if (!session) return <Navigate to="/connexion" replace />;
  if (!roles.includes('admin')) return <p role="alert">{t('admin.common.forbidden')}</p>;

  return (
    <div className="grid gap-6">
      <h1 className="font-display text-3xl">{t('admin.title')}</h1>
      <nav className="flex flex-wrap gap-2" aria-label="administration">
        <NavLink to="/admin/modeles" className={link}>
          {t('admin.nav.models')}
        </NavLink>
        <NavLink to="/admin/composants" className={link}>
          {t('admin.nav.options')}
        </NavLink>
        <NavLink to="/admin/tissus" className={link}>
          {t('admin.nav.fabrics')}
        </NavLink>
        <NavLink to="/admin/tailles" className={link}>
          {t('admin.nav.sizes')}
        </NavLink>
        <NavLink to="/admin/reglages" className={link}>
          {t('admin.nav.settings')}
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
