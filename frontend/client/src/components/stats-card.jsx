export default function StatsCard({ title, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <i className={`${icon} ${iconColor} text-xl`}></i>
        </div>
      </div>
    </div>
  );
}
