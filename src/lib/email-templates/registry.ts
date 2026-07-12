import type { ComponentType } from 'react'
import { template as applicationAdmin } from './application-admin'
import { template as applicationApplicant } from './application-applicant'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'application-admin': applicationAdmin,
  'application-applicant': applicationApplicant,
}
