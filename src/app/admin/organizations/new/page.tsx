import NewOrgForm from './NewOrgForm';

export default function NewOrganizationPage() {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>إنشاء مؤسسة جديدة</h1>
          <p>عرّف المؤسسة، وأنشئ حساب مديرها في نفس الوقت.</p>
        </div>
      </div>

      <NewOrgForm />
    </div>
  );
}
