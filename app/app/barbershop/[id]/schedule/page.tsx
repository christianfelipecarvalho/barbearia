'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'

export default function BarbershopSchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href={`/app/barbershop/${barbershopId}`} />
            <h1 className="text-3xl font-bold">Agenda</h1>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center">
            <p className="text-lg opacity-70">Página em desenvolvimento</p>
          </div>
        </div>
      </div>
    </div>
  )
}

