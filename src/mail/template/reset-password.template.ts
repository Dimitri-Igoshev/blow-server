export const resetPasswordMail = (
  { email, firstName, lang = 'en' }: any,
  recoveryLink: string,
) => {
  switch (lang) {
    case 'ru':
      return {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Восстановление пароля',
        html: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #edf2f7; border-radius: 20px; padding: 24px;">
          <tr>
              <td style="padding: 24px; background-color: #2d3748; color: #fff; border-radius: 16px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                          <td style="padding-right: 12px;">
                              <img src="https://api.igoshev.de/icons/logo.svg" width="24" height="24" alt="Logo">
                          </td>
                          <td style="font-size: 24px; font-weight: bold; font-family: Montserrat, sans-serif; color: #fff;">IgoshevPRO</td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td style="padding: 24px 0 0;">
                  <p style="margin-bottom: 24px;">Здравствуйте ${
                    firstName ? firstName : email
                  }</p>
                  <p>Мы получили запрос на восстановление пароля для вашей учетной записи. Чтобы сбросить пароль, перейдите по следующей ссылке:</p>
                  <p style="margin-bottom: 24px;"><a href="${recoveryLink}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Сбросить пароль</a></p>
                  <p>Если вы не отправляли запрос на восстановление пароля, проигнорируйте это сообщение, ваш пароль останется без изменений.</p>
                  <p style="margin-top: 24px;">С уважением,<br/>Команда IgoshevPRO</p>
              </td>
          </tr>
      </table>
                  
              `,
      };
    case 'de':
      return {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Passwort wiederherstellen',
        html: `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #edf2f7; border-radius: 20px; padding: 24px;">
            <tr>
                <td style="padding: 24px; background-color: #2d3748; color: #fff; border-radius: 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                            <td style="padding-right: 12px;">
                                <img src="https://api.igoshev.de/icons/logo.svg" width="24" height="24" alt="Logo">
                            </td>
                            <td style="font-size: 24px; font-weight: bold; font-family: Montserrat, sans-serif; color: #fff;">IgoshevPRO</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding: 24px 0 0;">
                <p style="margin-bottom: 24px;">Hallo ${
                  firstName ? firstName : email
                }</p>
                <p>Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts für Ihr Konto erhalten. Um Ihr Passwort zurückzusetzen, klicken Sie bitte auf den folgenden Link:</p>
                <p style="margin-bottom: 24px;"><a href="${recoveryLink}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Passwort zurücksetzen</a></p>
                <p>Wenn Sie kein Passwort zurücksetzen angefordert haben, ignorieren Sie bitte diese Nachricht, Ihr Passwort bleibt unverändert.</p>
                <p style="margin-top: 24px;">Mit freundlichen Grüßen,<br/>Das IgoshevPRO Team</p>
                </td>
            </tr>
        </table>
                    
                `,
      };
    default:
      return {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Password Recovery',
        html: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #edf2f7; border-radius: 20px; padding: 24px;">
          <tr>
              <td style="padding: 24px; background-color: #2d3748; color: #fff; border-radius: 16px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                          <td style="padding-right: 12px;">
                              <img src="https://api.igoshev.de/icons/logo.svg" width="24" height="24" alt="Logo">
                          </td>
                          <td style="font-size: 24px; font-weight: bold; font-family: Montserrat, sans-serif; color: #fff;">IgoshevPRO</td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td style="padding: 24px 0 0;">
              <p style="margin-bottom: 24px;">Hello ${
                firstName ? firstName : email
              }</p>
              <p>We have received a request to reset the password for your account. To reset your password, please follow the link below:</p>
              <p style="margin-bottom: 24px;"><a href="${recoveryLink}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Reset Password</a></p>
              <p>If you did not request a password reset, please ignore this message, your password will remain unchanged.</p>
              <p style="margin-top: 24px;">Best regards,<br/>IgoshevPRO Team</p>
              </td>
          </tr>
      </table>
                  
              `,
      };
  }
};
