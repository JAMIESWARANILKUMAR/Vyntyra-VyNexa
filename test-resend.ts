import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'jamianil37@gmail.com',
      subject: 'Test Email from Project VyNexa',
      html: '<strong>This is a test email sent using Resend!</strong>'
    });
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

run();
