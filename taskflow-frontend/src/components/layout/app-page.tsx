'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AppPageProps {
  children: React.ReactNode
  className?: string
}

export const AppPage: React.FC<AppPageProps> = ({ children, className }) => {
  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>
      {children}
    </div>
  )
}

interface AppPageContainerProps {
  children: React.ReactNode
  className?: string
}

export const AppPageContainer: React.FC<AppPageContainerProps> = ({ children, className }) => {
  return (
    <div className={cn('w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

interface AppPageMainProps {
  children: React.ReactNode
  className?: string
}

export const AppPageMain: React.FC<AppPageMainProps> = ({ children, className }) => {
  return (
    <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
      <AppPageContainer className={className}>{children}</AppPageContainer>
    </main>
  )
}
