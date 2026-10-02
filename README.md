npm run dev

## Admin authentication

Set `JWT_SECRET` in `.env` to a random secret with at least 32 characters. Create the first administrator once by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters), then run `node scripts/createAdmin.js`. `ADMIN_NAME` is optional. The setup script creates an ADMIN role if needed and refuses to overwrite an existing profile.

Sign in through `POST /auth/login` with the administrator email and password. The API returns a JWT access token valid for 30 days. Profile and role routes require that token and an active ADMIN role.

Creating a profile through `POST /profile/createuser` requires a password of at least 12 characters (maximum 72 UTF-8 bytes). Profile updates may include a new `password`; omitting it leaves the existing password unchanged. The backend hashes passwords with bcrypt before storing them, and password hashes are excluded from API responses.

## Email verification

Configure `SMTP_HOST`, `SMTP_PORT` (defaults to `587`), `SMTP_SECURE` (`true` for implicit TLS), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `FRONTEND_BASE_URL` in `.env`. SMTP settings are required before creating profiles. Verification links expire after 24 hours; `POST /auth/resend-verification` issues a new link, and `POST /auth/verify-email` consumes the token. Unverified profiles cannot log in or use protected APIs. Changing a profile email requires verifying the new address.

Before enforcing verification on an existing database, run `node scripts/backfillEmailVerification.js` once to mark existing profiles verified. This migration is safe to rerun.
