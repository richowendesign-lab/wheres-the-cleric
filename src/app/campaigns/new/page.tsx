import Link from 'next/link'
import { CampaignForm } from '@/components/CampaignForm'

export default function NewCampaignPage() {
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
