import * as React from 'react'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Link } from '@react-email/components'
import type { TemplateEntry } from './registry'

const LOGO_URL = 'https://careers.vyntyraconsultancyservices.in/favicon.png'
const INK = '#111827'
const MUTED = '#4B5563'
const LINE = '#E5E7EB'
const CANVAS = '#F9FAFB'
const BRAND = '#0f172a'

interface Props {
  fullName?: string
  email?: string
  roleApplied?: string
  applicationId?: string
  hasResume?: boolean
}

const ApplicantConfirm = ({ fullName = 'there', email = '', roleApplied = 'the role', applicationId = '', hasResume = false }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your application to Project VyNexa is confirmed — Vyntyra Consultancy Services</Preview>
    <Body style={{ backgroundColor: CANVAS, fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", margin: 0, padding: '40px 16px' }}>
      <Container style={{ maxWidth: 600, margin: '0 auto', background: '#ffffff', borderRadius: 8, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
        
        {/* Header */}
        <Section style={{ padding: '32px 40px', borderBottom: `1px solid ${LINE}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'middle', width: 40 }}>
                  <Img src={LOGO_URL} alt="Vyntyra" width={32} height={32} style={{ display: 'block' }} />
                </td>
                <td style={{ verticalAlign: 'middle', paddingLeft: 12 }}>
                  <div style={{ color: INK, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Vyntyra Consultancy Services</div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Hero */}
        <Section style={{ padding: '40px 40px 16px' }}>
          <Heading style={{ color: INK, fontSize: 24, margin: '0 0 16px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Application Received
          </Heading>
        </Section>

        {/* Body */}
        <Section style={{ padding: '0 40px', color: INK, lineHeight: 1.6, fontSize: 15 }}>
          <Text style={{ margin: '0 0 16px' }}>Dear {fullName},</Text>
          <Text style={{ margin: '0 0 16px' }}>
            Thank you for applying for the <strong>{roleApplied}</strong> position at Vyntyra Consultancy Services for <strong>Project VyNexa</strong>.
          </Text>
          <Text style={{ margin: '0 0 16px' }}>
            We have successfully received your application{hasResume ? ' and resume' : ''}. Our Talent Acquisition team will review your qualifications against our requirements. 
            If your profile is a strong match for this role, we will contact you {email ? <>at <strong>{email}</strong></> : 'shortly'} with next steps.
          </Text>
        </Section>

        {/* Reference */}
        <Section style={{ padding: '16px 40px' }}>
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, padding: '16px', background: CANVAS }}>
            <Text style={{ margin: 0, fontSize: 12, color: MUTED, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              Application ID
            </Text>
            <Text style={{ margin: '4px 0 0', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 14, color: INK, fontWeight: 600, wordBreak: 'break-all' }}>
              {applicationId}
            </Text>
          </div>
        </Section>

        <Section style={{ padding: '16px 40px 32px' }}>
          <Text style={{ margin: '0 0 16px', color: INK, fontSize: 15, lineHeight: 1.6 }}>
            You can track the status of your application online by visiting the applicant portal.
          </Text>
          <Link href="https://careers.vyntyraconsultancyservices.in/track" style={{ display: 'inline-block', backgroundColor: BRAND, color: '#ffffff', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Track Application
          </Link>
          <Text style={{ margin: '32px 0 0', color: INK, fontSize: 15 }}>
            Sincerely,<br />
            <strong>Vyntyra Talent Acquisition</strong>
          </Text>
        </Section>

        {/* Footer */}
        <Section style={{ background: CANVAS, borderTop: `1px solid ${LINE}`, padding: '24px 40px', color: MUTED, fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ marginBottom: 12 }}>
            This email was sent to you by Vyntyra Consultancy Services in relation to your application for Project VyNexa.
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Vyntyra Consultancy Services</strong><br/>
            Visakhapatnam, AP, India<br/>
            ISO-aligned &middot; NASSCOM Verified &middot; MSME Registered
          </div>
          <div>&copy; {new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ApplicantConfirm,
  subject: 'Application Received: {roleApplied} | Vyntyra',
  displayName: 'Applicant: Confirmation',
  previewData: {
    fullName: 'John Doe',
    email: 'john@example.com',
    roleApplied: 'Software Engineer',
    applicationId: '00000000-0000-0000-0000-000000000000',
    hasResume: true,
  },
} satisfies TemplateEntry
