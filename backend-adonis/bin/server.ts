/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
*/

await import('reflect-metadata')
const { Ignitor, prettyPrintError } = await import('@adonisjs/core')

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

    // Attach Socket.IO after HTTP server is ready
    app.ready(async () => {
      try {
        const { setupSocketIO } = await import('#start/socket')
        const server = app.container.make('server')
        const httpServer = (server as any).getNodeServer?.() || (server as any).server
        if (httpServer) {
          setupSocketIO(httpServer)
        } else {
          console.warn('⚠️ Could not attach Socket.IO: HTTP server not available')
        }
      } catch (err: any) {
        console.warn('⚠️ Socket.IO setup error:', err.message)
      }
    })

    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start()
  .then(() => {
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
