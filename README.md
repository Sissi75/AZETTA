# Azetta — réseau numérique des couturières de robes kabyles

Plateforme de personnalisation, commande, fabrication décentralisée et livraison de robes kabyles (Tizi Ouzou).
Projet candidat à l'Innovation Challenge ESS 3 (PNUD Algérie).

## Architecture

- **Frontend** : React + TypeScript + Vite + Tailwind, site statique publié sur **GitHub Pages** (routage par `#`, aucune erreur 404 sur les pages internes).
- **Backend** : **Supabase** (PostgreSQL, Auth, Storage, Edge Functions). Sécurité par Row Level Security.
- **Langues** : français, arabe (RTL), tamazight en latin et en tifinagh. Une traduction manquante retombe sur la langue de repli, jamais sur une clé vide.

## Démarrer en local

```bash
npm install
cp .env.example .env   # valeurs publiques du projet Supabase
npm run dev
```

## Publication

1. Sur GitHub : **Settings → Pages → Source : GitHub Actions**.
2. Chaque envoi sur la branche `main` compile et publie automatiquement (`.github/workflows/deploy.yml`).
3. Branches : `dev` (travail, vérifié par `ci.yml`) et `main` (production).

## Sécurité

- Seule la clé *publishable* est utilisée dans le frontend. **Ne jamais** y placer la clé `service_role`.
- Les règles métier critiques (prix, avance 30 %, solde, blocage d'expédition sans paiement intégral) sont appliquées dans la base, pas dans l'interface.

## Premier administrateur

Après votre inscription dans l'application, exécutez dans l'éditeur SQL Supabase (en remplaçant l'adresse) :

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'votre-adresse@exemple.dz';
```

## Avancement

Fait : base de données, authentification, choix de langue (RTL/LTR), catalogue en lecture, compte et liste des commandes.
À faire : configurateur et mensurations, panier et paiement, espaces couturière / qualité / logistique / approvisionnement, administration, notifications, traductions complètes.

## À valider avant publication

- Le nom « Azetta » est provisoire.
- Les traductions tamazight sont volontairement partielles : à compléter et faire valider par une locutrice ou un locuteur.
- Les conditions d'annulation et de remboursement (avance non remboursable) doivent être vérifiées juridiquement.
