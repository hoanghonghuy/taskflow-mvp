'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RegisterView from '@/taskflow/components/auth/RegisterView'
import { useUser } from '@/components/providers/user-provider'

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated } = useUser()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <RegisterView onSwitchToLogin={() => router.push('/login')} />
  )
}
