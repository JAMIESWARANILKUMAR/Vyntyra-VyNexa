// Server-only helper for application notification emails.
import { sendTemplateEmail } from './email-templates/send-email'

interface AppNotifyPayload {
  fullName: string
  email: string
  phone: string
  roleApplied: string
  domain?: string
  subDomain?: string
  applicationId: string
  hasResume?: boolean
}

export async function notifyAdminOfApplication(p: AppNotifyPayload) {
  const templateData = {
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    roleApplied: p.roleApplied,
    domain: p.domain || '',
    subDomain: p.subDomain || '',
    applicationId: p.applicationId,
    hasResume: !!p.hasResume,
  }

  await Promise.allSettled([
    sendTemplateEmail('application-admin', 'hr@vyntyraconsultancyservices.in', {
      templateData,
    }),
    sendTemplateEmail('application-applicant', p.email, {
      templateData,
    }),
  ])
}
