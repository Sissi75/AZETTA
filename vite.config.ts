import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relatif + HashRouter : fonctionne sur GitHub Pages (sous-dossier du dépôt ou domaine personnalisé)
export default defineConfig({
  base: './',
  plugins: [react()],
});
