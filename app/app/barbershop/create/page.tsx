'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'

interface Service {
  name: string
  description: string
  price: string
  duration: string
}

interface WorkingHours {
  dayOfWeek: number
  startTime: string
  endTime: string
  isOpen: boolean
}

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export default function CreateBarbershopPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    acceptsPublicRequests: false,
  })

  const [services, setServices] = useState<Service[]>([
    { name: '', description: '', price: '', duration: '30' },
  ])

  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(
    DAYS.map(day => ({
      dayOfWeek: day.value,
      startTime: '09:00',
      endTime: '18:00',
      isOpen: day.value !== 0, // Fechado no domingo por padrão
    }))
  )

  if (status === 'loading') {
    return <Loading fullScreen text="Carregando..." />
  }

  if (status === 'unauthenticated' || session?.user.role !== 'BARBEIRO') {
    router.push('/auth/signin')
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceChange = (index: number, field: keyof Service, value: string) => {
    setServices(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addService = () => {
    setServices(prev => [...prev, { name: '', description: '', price: '', duration: '30' }])
  }

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleWorkingHoursChange = (
    index: number,
    field: keyof WorkingHours,
    value: string | boolean
  ) => {
    setWorkingHours(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
        },
        () => {
          alert('Não foi possível obter sua localização')
        }
      )
    }
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name || !formData.address || !formData.city || !formData.state) {
        setError('Preencha todos os campos obrigatórios')
        return false
      }
    }
    if (step === 2) {
      // Localização é opcional, mas se preenchida deve ser válida
      if (formData.latitude && formData.longitude) {
        const lat = parseFloat(formData.latitude)
        const lng = parseFloat(formData.longitude)
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setError('Coordenadas inválidas')
          return false
        }
      }
    }
    if (step === 3) {
      // Validar pelo menos um dia aberto
      const hasOpenDay = workingHours.some(wh => wh.isOpen)
      if (!hasOpenDay) {
        setError('Configure pelo menos um dia de funcionamento')
        return false
      }
    }
    if (step === 4) {
      // Validar pelo menos um serviço válido
      const validServices = services.filter(
        s => s.name.trim() && s.price && parseFloat(s.price) > 0 && s.duration && parseInt(s.duration) > 0
      )
      if (validServices.length === 0) {
        setError('Adicione pelo menos um serviço válido')
        return false
      }
    }
    setError(null)
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Filtrar serviços válidos
      const validServices = services
        .filter(s => s.name.trim() && s.price && parseFloat(s.price) > 0 && s.duration && parseInt(s.duration) > 0)
        .map(s => ({
          name: s.name.trim(),
          description: s.description.trim() || null,
          price: parseFloat(s.price),
          duration: parseInt(s.duration),
        }))

      // Filtrar horários abertos
      const validWorkingHours = workingHours
        .filter(wh => wh.isOpen)
        .map(wh => ({
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
          gapMinutes: 0, // Não usar mais gapMinutes, apenas duração do serviço
        }))

      const response = await fetch('/api/barbershops/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          services: validServices,
          workingHours: validWorkingHours,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar barbearia')
        setIsSubmitting(false)
        return
      }

      // Redirecionar para a lista de barbearias
      router.push('/app/barbershop')
      router.refresh()
    } catch (err) {
      setError('Erro ao criar barbearia')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      currentStep >= step
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : 'bg-[var(--card-bg)] border-2 border-[var(--card-border)]'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-xs mt-2 text-center opacity-70">
                    {step === 1 && 'Dados'}
                    {step === 2 && 'Localização'}
                    {step === 3 && 'Horários'}
                    {step === 4 && 'Serviços'}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition ${
                      currentStep > step ? 'bg-[var(--foreground)]' : 'bg-[var(--card-border)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Etapa 1: Dados Básicos */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Dados da Barbearia</h2>
                <p className="text-sm opacity-70">Informe os dados básicos da sua barbearia</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome da Barbearia *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                  placeholder="Ex: Barbearia do João"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                  placeholder="Descreva sua barbearia..."
                />
              </div>

              <div className="border border-[var(--card-border)] rounded-md p-4 bg-[var(--hover-bg)]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptsPublicRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, acceptsPublicRequests: e.target.checked }))}
                    className="w-5 h-5 rounded accent-[var(--primary)] mt-1"
                  />
                  <div>
                    <span className="font-medium block">Aceitar solicitações públicas de barbeiros</span>
                    <span className="text-xs opacity-70 block mt-1">
                      Se marcado, qualquer barbeiro poderá solicitar acesso à sua barbearia através da lista de barbearias públicas. 
                      Se desmarcado, apenas barbeiros com o ID da barbearia poderão solicitar acesso (barbearia privada).
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Endereço *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                  placeholder="Rua, número"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    maxLength={2}
                    className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    placeholder="UF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Localização */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Localização</h2>
                <p className="text-sm opacity-70">Configure a localização da sua barbearia (opcional)</p>
              </div>

              <div className="bg-[var(--hover-bg)] p-4 rounded-md">
                <p className="text-sm mb-4 opacity-70">
                  A localização ajuda os clientes a encontrarem sua barbearia mais facilmente.
                  Você pode usar sua localização atual ou informar manualmente.
                </p>
                <button
                  type="button"
                  onClick={getLocation}
                  className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-80 transition text-sm"
                >
                  Usar Minha Localização
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    placeholder="-27.123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    placeholder="-48.123456"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Horários */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Horários de Funcionamento</h2>
                <p className="text-sm opacity-70 mb-4">
                  Configure os horários de funcionamento da sua barbearia.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Como funciona:</strong> O intervalo entre agendamentos é calculado automaticamente pela <strong>duração de cada serviço</strong>. 
                    Por exemplo, se um serviço dura 30 minutos, o próximo agendamento só poderá começar 30 minutos após o início do anterior.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {workingHours.map((wh, index) => {
                  const day = DAYS.find(d => d.value === wh.dayOfWeek)
                  return (
                    <div
                      key={wh.dayOfWeek}
                      className="border border-[var(--card-border)] rounded-md p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={wh.isOpen}
                            onChange={(e) => handleWorkingHoursChange(index, 'isOpen', e.target.checked)}
                            className="rounded"
                          />
                          <span className="font-medium">{day?.label}</span>
                        </label>
                      </div>

                      {wh.isOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs mb-1">Abertura</label>
                            <input
                              type="time"
                              value={wh.startTime}
                              onChange={(e) => handleWorkingHoursChange(index, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Fechamento</label>
                            <input
                              type="time"
                              value={wh.endTime}
                              onChange={(e) => handleWorkingHoursChange(index, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Etapa 4: Serviços */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Serviços</h2>
                <p className="text-sm opacity-70">Adicione os serviços oferecidos pela sua barbearia</p>
              </div>

              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="border border-[var(--card-border)] rounded-md p-4"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium">Serviço {index + 1}</h3>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nome do Serviço *
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                          placeholder="Ex: Corte Masculino"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={service.description}
                          onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                          placeholder="Descreva o serviço..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Preço (R$) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={service.price}
                            onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Duração (min) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={service.duration}
                            onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                            placeholder="30"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addService}
                className="w-full py-2 border-2 border-dashed border-[var(--card-border)] rounded-md hover:bg-[var(--hover-bg)] transition text-sm"
              >
                + Adicionar Serviço
              </button>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[var(--card-border)]">
            {currentStep === 1 ? (
              <BackButton href="/app/barbershop" />
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 border border-[var(--card-border)] rounded-md hover:bg-[var(--hover-bg)] transition"
              >
                Voltar
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-80 transition"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-80 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Criando...' : 'Criar Barbearia'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

