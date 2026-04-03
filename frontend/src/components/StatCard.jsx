function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-[1.75rem] bg-white p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-pitch">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
    </article>
  );
}

export default StatCard;
