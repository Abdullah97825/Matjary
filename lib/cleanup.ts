let isCleanupScheduled = false

// This function is no longer used in the app (replaced by cron job)
// Code is kept for reference
export function scheduleCleanup() {
  if (isCleanupScheduled) return

  // Run every hour (3600000ms)
  setInterval(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/admin/products/upload/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`Cleanup failed with status: ${res.status}`)
      }

      const data = await res.json()
      console.log('[AUTO_CLEANUP] Result:', data)
    } catch (error) {
      console.error('[AUTO_CLEANUP] Error:', error)
    }
  }, 3600000) // 1 hour

  isCleanupScheduled = true
} 