import * as React from 'react'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import { TEMPLATES } from './registry'

// Server-only: reads RESEND_API_KEY. Never import from client components.

// Configuration baked in at scaffold time
const SITE_NAME = "VyNexa Connect"
// FROM_DOMAIN is the domain shown in the From: header
const FROM_DOMAIN = "vyntyraconsultancyservices.in"

export type SendTemplateEmailResult =
  | { sent: true; id?: string }
  | { sent: false; reason: string }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  replyTo?: string
}

/**
 * Renders a registered template and sends it through Resend.
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(apiKey)

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  try {
    const { data, error } = await resend.emails.send({
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      subject,
      html,
      text,
      replyTo: options.replyTo,
    })

    if (error) {
      throw error
    }

    return { sent: true, id: data?.id }
  } catch (error: any) {
    console.error('Error sending email via Resend:', error)
    return { sent: false, reason: error.message || 'Unknown error' }
  }
}
