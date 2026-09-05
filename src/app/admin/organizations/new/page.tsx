import NewOrgForm from './NewOrgForm';
import { getT } from '@/lib/i18n/server';

export default async function NewOrganizationPage() {
  const { t } = await getT();
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{t('aorg.new.title')}</h1>
          <p>{t('aorg.new.sub')}</p>
        </div>
      </div>

      <NewOrgForm />
    </div>
  );
}
