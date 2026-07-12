// Server-only helper for application notification emails.
import { sendTemplateEmail } from './email-templates/send-email'

interface AppNotifyPayload {
  fullName: string
  email: string
  phone: string
  roleApplied: string
  applicationId: string
  hasResume?: boolean
}

export async function notifyAdminOfApplication(p: AppNotifyPayload) {
  const templateData = {
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    roleApplied: p.roleApplied,
    applicationId: p.applicationId,
    hasResume: !!p.hasResume,
  }

  await Promise.allSettled([
    sendTemplateEmail('application-admin', 'hr@vyntyraconsultancyservices.in', {
      templateData,
      idempotencyKey: `application-admin-${p.applicationId}`,
    }),
    sendTemplateEmail('application-applicant', p.email, {
      templateData,
      idempotencyKey: `application-applicant-${p.applicationId}`,
    }),
  ])
}
