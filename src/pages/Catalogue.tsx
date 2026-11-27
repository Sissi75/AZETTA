import { useTranslation } from 'react-i18next';
import ModelGrid from '../components/ModelGrid';

export default function Catalogue() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="mb-6 font-display text-3xl">{t('catalogue.title')}</h1>
      <ModelGrid />
    </section>
  );
}
