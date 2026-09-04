import Icon from '@/components/Icon';

export type StatColor = 'purple' | 'gold' | 'green' | 'blue';

/** بطاقة إحصاء واحدة مع أيقونة ملوّنة وقيمة واتجاه اختياري. */
export default function StatCard({
  icon,
  color = 'purple',
  label,
  value,
  trend,
}: {
  icon: string;
  color?: StatColor;
  label: string;
  value: string | number;
  trend?: string;
}) {
  const cls = color === 'purple' ? '' : color;
  return (
    <div className="dash-stat">
      <div className="dash-stat-label">
        <span className={`dash-stat-ic ${cls}`}>
          <Icon name={icon} size={15} />
        </span>
        {label}
      </div>
      <div className="dash-stat-value">{value}</div>
      {trend && <span className="dash-stat-trend up">▲ {trend}</span>}
    </div>
  );
}
