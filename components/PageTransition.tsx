'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PageTransition } from './ui/Loading'

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <>
      {isTransitioning && <PageTransition />}
      <div className={isTransitioning ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {displayChildren}
      </div>
    </>
  )
}

