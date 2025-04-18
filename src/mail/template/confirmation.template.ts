export const confirmationMail = (
  { email, firstName }: any,
  confirmationLink,
) => ({
  to: email,
  from: process.env.EMAIL_FROM,
  subject: 'Подтверждение аккаунта',
  html: `
            <table border="0" cellpadding="0" cellspacing="0" style="margin:0; padding:0; background: white;">
              <tr style="display: flex; flex-direction: column; gap: 10px;">
                <td style="width: 100%; background: #f43f5e; display: flex; justify-content: center; align-items: center; color: #ffffff; font-size: xx-large; font-weight: bold;" height="100">
                  <span>AdminPRO</span>
                </td>
                <td>Здравствуйте ${firstName ? firstName : email}!</td>
                <td>Пожалуйста перейдите по этой ссылке <a href="${confirmationLink}"></a> для подтверждения вашего аккаунта.</td>
              </tr>
            </table>
        `,
});
