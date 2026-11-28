import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './services/auth';
import LanguageGate from './components/LanguageGate';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Configurator from './pages/Configurator';
import Auth from './pages/Auth';
import Account from './pages/Account';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminModels from './pages/admin/AdminModels';
import AdminOptions from './pages/admin/AdminOptions';
import AdminFabrics from './pages/admin/AdminFabrics';
import AdminSizes from './pages/admin/AdminSizes';
import AdminSettings from './pages/admin/AdminSettings';

// HashRouter : les adresses internes (#/catalogue) ne provoquent aucune erreur 404 sur GitHub Pages
export default function App() {
  return (
    <AuthProvider>
      <LanguageGate>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="catalogue" element={<Catalogue />} />
              <Route path="personnaliser/:modelId" element={<Configurator />} />
              <Route path="connexion" element={<Auth />} />
              <Route path="compte" element={<Account />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="modeles" replace />} />
                <Route path="modeles" element={<AdminModels />} />
                <Route path="composants" element={<AdminOptions />} />
                <Route path="tissus" element={<AdminFabrics />} />
                <Route path="tailles" element={<AdminSizes />} />
                <Route path="reglages" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </LanguageGate>
    </AuthProvider>
  );
}
