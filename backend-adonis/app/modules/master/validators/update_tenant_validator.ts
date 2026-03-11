/**
 * Validator: Validate UpdateTenant request.
 */
export default class UpdateTenantValidator {
  static validate(data: Record<string, any>) {
    const errors: string[] = []

    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
      errors.push('name must be at least 2 chars')
    }

    const validStatuses = ['active', 'suspended', 'trial']
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`)
    }

    const validPlans = ['free', 'pro', 'enterprise']
    if (data.plan && !validPlans.includes(data.plan)) {
      errors.push(`plan must be one of: ${validPlans.join(', ')}`)
    }

    return { isValid: errors.length === 0, errors }
  }
}
