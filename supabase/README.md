# Supabase

Le schéma est déjà appliqué sur le projet « AZETTA PROJECT » (7 migrations : identités et langues, catalogue et stocks,
commandes et paiements, production / qualité / logistique / SAV, politiques RLS et stockage, privilèges).

Les fichiers SQL correspondants seront exportés dans `supabase/migrations/` pour que le dépôt soit la source de vérité.
`supabase/functions/` accueillera les Edge Functions (confirmation automatique des paiements, notifications e-mail/SMS).
