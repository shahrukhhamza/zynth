/**
 * Owner accounts. ADMIN_EMAILS (comma separated) lists the emails that always get the admin role.
 * The role is applied at startup and whenever the owner proves the address by signing in (password,
 * Google, or the emailed sign-up code). It is never granted from an unverified sign-up, so nobody can
 * claim an admin address by registering it first.
 */
export function adminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  return adminEmails().includes(String(email || '').trim().toLowerCase());
}
