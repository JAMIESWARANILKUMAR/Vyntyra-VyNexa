import * as React from 'react'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Link } from '@react-email/components'
import type { TemplateEntry } from './registry'

const LOGO_URL = 'https://careers.vyntyraconsultancyservices.in/icon-512.png'
const INK = '#111827'
const MUTED = '#4B5563'
const LINE = '#E5E7EB'
const CANVAS = '#F9FAFB'
const BRAND = '#0f172a'

interface Props {
  fullName?: string
  email?: string
  roleApplied?: string
  domain?: string
  subDomain?: string
  applicationId?: string
  hasResume?: boolean
}

const ApplicantConfirm = ({ fullName = 'there', email = '', roleApplied = 'the role', domain = '', subDomain = '', applicationId = '', hasResume = false }: Props) => (
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

        {/* Reference Details */}
        <Section style={{ padding: '16px 40px' }}>
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 6, padding: '16px', background: CANVAS }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ paddingBottom: '8px' }}>
                    <Text style={{ margin: 0, fontSize: 11, color: MUTED, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Application ID
                    </Text>
                    <Text style={{ margin: '2px 0 0', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 14, color: INK, fontWeight: 600 }}>
                      {applicationId.slice(0, 8).toUpperCase()}
                    </Text>
                  </td>
                </tr>
                {domain ? (
                  <tr>
                    <td style={{ paddingTop: '8px', borderTop: `1px solid ${LINE}` }}>
                      <Text style={{ margin: 0, fontSize: 11, color: MUTED, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Domain Track
                      </Text>
                      <Text style={{ margin: '2px 0 0', fontSize: 14, color: INK, fontWeight: 600 }}>
                        {domain}
                      </Text>
                    </td>
                  </tr>
                ) : null}
                {subDomain ? (
                  <tr>
                    <td style={{ paddingTop: '8px', borderTop: `1px solid ${LINE}` }}>
                      <Text style={{ margin: 0, fontSize: 11, color: MUTED, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Sub-Domain Specialization
                      </Text>
                      <Text style={{ margin: '2px 0 0', fontSize: 14, color: INK, fontWeight: 600 }}>
                        {subDomain}
                      </Text>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
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
            Sincerely,
          </Text>
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <Img src="https://plain-apac-prod-public.komododecks.com/202608/11/olXE11N8ipqBTR8DBSXt/image.png" alt="Jami Eswar Anil Kumar Signature" width="140" style={{ display: 'block', height: 'auto', maxHeight: '48px', objectFit: 'contain' }} />
          </div>
          <Text style={{ margin: '4px 0 0', color: INK, fontSize: 15, fontWeight: 700 }}>
            Jami Eswar Anil Kumar<br />
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Founder &amp; Managing Director</span>
          </Text>
        </Section>

        {/* Footer */}
        <Section style={{ background: CANVAS, borderTop: `1px solid ${LINE}`, padding: '32px 40px', color: MUTED, fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ marginBottom: 16 }}>
            <strong>Questions?</strong> Contact our Talent Acquisition team at <Link href="mailto:hr@vyntyraconsultancyservices.in" style={{ color: BRAND, fontWeight: 600, textDecoration: 'underline' }}>hr@vyntyraconsultancyservices.in</Link>.
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <table role="presentation" align="center" border={0} cellSpacing={0} cellPadding={0} style={{ margin: '0 auto', display: 'inline-block' }}>
              <tr>
                <td style={{ padding: '0 6px' }} align="center">
                  <Link href="https://facebook.com/vyntyraindia" target="_blank" style={{ textDecoration: 'none' }}>
                    <Img src="https://careers.vyntyraconsultancyservices.in/social/facebook.png" alt="Facebook" width={32} height={32} style={{ display: 'block', border: 0 }} />
                  </Link>
                </td>
                <td style={{ padding: '0 6px' }} align="center">
                  <Link href="https://x.com/vyntyraindia" target="_blank" style={{ textDecoration: 'none' }}>
                    <Img src="https://careers.vyntyraconsultancyservices.in/social/x.png" alt="X" width={32} height={32} style={{ display: 'block', border: 0 }} />
                  </Link>
                </td>
                <td style={{ padding: '0 6px' }} align="center">
                  <Link href="https://www.linkedin.com/company/vyntyra-consultancy-services" target="_blank" style={{ textDecoration: 'none' }}>
                    <Img src="https://careers.vyntyraconsultancyservices.in/social/linkedin.png" alt="LinkedIn" width={32} height={32} style={{ display: 'block', border: 0 }} />
                  </Link>
                </td>
                <td style={{ padding: '0 6px' }} align="center">
                  <Link href="https://www.instagram.com/vyntyraindia" target="_blank" style={{ textDecoration: 'none' }}>
                    <Img src="https://careers.vyntyraconsultancyservices.in/social/instagram.png" alt="Instagram" width={32} height={32} style={{ display: 'block', border: 0 }} />
                  </Link>
                </td>
                <td style={{ padding: '0 6px' }} align="center">
                  <Link href="https://youtube.com/@vyntyra" target="_blank" style={{ textDecoration: 'none' }}>
                    <Img src="https://careers.vyntyraconsultancyservices.in/social/youtube.png" alt="YouTube" width={32} height={32} style={{ display: 'block', border: 0 }} />
                  </Link>
                </td>
              </tr>
            </table>
          </div>

          <Hr style={{ borderColor: LINE, margin: '16px 0' }} />

          <div style={{ marginBottom: 12 }}>
            This email was sent to you by Vyntyra Consultancy Services in relation to your application for Project VyNexa.
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Vyntyra Consultancy Services</strong><br/>
            Visakhapatnam, AP, India<br/>
            ISO-aligned &middot; NASSCOM Verified &middot; MSME Registered
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Link href="https://careers.vyntyraconsultancyservices.in/privacy" style={{ color: MUTED, textDecoration: 'underline', marginRight: '12px' }}>Privacy Policy</Link>
            <span style={{ color: LINE }}>|</span>
            <Link href="https://careers.vyntyraconsultancyservices.in/terms" style={{ color: MUTED, textDecoration: 'underline', marginLeft: '12px' }}>Applicant Terms</Link>
          </div>

          <div style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', marginTop: 16 }}>
            Disclaimer: This electronic mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential or privileged information. Any unauthorized review, use, disclosure, or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply email and destroy all copies of the original message.
          </div>
          
          <div style={{ marginTop: 12 }}>&copy; {new Date().getFullYear()} Vyntyra Consultancy Services. All rights reserved.</div>
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
