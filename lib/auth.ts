import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";

const SESSION_TOKEN_COOKIE = "session_token";

export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword);
}

export async function getCurrentUser() {
  try {
    const cookieStore = (await cookies()) as unknown as RequestCookies;
    const token = cookieStore.get(SESSION_TOKEN_COOKIE)?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) return null;

    // Check if session is expired
    if (new Date() > session.expires) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Update last activity by updating the session
    await prisma.session.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return session.user;
  } catch (error) {
    console.error('[GET_CURRENT_USER]', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
} 