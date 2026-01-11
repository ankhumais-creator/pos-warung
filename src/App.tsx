import { useEffect, useState } from 'react'
import { db, getCurrentShift, type ShiftLog } from './lib/db'
import { seedDatabase } from './lib/seed'
import { useSyncWorker } from './lib/syncWorker'
import Cashier from './pages/Cashier'
import OpenShiftModal from './components/OpenShiftModal'

function App() {
  const [isReady, setIsReady] = useState(false)
  const [currentShift, setCurrentShift] = useState<ShiftLog | null>(null)

  // Start background sync worker
  useSyncWorker()

  useEffect(() => {
    initApp()
  }, [])

  async function initApp() {
    // Check if database needs seeding
    const productCount = await db.products.count()

    if (productCount === 0) {
      await seedDatabase()
    }

    // Check for open shift
    const shift = await getCurrentShift()
    setCurrentShift(shift)

    setIsReady(true)
  }

  const handleShiftOpened = async () => {
    const shift = await getCurrentShift()
    setCurrentShift(shift)
  }

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-base-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-900 font-semibold">Loading POS System...</p>
        </div>
      </div>
    )
  }

  // If no open shift, show modal
  if (!currentShift) {
    return <OpenShiftModal onShiftOpened={handleShiftOpened} />
  }

  return <Cashier />
}

export default App
