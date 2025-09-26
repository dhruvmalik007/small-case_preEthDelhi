import type { ReactNode } from "react";
import { Sidebar } from "@/app/investor/_components/sidebar";

export default function InvestorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container grid gap-6 py-8 md:grid-cols-[240px_1fr]">
      <aside>
        <Sidebar />
      </aside>
      <section>
        {children}
      </section>
    </div>
  );
}
