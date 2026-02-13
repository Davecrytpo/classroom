import { extractNameAndEmail, withEmailTemplate } from '$src/utils/mail';
import { nodemailerTransporter, sendgridApiKey, zohoClient } from '$src/utils/email';

import { Hono } from 'hono';
import type { TSendEmailValidation } from '$src/types/mail';
import type { Transporter } from 'nodemailer';
import axios from 'axios';
import { env } from '$src/config/env';

export const mailRouter = new Hono();

interface EmailResponse {
  success: boolean;
  error?: string;
  details?: unknown;
}

let transporter: Transporter | null;

nodemailerTransporter().then((t: Transporter | null) => {
  transporter = t;
});

export async function sendWithSendGrid(
  emailData: TSendEmailValidation[0]
): Promise<EmailResponse> {
  const { from, to, subject, content, replyTo } = emailData;

  if (!sendgridApiKey) {
    return {
      success: false,
      error: 'SendGrid API key not configured'
    };
  }

  try {
    const fromData = extractNameAndEmail(from || env.SMTP_SENDER || '');
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject
          }
        ],
        from: {
          email: fromData?.email || env.SMTP_SENDER,
          name: fromData?.name
        },
        content: [
          {
            type: 'text/html',
            value: withEmailTemplate(content)
          }
        ],
        reply_to: replyTo ? { email: replyTo } : undefined
      },
      {
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      details: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: axios.isAxiosError(error) ? error.response?.data : (error as Error).message,
      details: error
    };
  }
}

export async function sendWithNodemailer(
  emailData: TSendEmailValidation[0]
): Promise<EmailResponse> {
  const { from, to, subject, content, replyTo } = emailData;

  if (!transporter) {
    return {
      success: false,
      error: 'Email transporter not initialized'
    };
  }

  try {
    const result = await transporter.sendMail({
      from: from || env.SMTP_SENDER,
      to,
      subject,
      replyTo,
      html: withEmailTemplate(content)
    });

    return {
      success: true,
      details: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    };
  }
}

export async function sendWithZoho(emailData: TSendEmailValidation[0]): Promise<EmailResponse> {
  const { from, to, subject, content } = emailData;

  const fromData = extractNameAndEmail(from || '');

  if (!fromData) {
    return {
      success: false,
      error: 'Invalid from data'
    };
  }

  try {
    const result = await zohoClient.sendMail({
      from: {
        address: fromData.email,
        name: fromData.name
      },
      to: [
        {
          email_address: {
            address: to
          }
        }
      ],
      subject,
      htmlbody: content
    });

    return {
      success: true,
      details: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    };
  }
}
