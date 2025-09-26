"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = localStorage.getItem("watchlist:v1");
  try {
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persist(s: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem("watchlist:v1", JSON.stringify(Array.from(s)));
}

export function useWatchlist() {
  const [set, setState] = React.useState<Set<string>>(() => getSet());
  const add = (slug: string) => setState((prev) => {
    const next = new Set(prev);
    next.add(slug);
    persist(next);
    return next;
  });
  const remove = (slug: string) => setState((prev) => {
    const next = new Set(prev);
    next.delete(slug);
    persist(next);
    return next;
  });
  const has = (slug: string) => set.has(slug);
  return { has, add, remove };
}

export function WatchlistButton({ slug }: { slug: string }) {
  const { has, add, remove } = useWatchlist();
  const isSaved = has(slug);
  return (
    <Button
      type="button"
      size="sm"
      variant={isSaved ? "secondary" : "outline"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        isSaved ? remove(slug) : add(slug);
      }}
      className="gap-2"
      aria-pressed={isSaved}
    >
      {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      <span className="hidden sm:inline">{isSaved ? "Saved" : "Watchlist"}</span>
    </Button>
  );
}
