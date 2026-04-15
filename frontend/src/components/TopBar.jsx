import { Menu } from 'lucide-react'

export default function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 h-14 shrink-0 bg-[#F2F4F7]">
      <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
        <Menu size={20} className="text-slate-700" />
      </button>
      <span className="text-lg font-bold text-[#3730A3]">Replog</span>
      <div className="w-9" />
    </div>
  )
}
