import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <div className="max-w-[430px] mx-auto flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 px-4 pb-28 pt-2">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
