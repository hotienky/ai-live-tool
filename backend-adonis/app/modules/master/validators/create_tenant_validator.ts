/**
 * Validator: Validate CreateTenant request.
 * Single Responsibility: Input validation only.
 */
export default class CreateTenantValidator {
  static validate(data: Record<string, any>) {
    const errors: string[] = []

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('name is required (min 2 chars)')
    }

    if (!data.slug || typeof data.slug !== 'string') {
      errors.push('slug is required')
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(data.slug) || data.slug.length < 3) {
      errors.push('slug must be 3+ lowercase alphanumeric chars with optional hyphens')
    }

    if (!data.ownerEmail || typeof data.ownerEmail !== 'string') {
      errors.push('ownerEmail is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ownerEmail)) {
      errors.push('ownerEmail must be a valid email')
    }

    const validPlans = ['free', 'pro', 'enterprise']
    if (data.plan && !validPlans.includes(data.plan)) {
      errors.push(`plan must be one of: ${validPlans.join(', ')}`)
    }

    return { isValid: errors.length === 0, errors }
  }
}
