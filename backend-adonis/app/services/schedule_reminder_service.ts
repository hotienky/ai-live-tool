/**
 * Schedule Reminder Service — Check upcoming livestream schedules and notify users
 * Runs on an interval (every 60s), emits socket notifications 5 min before scheduled time
 */

import type { Server as SocketIOServer } from 'socket.io'
import ScheduledLivestream from '#models/scheduled_livestream'
import Shop from '#models/shop'

let reminderInterval: ReturnType<typeof setInterval> | null = null
const notifiedIds = new Set<number>()

export function startScheduleReminder(io: SocketIOServer) {
  if (reminderInterval) clearInterval(reminderInterval)

  reminderInterval = setInterval(async () => {
    try {
      const now = new Date()
      const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000)

      // Find schedules within the next 5 minutes that haven't been notified
      const upcoming = await ScheduledLivestream.query()
        .where('status', 'scheduled')
        .where('scheduled_at', '>=', now.toISOString())
        .where('scheduled_at', '<=', fiveMinLater.toISOString())

      for (const schedule of upcoming) {
        if (notifiedIds.has(schedule.id)) continue
        notifiedIds.add(schedule.id)

        const shop = await Shop.find(schedule.shopId)
        if (!shop) continue

        // Socket notification to shop room
        io.to(`shop_${schedule.shopId}`).emit('schedule_reminder', {
          scheduleId: schedule.id,
          title: schedule.title,
          scheduledAt: schedule.scheduledAt,
          shopName: shop.shopName,
        })

        console.log(`⏰ Schedule reminder: "${schedule.title}" in 5 min`)
      }

      // Clean up old notified IDs (prevent memory leak)
      if (notifiedIds.size > 1000) notifiedIds.clear()
    } catch (err: any) {
      // Silent — reminder is best-effort
      if (!err.message?.includes('no such table')) {
        console.error('⏰ Schedule reminder error:', err.message)
      }
    }
  }, 60_000) // Check every 60 seconds

  console.log('⏰ Schedule reminder service started (60s interval)')
}

export function stopScheduleReminder() {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
    console.log('⏰ Schedule reminder service stopped')
  }
}
