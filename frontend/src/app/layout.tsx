import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import { Toaster } from '@/components/ui/sonner'
import { LOCALE_COOKIE, parseLocale } from '@/lib/i18n/locale-cookie'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TaskFlow - Your Productivity Companion',
  description: 'Organize your tasks, build habits, and boost productivity',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialLocale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value)

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers initialLocale={initialLocale}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
