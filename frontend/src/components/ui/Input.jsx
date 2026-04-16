export default function Input({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300 focus:border-[#3730A3] transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}
