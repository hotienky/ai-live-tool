/**
 * Application configuration
 * Reads from Vite environment variables with sensible defaults
 */
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
