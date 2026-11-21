import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../services/auth';
import { supabaseConfigured } from '../services/supabase';

// Nom provisoire de la marque : à valider avant publication (voir README)
export const BRAND_NAME = 'Azetta';

const linkClass = ({ isActive }: { isActive: boolean }) => `px-2 py-1 font-medium ${isActive ? 'border-b-2 border-azure' : 'hover:text-azure'}`;

export default function Layout() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="band" aria-hidden="true" />
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-2xl">
            {BRAND_NAME}
          </Link>
          <nav className="flex flex-wrap items-center gap-2" aria-label="principal">
            <NavLink to="/" end className={linkClass}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/catalogue" className={linkClass}>
              {t('nav.catalogue')}
            </NavLink>
            {session ? (
              <>
                <NavLink to="/compte" className={linkClass}>
                  {t('nav.account')}
                </NavLink>
                <button type="button" className="btn-ghost" onClick={() => void signOut()}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <NavLink to="/connexion" className={linkClass}>
                {t('nav.login')}
              </NavLink>
            )}
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      {!supabaseConfigured && (
        <p role="alert" className="bg-rouge px-4 py-2 text-white">
          {t('common.configMissing')}
        </p>
      )}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
