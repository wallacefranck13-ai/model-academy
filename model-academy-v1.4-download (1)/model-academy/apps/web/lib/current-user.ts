import { createClient } from '@/lib/supabase/server';
import { prisma } from '@model-academy/database';

/** Synchronise the authenticated Supabase identity with the application profile. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;
  const email = authUser.email ?? null;
  const fullName = String(authUser.user_metadata?.full_name ?? email?.split('@')[0] ?? 'Model');
  const user = await prisma.user.upsert({
    where: { authUserId: authUser.id },
    update: { email, fullName },
    create: { authUserId: authUser.id, email, fullName, country: 'TG', locale: 'fr', status: 'ACTIVE', roles: { create: { role: 'MODEL' } }, modelProfile: { create: { country: 'TG' } } },
    include: { roles: true, modelProfile: true },
  });
  if (!user.modelProfile) await prisma.modelProfile.create({ data: { userId: user.id, country: 'TG' } });
  if (!user.roles.some((r) => r.role === 'MODEL')) await prisma.userRole.create({ data: { userId: user.id, role: 'MODEL' } });
  return prisma.user.findUnique({ where: { id: user.id }, include: { roles: true, modelProfile: true } });
}
