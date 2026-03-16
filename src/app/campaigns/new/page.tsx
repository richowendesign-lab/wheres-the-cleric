import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionDM } from '@/lib/auth'
import { CampaignForm } from '@/components/CampaignForm'

export default async function NewCampaignPage() {
  const dm = await getSessionDM()
  if (!dm) redirect('/auth/login')
  return (
    <main className="min-h-screen text-gray-100 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white hover:underline transition-colors mb-6">
          ← Back
        </Link>
        <h1 className="font-fantasy text-3xl text-white mb-2">Create Campaign</h1>
        <p className="text-gray-400 mb-8">Name your campaign, set the planning window, and get a shareable join link.</p>
        <CampaignForm />
      </div>
    </main>
  )
}
