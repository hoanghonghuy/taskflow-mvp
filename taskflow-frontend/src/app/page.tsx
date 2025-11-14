'use client'

import { useRouter } from 'next/navigation'
import LandingPageView from '@/taskflow/components/landing/LandingPage'

export default function LandingPage() {
  const router = useRouter()

  return (
    <LandingPageView onLaunch={() => router.push('/login')} />
  )
}
