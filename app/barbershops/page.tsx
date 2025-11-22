'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/contexts/theme.context'
import { Loading } from '@/components/ui/Loading'

interface Barbershop {
  id: string
  name: string
  description: string | null
  city: string
  state: string
  latitude: number | null
  longitude: number | null
  logoUrl: string | null
  subscription?: {
    status: string
    trialEndsAt: Date | null
  }
  minPrice: number | null
  maxPrice: number | null
  servicesCount: number
  availableTimes?: string[]
  totalAvailableTimes?: number
}

export default function BarbershopsPage() {
  const { theme } = useTheme()
  // Função para obter a data de hoje
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  const [barbershops, setBarbershops] = useState<Barbershop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedDate, setSelectedDate] = useState('') // Campo vazio por padrão
  const [selectedTime, setSelectedTime] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'distance'>('name')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [loadingTimes, setLoadingTimes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchBarbershops()
    // Tentar obter localização do usuário
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Usuário negou ou erro ao obter localização
        }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchBarbershops = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCity) params.append('city', selectedCity)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      // Só filtrar por data/horário se não for o dia de hoje (ou seja, se o usuário selecionou outro dia)
      if (selectedDate && selectedDate !== getTodayDate()) {
        params.append('date', selectedDate)
        if (selectedTime) params.append('time', selectedTime)
      }

      const response = await fetch(`/api/barbershops?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBarbershops(data)
        // Sempre buscar horários após carregar barbearias (usando a data selecionada ou hoje)
        setTimeout(() => {
          fetchAvailableTimes(data)
        }, 300)
      }
    } catch (error) {
      console.error('Erro ao buscar barbearias:', error)
    } finally {
      setLoading(false)
    }
  }

  // Rebuscar quando filtros mudarem (com debounce)
  // Nota: selectedDate só dispara refetch se não for hoje (para não filtrar quando for hoje)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBarbershops()
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, minPrice, maxPrice, selectedDate !== getTodayDate() ? selectedDate : '', selectedTime])

  // Buscar horários disponíveis quando a data mudar ou quando as barbearias forem carregadas
  // Se não há data selecionada, buscar horários de hoje
  useEffect(() => {
    if (barbershops.length === 0) {
      return
    }

    // Aguardar um pouco para garantir que as barbearias foram carregadas
    const timeoutId = setTimeout(() => {
      fetchAvailableTimes(barbershops)
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, barbershops.length])

  const fetchAvailableTimes = async (shops: Barbershop[] = barbershops) => {
    if (shops.length === 0) return

    // Se não há data selecionada, usar a data de hoje
    const dateToUse = selectedDate || getTodayDate()

    for (const shop of shops) {
      setLoadingTimes(prev => ({ ...prev, [shop.id]: true }))
      try {
        const response = await fetch(
          `/api/barbershops/${shop.id}/available-times?date=${dateToUse}`
        )
        if (response.ok) {
          const data = await response.json()
          setBarbershops(prev =>
            prev.map(s =>
              s.id === shop.id
                ? {
                    ...s,
                    availableTimes: data.times || [],
                    totalAvailableTimes: data.total || 0,
                  }
                : s
            )
          )
        }
      } catch (error) {
        console.error(`Erro ao buscar horários para ${shop.name}:`, error)
      } finally {
        setLoadingTimes(prev => ({ ...prev, [shop.id]: false }))
      }
    }
  }

  // Calcular distância (Haversine)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filteredBarbershops = barbershops
    .filter((shop) => {
      const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.description?.toLowerCase().includes(searchTerm.toLowerCase())
      // Aceitar barbearias com status ACTIVE ou TRIAL (período de teste)
      const subscriptionStatus = shop.subscription?.status
      const matchesSubscription = subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL'
      return matchesSearch && matchesSubscription
    })
    .map(shop => {
      let distance: number | null = null
      if (userLocation && shop.latitude && shop.longitude) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          shop.latitude,
          shop.longitude
        )
      }
      return { ...shop, distance }
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'price') {
        const priceA = a.minPrice || Infinity
        const priceB = b.minPrice || Infinity
        return priceA - priceB
      }
      if (sortBy === 'distance') {
        const distA = a.distance || Infinity
        const distB = b.distance || Infinity
        return distA - distB
      }
      return 0
    })

  const cities = Array.from(new Set(barbershops.map(shop => shop.city))).sort()

  if (loading && barbershops.length === 0) {
    return <Loading fullScreen text="Carregando barbearias..." />
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Barbearias Disponíveis</h1>
            <p className="mt-2 text-sm opacity-70">
              Encontre a barbearia perfeita para você
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg overflow-hidden">
            {/* Botão para expandir/recolher filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="font-medium">Filtros e Ordenação</span>
                {(selectedCity || minPrice || maxPrice || searchTerm || selectedDate || selectedTime) && (
                  <span className="text-xs bg-[var(--primary)] text-[var(--primary-foreground)] px-2 py-1 rounded-full">
                    Ativos
                  </span>
                )}
              </div>
            </button>

            {/* Conteúdo dos filtros (recolhível) */}
            {showFilters && (
              <div className="px-4 pb-4 space-y-4 border-t border-[var(--card-border)] pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">Todas as cidades</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Preço mínimo (R$)"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <input
                    type="number"
                    placeholder="Preço máximo (R$)"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                      Data disponível
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    {!selectedDate && (
                      <p className="text-xs text-[var(--foreground)]/60 mt-1">
                        📅 Mostrando horários de hoje
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                      Horário disponível
                    </label>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      disabled={!selectedDate}
                      className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Ordenar por:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'distance')}
                      className="px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="name">Nome</option>
                      <option value="price">Menor preço</option>
                      {userLocation && <option value="distance">Proximidade</option>}
                    </select>
                  </div>
                  {!userLocation && typeof window !== 'undefined' && navigator.geolocation && (
                    <button
                      onClick={() => {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setUserLocation({
                              lat: position.coords.latitude,
                              lng: position.coords.longitude,
                            })
                          },
                          () => {
                            alert('Não foi possível obter sua localização')
                          }
                        )
                      }}
                      className="px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition"
                    >
                      📍 Usar minha localização
                    </button>
                  )}
                  {(selectedCity || minPrice || maxPrice || searchTerm || selectedDate || selectedTime) && (
                    <button
                      onClick={() => {
                        setSelectedCity('')
                        setMinPrice('')
                        setMaxPrice('')
                        setSearchTerm('')
                        setSelectedDate('') // Limpar data (volta a mostrar horários de hoje)
                        setSelectedTime('')
                      }}
                      className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-md hover:bg-[var(--hover-bg)] transition whitespace-nowrap"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {loading && barbershops.length > 0 && (
            <div className="flex justify-center py-4">
              <Loading size="sm" text="Atualizando..." />
            </div>
          )}

          {filteredBarbershops.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">✂️</div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  {barbershops.length === 0
                    ? 'Nenhuma barbearia cadastrada ainda'
                    : 'Nenhuma barbearia encontrada'}
                </h3>
                <p className="text-sm text-[var(--foreground)]/60">
                  {barbershops.length === 0
                    ? 'Seja o primeiro a cadastrar uma barbearia!'
                    : 'Tente ajustar os filtros de busca para encontrar mais resultados.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbershops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/barbershops/${shop.id}`}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
                >
                  {/* Imagem de capa ou logo */}
                  <div className="relative h-48 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 overflow-hidden">
                    {shop.logoUrl ? (
                      <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-6xl font-bold text-[var(--primary)]/30">
                          ✂️
                        </div>
                      </div>
                    )}
                    {/* Badge de distância */}
                    {shop.distance !== null && (
                      <div className="absolute top-3 right-3 bg-[var(--background)]/90 backdrop-blur-sm text-[var(--foreground)] px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        📍 {shop.distance.toFixed(1)} km
                      </div>
                    )}
                    {/* Badge de status */}
                    {shop.subscription?.status === 'TRIAL' && (
                      <div className="absolute top-3 left-3 bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        🎁 Período de Teste
                      </div>
                    )}
                  </div>
                  
                  {/* Conteúdo do card */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-[var(--foreground)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                        {shop.name}
                      </h3>
                      {shop.description && (
                        <p className="text-sm text-[var(--foreground)]/70 line-clamp-2">
                          {shop.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Localização */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-[var(--foreground)]/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{shop.city}, {shop.state}</span>
                    </div>

                    {/* Horários disponíveis - sempre mostrar (hoje por padrão ou data selecionada) */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-[var(--foreground)]/70">
                          Horários disponíveis {!selectedDate ? '(hoje)' : ''}
                        </span>
                      </div>
                        {loadingTimes[shop.id] ? (
                          <div className="flex gap-2">
                            <div className="h-7 w-16 bg-[var(--input-bg)] rounded-md animate-pulse" />
                            <div className="h-7 w-16 bg-[var(--input-bg)] rounded-md animate-pulse" />
                            <div className="h-7 w-16 bg-[var(--input-bg)] rounded-md animate-pulse" />
                          </div>
                        ) : shop.availableTimes && shop.availableTimes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {shop.availableTimes.map((time) => (
                              <span
                                key={time}
                                className="px-3 py-1 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-full hover:bg-[var(--primary)]/20 transition-colors"
                              >
                                {time}
                              </span>
                            ))}
                            {shop.totalAvailableTimes && shop.totalAvailableTimes > shop.availableTimes.length && (
                              <span className="px-3 py-1 text-xs font-medium text-[var(--foreground)]/60 border border-[var(--card-border)] rounded-full">
                                +{shop.totalAvailableTimes - shop.availableTimes.length} mais
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--foreground)]/50 italic">
                            Nenhum horário disponível neste dia
                          </p>
                        )}
                      </div>
                    
                    {/* Preço e serviços */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
                      {shop.minPrice !== null ? (
                        <div>
                          <p className="text-xs text-[var(--foreground)]/50 mb-1">A partir de</p>
                          <p className="text-lg font-bold text-[var(--primary)]">
                            R$ {shop.minPrice.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-[var(--foreground)]/50">Preços sob consulta</p>
                        </div>
                      )}
                      {shop.servicesCount > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-[var(--foreground)]/50 mb-1">Serviços</p>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {shop.servicesCount} {shop.servicesCount === 1 ? 'serviço' : 'serviços'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
