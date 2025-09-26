import { NextResponse } from "next/server";

export async function HEAD() {
  // Intentionally do not handle GET to allow page.tsx to render
  return NextResponse.next();
}
