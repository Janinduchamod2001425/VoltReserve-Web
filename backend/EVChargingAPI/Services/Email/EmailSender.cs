/*
 * File: EmailSender.cs
 * Description: SMTP email sender using MailKit, supports optional PNG attachment (QR).
 * Author: <Kavinda S.G.D
 * Last Modified: 2025-10-10
 * Notes: Reads options via IOptions<SmtpOptions>.
 */




using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Utils;
using Microsoft.Extensions.Options;

namespace EVChargingAPI.Services.Email
{
    public interface IEmailSender
    {
        /// <summary>Sends an email with optional PNG attachment.</summary>
        Task SendAsync(string toEmail, string subject, string html, byte[]? pngAttachment = null, string? pngName = null, CancellationToken ct = default);
    }

    public class EmailSender : IEmailSender
    {
        private readonly SmtpOptions _opt;

        public EmailSender(IOptions<SmtpOptions> opt)
        {
            // Step 1: Capture SMTP options from DI
            _opt = opt.Value;
        }

        public async Task SendAsync(string toEmail, string subject, string html, byte[]? pngAttachment = null, string? pngName = null, CancellationToken ct = default)
        {
            // Step 1: Build message body & optional attachment
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_opt.FromName, _opt.FromEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = html };

            if (pngAttachment != null && pngAttachment.Length > 0)
            {
                var att = builder.Attachments.Add(pngName ?? "booking-qr.png", pngAttachment, new ContentType("image", "png"));
                att.ContentId = MimeUtils.GenerateMessageId();
            }

            message.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_opt.Host, _opt.Port, SecureSocketOptions.StartTlsWhenAvailable, ct);
            if (!string.IsNullOrWhiteSpace(_opt.User))
                await smtp.AuthenticateAsync(_opt.User, _opt.Pass, ct);

            await smtp.SendAsync(message, ct);
            await smtp.DisconnectAsync(true, ct);
        }
    }
}
