import * as React from 'react'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Link } from '@react-email/components'
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
  phone?: string
  roleApplied?: string
  applicationId?: string
  hasResume?: boolean
}

const AdminNotify = ({ fullName = 'Candidate', email = 'candidate@example.com', phone = '1234567890', roleApplied = 'Role', applicationId = '', hasResume = true }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New Application: {fullName} for {roleApplied}</Preview>
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
                  <div style={{ color: INK, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Vyntyra HR Alerts</div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Content */}
        <Section style={{ padding: '40px 40px 16px', color: INK, lineHeight: 1.6, fontSize: 15 }}>
          <Heading style={{ color: INK, fontSize: 24, margin: '0 0 16px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            New Application Received
          </Heading>
          <Text style={{ margin: '0 0 24px' }}>
            A new application has been submitted for the <strong>{roleApplied}</strong> position.
          </Text>

          {/* Details Table */}
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, padding: '16px', background: CANVAS, marginBottom: '24px' }}>
            <table style={{ width: '100%', fontSize: 14 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: MUTED, width: '120px' }}><strong>Name:</strong></td>
                  <td style={{ padding: '4px 0', color: INK }}>{fullName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: MUTED }}><strong>Role:</strong></td>
                  <td style={{ padding: '4px 0', color: INK }}>{roleApplied}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: MUTED }}><strong>Email:</strong></td>
                  <td style={{ padding: '4px 0', color: INK }}><Link href={`mailto:${email}`} style={{ color: BRAND }}>{email}</Link></td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: MUTED }}><strong>Phone:</strong></td>
                  <td style={{ padding: '4px 0', color: INK }}>{phone}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: MUTED }}><strong>Resume:</strong></td>
                  <td style={{ padding: '4px 0', color: INK }}>{hasResume ? 'Attached' : 'Not provided'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: MUTED }}><strong>ID:</strong></td>
                  <td style={{ padding: '4px 0', color: INK }}>{applicationId}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Link href={`https://careers.vyntyraconsultancyservices.in/admin`} style={{ display: 'inline-block', backgroundColor: BRAND, color: '#ffffff', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Review Application
          </Link>
        </Section>

        {/* Footer */}
        <Section style={{ background: CANVAS, borderTop: `1px solid ${LINE}`, padding: '24px 40px', color: MUTED, fontSize: 12, lineHeight: 1.5 }}>
          <div>This is an automated notification from the Vyntyra Careers Portal.</div>
          <div>&copy; {new Date().getFullYear()} Vyntyra Consultancy Services.</div>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminNotify,
  subject: 'New Application: {fullName} - {roleApplied}',
  displayName: 'Admin: New Application Alert',
  previewData: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+91 9876543210',
    roleApplied: 'Product Designer',
    applicationId: '12345678-1234-1234-1234-123456789012',
    hasResume: true,
  },
} satisfies TemplateEntry
