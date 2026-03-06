'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  verifyPassword,
  createSession,
  SESSION_COOKIE_NAME,
} from '@/lib/auth'

const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

function setSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>, token: string) {
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email) return { error: 'Email is required.' }
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const existing = await prisma.dM.findUnique({ where: { email } })
  if (existing) return { error: 'An account with this email already exists.' }

  const passwordHash = await hashPassword(password)
  const dm = await prisma.dM.create({ data: { email, passwordHash } })

  const token = await createSession(dm.id)
  const cookieStore = await cookies()
  setSessionCookie(cookieStore, token)

  redirect('/')
}

export async function logIn(_prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Invalid email or password.' }

  const dm = await prisma.dM.findUnique({ where: { email } })
  if (!dm) return { error: 'Invalid email or password.' }

  const valid = await verifyPassword(password, dm.passwordHash)
  if (!valid) return { error: 'Invalid email or password.' }

  const token = await createSession(dm.id)
  const cookieStore = await cookies()
  setSessionCookie(cookieStore, token)

  redirect('/')
}

export async function logOut() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
  redirect('/')
}
