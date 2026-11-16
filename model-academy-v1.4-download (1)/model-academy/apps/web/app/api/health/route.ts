import { NextResponse } from 'next/server';
import { prisma } from '@model-academy/database';
export const dynamic = 'force-dynamic';
export async function GET() {
  const checks: Record<string, string> = {
    application: 'ok',
    database: 'unknown',
    supabase: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    ai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'unavailable';
  }
  const healthy = checks.database === 'ok' && checks.supabase === 'configured';
  return NextResponse.json({ status: healthy ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() }, { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
