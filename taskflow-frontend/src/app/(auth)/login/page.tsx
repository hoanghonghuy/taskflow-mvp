'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginView from '@/taskflow/components/auth/LoginView'
import { useUser } from '@/components/providers/user-provider'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useUser()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <LoginView onSwitchToRegister={() => router.push('/register')} />
  )
}
