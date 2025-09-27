import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t bg-background text-sm">
      {/* Link Columns (compact) */}
      <div className="container grid gap-6 py-6 md:grid-cols-4 md:py-8">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-foreground/80">PRODUCT</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/strategies">Features</Link></li>
            <li><Link className="hover:text-foreground" href="/support/faqs">FAQ</Link></li>
            <li><Link className="hover:text-foreground" href="/support/chat">Support</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-foreground/80">COMPANY</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="#">About Us</Link></li>
            <li><Link className="hover:text-foreground" href="#">Blog</Link></li>
            <li><Link className="hover:text-foreground" href="#">Careers</Link></li>
            <li><Link className="hover:text-foreground" href="#">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-foreground/80">RESOURCES</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><a className="hover:text-foreground" href="https://defillama.com" target="_blank" rel="noreferrer">Documentation</a></li>
            <li><Link className="hover:text-foreground" href="/docs">API Reference</Link></li>
            <li><Link className="hover:text-foreground" href="#">Community</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-wider text-foreground/80">LEGAL</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="#">Privacy Policy</Link></li>
            <li><Link className="hover:text-foreground" href="#">Terms of Service</Link></li>
            <li><Link className="hover:text-foreground" href="#">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom credits bar */}
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-4 text-muted-foreground md:flex-row">
          <p className="text-center md:text-left">© {new Date().getFullYear()} DeFi Smallcases. For demo only.</p>
          <p className="text-center leading-relaxed md:text-right">
            Made with <span className="mx-0.5">❤️</span> — credits to
            {" "}
            <a href="https://defillama.com" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">DefiLlama</a>,
            {" "}
            <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">shadcn/ui</a>,
            {" "}
            <a href="https://magicui.design" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">Magic UI</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
