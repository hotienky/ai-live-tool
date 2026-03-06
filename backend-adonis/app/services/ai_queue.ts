/**
 * AI Queue — Rate limiter + concurrency control cho Gemini API calls
 */
class AIQueue {
  private maxConcurrent: number
  private maxRetries: number
  private retryBaseDelay: number
  private queue: Array<{ task: () => Promise<any>; fallbackValue: any; resolve: (v: any) => void; retries: number }>
  private running: number
  public stats: { processed: number; failed: number; retried: number }

  constructor(options: { maxConcurrent?: number; maxRetries?: number; retryBaseDelay?: number } = {}) {
    this.maxConcurrent = options.maxConcurrent || 10
    this.maxRetries = options.maxRetries || 3
    this.retryBaseDelay = options.retryBaseDelay || 1000
    this.queue = []
    this.running = 0
    this.stats = { processed: 0, failed: 0, retried: 0 }
  }

  enqueue<T>(task: () => Promise<T>, fallbackValue: T): Promise<T> {
    return new Promise((resolve) => {
      this.queue.push({ task, fallbackValue, resolve, retries: 0 })
      this._process()
    })
  }

  private async _process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return

    const item = this.queue.shift()!
    this.running++

    try {
      const result = await item.task()
      this.stats.processed++
      item.resolve(result)
    } catch (err: any) {
      if (item.retries < this.maxRetries) {
        item.retries++
        this.stats.retried++
        const delay = this.retryBaseDelay * Math.pow(2, item.retries - 1)
        setTimeout(() => {
          this.queue.unshift(item)
          this._process()
        }, delay)
      } else {
        this.stats.failed++
        console.error(`❌ AIQueue: Task failed after ${this.maxRetries} retries:`, err.message)
        item.resolve(item.fallbackValue)
      }
    } finally {
      this.running--
      this._process()
    }
  }

  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      running: this.running,
    }
  }
}

export default new AIQueue()
