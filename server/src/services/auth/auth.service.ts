import bcrypt from 'bcryptjs';

const PASSWORD_HASH = process.env.APP_PASSWORD_HASH;

export function verifyPassword(password: string): boolean {
  if (!PASSWORD_HASH) {
    return false;
  }
  return bcrypt.compareSync(password, PASSWORD_HASH);
}

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.APP_PASSWORD_HASH &&
      process.env.SESSION_SECRET
  );
}
