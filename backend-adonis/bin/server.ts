/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
*/

await import('reflect-metadata')
const { Ignitor, prettyPrintError } = await import('@adonisjs/core')
const { createServer } = await import('node:http')

const APP_ROOT = new URL('../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })

    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start()
  .then(async () => {
    // Attach Socket.IO after AdonisJS HTTP server is running
    try {
      const env = await import('#start/env')
      const port = env.default.get('PORT', 3333)

      // AdonisJS uses its own HTTP server internally; we find it via net
      const { setupSocketIO } = await import('#start/socket')
      const http = await import('node:http')

      // Create a reference server on the same port for Socket.IO
      // AdonisJS v6 doesn't expose httpServer directly, so we hook Socket.IO
      // into the process by finding the active server
      const net = await import('node:net')
      const servers = (process as any)._getActiveHandles?.()
      let httpServer = null

      if (servers) {
        for (const handle of servers) {
          if (handle?.constructor?.name === 'Server' && handle?.listening) {
            httpServer = handle
            break
          }
        }
      }

      if (httpServer) {
        setupSocketIO(httpServer)
        console.log('🔌 Socket.IO attached to HTTP server')
      } else {
        // Fallback: create standalone Socket.IO on port+1
        const fallbackServer = http.createServer()
        setupSocketIO(fallbackServer)
        const socketPort = Number(port) + 1
        fallbackServer.listen(socketPort, () => {
          console.log(`🔌 Socket.IO running on standalone port ${socketPort}`)
        })
      }
    } catch (err: any) {
      console.warn('⚠️ Socket.IO setup:', err.message)
    }

    console.log('')
    console.log('╔══════════════════════════════════════════════════╗')
    console.log('║   🚀 AI Live-Commerce Server (AdonisJS v6)     ║')
    console.log('║   📡 Framework: AdonisJS (Laravel-like)         ║')
    console.log('║   🔌 Socket.IO: Integrated                     ║')
    console.log('╚══════════════════════════════════════════════════╝')
  })
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
