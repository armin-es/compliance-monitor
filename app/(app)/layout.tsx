import { UserButton } from "@clerk/nextjs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600">
              <span className="text-xs font-bold text-white">EQ</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">EASE IQ</p>
              <p className="text-xs text-slate-500">Compliance Monitor</p>
            </div>
          </div>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
