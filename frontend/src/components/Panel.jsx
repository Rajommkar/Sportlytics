function Panel({ title, children, className = "" }) {
  return (
    <div className={`rounded-[1.75rem] bg-white p-5 shadow-card ${className}`}>
      {title ? <h3 className="text-lg font-bold text-pitch">{title}</h3> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

export default Panel;
