import { Sidebar } from '@/components/dashboard/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">{children}</main>
    </div>
  )
}
