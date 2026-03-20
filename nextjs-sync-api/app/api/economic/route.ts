import { NextResponse } from 'next/server';

// Placeholder — economic data is served by the main Express backend.
// This route exists so any requests hitting the Next.js app don't 404.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json([]);
}
