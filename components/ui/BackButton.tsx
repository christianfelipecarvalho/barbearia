'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BackButtonProps {
  href?: string
  className?: string
  label?: string
}

export function BackButton({ href, className = '', label }: BackButtonProps) {
  const router = useRouter()

  const buttonContent = (
    <button
      className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--hover-bg)] transition-colors text-[var(--foreground)] ${className}`}
      onClick={!href ? () => router.back() : undefined}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label && <span>{label}</span>}
    </button>
  )

  if (href) {
    return <Link href={href}>{buttonContent}</Link>
  }

  return buttonContent
}

