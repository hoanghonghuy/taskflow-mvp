'use client'

import React from 'react'
import type { User } from '@/types'

interface AvatarProps {
  user: User | null
  className?: string
}

const getInitials = (name: string): string => {
  const names = name.split(' ')
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function Avatar({ user, className }: AvatarProps) {
  if (!user) {
    return (
      <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-muted-foreground ${className || ''}`}>
        ?
      </div>
    )
  }

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`w-10 h-10 rounded-full object-cover ${className || ''}`}
      />
    )
  }

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold ${className || ''}`}>
      {getInitials(user.name)}
    </div>
  )
}

// Export both default and named for flexibility
export default Avatar
export { Avatar }
