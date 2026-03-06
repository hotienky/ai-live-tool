/**
 * AI Queue — Rate limiter + concurrency control cho Gemini API calls
 * Tránh bị rate limit khi livestream đông comment
 */

class AIQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 10;
    this.maxRetries = options.maxRetries || 3;
    this.retryBaseDelay = options.retryBaseDelay || 1000; // 1s
    this.queue = [];
    this.running = 0;
    this.stats = { processed: 0, failed: 0, retried: 0 };
  }

  /**
   * Enqueue một task để xử lý
   * @param {Function} task - Async function trả về kết quả
   * @param {string} fallbackValue - Giá trị trả về nếu fail hoàn toàn
   * @returns {Promise<any>}
   */
  enqueue(task, fallbackValue = "[COLD]") {
    return new Promise((resolve) => {
      this.queue.push({ task, fallbackValue, resolve, retries: 0 });
      this._process();
    });
  }

  async _process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;

    const item = this.queue.shift();
    this.running++;

    try {
      const result = await item.task();
      this.stats.processed++;
      item.resolve(result);
    } catch (err) {
      if (item.retries < this.maxRetries) {
        item.retries++;
        this.stats.retried++;
        const delay = this.retryBaseDelay * Math.pow(2, item.retries - 1);
        setTimeout(() => {
          this.queue.unshift(item); // Re-add to front
          this._process();
        }, delay);
      } else {
        this.stats.failed++;
        console.error(`❌ AIQueue: Task failed after ${this.maxRetries} retries:`, err.message);
        item.resolve(item.fallbackValue);
      }
    } finally {
      this.running--;
      // Process next in queue
      this._process();
    }
  }

  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      running: this.running,
    };
  }
}

module.exports = new AIQueue();
