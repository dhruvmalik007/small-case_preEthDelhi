import Link from "next/link";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountDropdown } from "@/components/site/account-dropdown";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            DeFi Smallcases
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/strategies" className="hover:text-foreground">
              Strategies
            </Link>
            <Link href="/" className="hover:text-foreground">
              Explore
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <ThemeToggle />
          <AccountDropdown />
        </div>
      </div>
    </header>
  );
}
