import { redirect } from 'next/navigation'

// Landing page giữ tại @/components/landing/LandingPage — bật lại khi cần:
// import LandingPage from '@/components/landing/LandingPage'
// export default function RootPage() { return <LandingPage /> }

export default function RootPage() {
  redirect('/login')
}
