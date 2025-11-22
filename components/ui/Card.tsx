import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const baseStyles = 'bg-white rounded-lg shadow-md p-6 transition'
  const interactiveStyles = onClick
    ? 'cursor-pointer hover:shadow-lg border-2 border-transparent hover:border-blue-500'
    : ''

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

