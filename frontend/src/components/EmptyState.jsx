function EmptyState({ title, description }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-card">
      <h3 className="text-lg font-bold text-pitch">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export default EmptyState;
