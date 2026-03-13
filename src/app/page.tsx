import { redirect } from 'next/navigation'
import { getSessionDM } from '@/lib/auth'
import { LandingPage } from '@/components/LandingPage'

export default async function HomePage() {
  const dm = await getSessionDM()
  if (dm) redirect('/campaigns')
  return <LandingPage />
}
