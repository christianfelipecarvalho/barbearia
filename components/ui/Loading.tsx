'use client'

import { useTheme } from '@/lib/contexts/theme.context'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  text?: string
}

export function Loading({ size = 'md', fullScreen = false, text }: LoadingProps) {
  const { theme } = useTheme()
  
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-[var(--foreground)] border-t-transparent`} />
      {text && (
        <p className="text-sm text-[var(--foreground)] opacity-70 animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Loading para transições de página
export function PageTransition() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--foreground)]/20 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-t-[var(--foreground)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-sm text-[var(--foreground)] opacity-70">Carregando...</p>
      </div>
    </div>
  )
}

