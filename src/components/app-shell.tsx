import { SidebarNav } from "@/components/sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
  email?: string;
  isAdmin?: boolean;
};

export function AppShell({ children, email, isAdmin }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f6f3]">
      <SidebarNav email={email} isAdmin={isAdmin} />
      <div className="lg:pl-72">
        <main className="mx-auto min-h-screen w-full max-w-[1680px] px-5 py-7 sm:px-7 sm:py-9 lg:px-10 xl:px-12 xl:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
