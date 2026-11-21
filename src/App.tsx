import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './services/auth';
import LanguageGate from './components/LanguageGate';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Auth from './pages/Auth';
import Account from './pages/Account';
import NotFound from './pages/NotFound';

// HashRouter : les adresses internes (#/catalogue) ne provoquent aucune erreur 404 sur GitHub Pages.
export default function App() {
  return (
    <AuthProvider>
      <LanguageGate>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="catalogue" element={<Catalogue />} />
              <Route path="connexion" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route path="compte" element={<Account />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </LanguageGate>
    </AuthProvider>
  );
}
