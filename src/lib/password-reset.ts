export function normalizeResetEmail(raw: string): string {
  const email = (raw ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo inválido");
  return email;
}

export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(password: string): string {
  if (!password || password.length < MIN_PASSWORD_LENGTH)
    throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  return password;
}

/** Only one pending request per email: returns true if a new one should be created. */
export function shouldCreateRequest(pendingEmails: string[], email: string): boolean {
  return !pendingEmails.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}
