import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { db, getCurrentShift, type ShiftLog } from './lib/db'
import { seedDatabase } from './lib/seed'
import { useSyncWorker } from './lib/syncWorker'

// Pages
import Cashier from './pages/Cashier'
import OpenShiftModal from './components/OpenShiftModal'
import StoreSelect from './components/StoreSelect'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminReports from './pages/admin/AdminReports'
import AdminOutlets from './pages/admin/AdminOutlets'

// Cashier wrapper - handles store selection and shift logic
function CashierApp() {
  const [isReady, setIsReady] = useState(false)
  const [hasStoreId, setHasStoreId] = useState(false)
  const [currentShift, setCurrentShift] = useState<ShiftLog | null>(null)

  // Start background sync worker
  useSyncWorker()

  useEffect(() => {
    initApp()
  }, [])

  async function initApp() {
    // Check if store is selected
    const storeId = localStorage.getItem('pos_store_id')
    setHasStoreId(!!storeId)

    // If no store selected yet, don't proceed with shift check
    if (!storeId) {
      setIsReady(true)
      return
    }

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

  const handleStoreSelected = async (_storeId: string) => {
    setHasStoreId(true)

    // Now check for shift
    const productCount = await db.products.count()
    if (productCount === 0) {
      await seedDatabase()
    }

    const shift = await getCurrentShift()
    setCurrentShift(shift)
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

  // If no store selected, show store selector
  if (!hasStoreId) {
    return <StoreSelect onStoreSelected={handleStoreSelected} />
  }

  // If no open shift, show modal
  if (!currentShift) {
    return <OpenShiftModal onShiftOpened={handleShiftOpened} />
  }

  return <Cashier />
}

// Main App with Router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cashier Routes */}
        <Route path="/" element={<CashierApp />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><AdminReports /></AdminLayout>} />
        <Route path="/admin/outlets" element={<AdminLayout><AdminOutlets /></AdminLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
