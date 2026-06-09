export const USER_ROLES = ['USER', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isAdminRole(role: string | undefined | null): boolean {
  return role === 'ADMIN'
}
