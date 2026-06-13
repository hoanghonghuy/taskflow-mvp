import Spinner from '@/components/ui/spinner'

export default function AppLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner className="h-10 w-10" />
    </div>
  )
}
