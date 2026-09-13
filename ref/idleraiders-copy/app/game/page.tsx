'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageLoader } from '@/components/ui/PageLoader'

export default function GamePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the world page as the default game view
    router.replace('/game/world')
  }, [router])

  return <PageLoader page="world" message="Entering world..." />
}
