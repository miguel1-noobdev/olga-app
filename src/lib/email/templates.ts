export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function buildVerificationMessage(input: { to: string; tokenUrl: string }): EmailMessage {
  const subject = 'Confirmá tu email: verificación de Botánica Esencial';
  const text = `Confirmá tu email siguiendo este enlace: ${input.tokenUrl}`;
  return {
    to: input.to,
    subject,
    text,
    html: `<p>Confirmá tu email para activar tu cuenta.</p><p><a href="${input.tokenUrl}">Verificar email</a></p>`,
  };
}

export function buildRecoveryMessage(input: { to: string; tokenUrl: string }): EmailMessage {
  const subject = 'Restablecé tu contraseña: Botánica Esencial';
  const text = `Restablecé tu contraseña siguiendo este enlace: ${input.tokenUrl}`;
  return {
    to: input.to,
    subject,
    text,
    html: `<p>Podés restablecer tu contraseña desde este enlace.</p><p><a href="${input.tokenUrl}">Restablecer contraseña</a></p>`,
  };
}
