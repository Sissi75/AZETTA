import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="grid gap-4">
      <h1 className="font-display text-3xl">{t('common.notFound')}</h1>
      <Link to="/" className="btn w-fit">
        {t('nav.home')}
      </Link>
    </section>
  );
}
