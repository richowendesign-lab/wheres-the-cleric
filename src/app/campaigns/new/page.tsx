import { CampaignForm } from '@/components/CampaignForm'

export default function NewCampaignPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <h1 className="font-fantasy text-3xl text-amber-400 mb-2">Create Campaign</h1>
        <p className="text-gray-400 mb-8">Set the planning window to create your campaign and get a shareable join link.</p>
        <CampaignForm />
      </div>
    </main>
  )
}
