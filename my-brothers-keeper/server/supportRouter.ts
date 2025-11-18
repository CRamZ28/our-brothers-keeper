import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { Resend } from 'resend';
import { TRPCError } from '@trpc/server';

const SUPPORT_EMAIL = 'caleb@txpressurewash.com';
const FROM_EMAIL = 'Our Brother\'s Keeper <notifications@notifications.obkapp.com>';

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Email service is not configured. Please contact support directly.',
    });
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export const supportRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({
      subject: z.string().min(1),
      message: z.string().min(10),
      requestType: z.enum(['url_change', 'bug_report', 'feature_request', 'general']),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      
      const requestTypeLabels = {
        url_change: 'URL Change Request',
        bug_report: 'Bug Report',
        feature_request: 'Feature Request',
        general: 'General Support',
      };

      const emailHtml = `
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6BC4B8 0%, #5A9FD4 50%, #9B7FB8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .info-box { background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0; }
          .label { font-weight: bold; color: #6BC4B8; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Support Request</h1>
          </div>
          <div class="content">
            <div class="info-box">
              <p><span class="label">Request Type:</span> ${requestTypeLabels[input.requestType]}</p>
              <p><span class="label">Subject:</span> ${input.subject}</p>
            </div>
            
            <div class="info-box">
              <p><span class="label">From User:</span></p>
              <p>Name: ${user.name || 'Unknown'}</p>
              <p>Email: ${user.email}</p>
              <p>User ID: ${user.id}</p>
              ${user.householdId ? `<p>Household ID: ${user.householdId}</p>` : ''}
            </div>

            <div class="info-box">
              <p><span class="label">Message:</span></p>
              <p style="white-space: pre-wrap;">${input.message}</p>
            </div>
          </div>
        </div>
      `;

      try {
        const resend = getResendClient();
        await resend.emails.send({
          from: FROM_EMAIL,
          to: SUPPORT_EMAIL,
          replyTo: user.email || undefined,
          subject: `[OBK Support] ${requestTypeLabels[input.requestType]}: ${input.subject}`,
          html: emailHtml,
        });

        return { success: true };
      } catch (error) {
        // Preserve TRPCError for controlled failures (e.g., missing API key)
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Log and wrap unknown errors
        console.error('Failed to send support email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send support request. Please try again later.',
        });
      }
    }),
});
