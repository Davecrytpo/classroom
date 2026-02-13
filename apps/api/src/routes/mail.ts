import { sendWithNodemailer, sendWithSendGrid, sendWithZoho } from '$src/services/mail';

import { Hono } from 'hono';
import { ZSendEmailValidation } from '$src/types/mail';
import { env } from '$src/config/env';
import { zValidator } from '@hono/zod-validator';

export const mailRouter = new Hono().post(
  '/send',
  zValidator('json', ZSendEmailValidation),
  async (c) => {
    const validatedData = c.req.valid('json');

    const results = await Promise.all(
      validatedData.map(async (emailData) => {
        if (emailData.to && /.+@test\..+/.test(emailData.to)) {
          throw new Error('Sending from test.com addresses is not allowed');
        }

        const allowedSender = env.SMTP_SENDER || 'notify@mail.classroomio.com';
        if (
          emailData.from &&
          !emailData.from.includes(allowedSender) &&
          !emailData.from.includes('mail.classroomio.com')
        ) {
          console.warn(`Email from ${emailData.from} does not match allowed sender ${allowedSender}`);
        }

        try {
          let res;
          if (env.SENDGRID_API_KEY) {
            res = await sendWithSendGrid(emailData);
          } else if (env.ZOHO_TOKEN) {
            res = await sendWithZoho(emailData);
          } else {
            res = await sendWithNodemailer(emailData);
          }

          console.log('Email status:', res);
          return res;
        } catch (error) {
          console.error('Error sending email:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            details: error
          };
        }
      })
    );

    const hasErrors = results.some((result) => !result.success);
    if (hasErrors) {
      return c.json(
        {
          success: false,
          error: 'Some emails failed to send',
          details: results
        },
        500
      );
    }

    return c.json({ success: true, details: results });
  }
);
