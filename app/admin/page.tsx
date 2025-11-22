'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [barbershops, setBarbershops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'ADMIN_GLOBAL') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'ADMIN_GLOBAL') {
      // TODO: Buscar lista de barbearias
      setLoading(false)
    }
  }, [status, session])

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Painel Administrativo
            </h1>
            <p className="mt-2 text-black">
              Gerencie todas as barbearias da plataforma
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-black">
            <div className="px-6 py-4 border-b border-black">
              <h2 className="text-xl font-semibold text-black">
                Barbearias
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-black">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {barbershops.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-black">
                        Nenhuma barbearia cadastrada ainda
                      </td>
                    </tr>
                  ) : (
                    barbershops.map((shop) => (
                      <tr key={shop.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                          {shop.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {shop.city || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            shop.subscription?.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : shop.subscription?.status === 'TRIAL'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {shop.subscription?.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-black hover:underline">
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

