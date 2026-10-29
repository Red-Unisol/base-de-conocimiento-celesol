/** Dominios propios: el admin da de alta estas cuentas directamente (sin correo). */
export const INSTITUTIONAL_DOMAINS = ["redunisol.com.ar"];

export function isInstitutionalEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return INSTITUTIONAL_DOMAINS.includes(domain);
}
