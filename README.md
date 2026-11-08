# Lotto Analysis

## Requirements

- Node.js 22.13 or later in the 22.x line, 24.x, or 26 and later. `.nvmrc` selects Node.js 22; use a version manager that resolves it to 22.13 or later.
- npm 10 or later.

Use a Node version manager to select the version in `.nvmrc`, then install dependencies:

```sh
npm install
```

## Commands

```sh
npm run dev          # Start the local development server
npm run build        # Create a production build
npm run start        # Serve the production build
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
npm test             # Run Vitest when tests are added
npm run test:watch   # Run Vitest in watch mode
npm run format       # Format project files
npm run format:check # Check formatting
```

Copy `.env.example` to `.env.local` and replace the Supabase URL and publishable key with values from the Supabase project. Do not commit real credentials. The public publishable key is safe for browser use; never put the Kakao client secret in this file.

## Kakao login setup

1. Create or select a Supabase project, then set its URL and publishable key in `.env.local`.
2. Create an app in Kakao Developers, enable Kakao Login, and add the Supabase Auth callback shown in the Supabase Kakao provider settings to Kakao's redirect URI list. The callback has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase Dashboard, enable the Kakao provider and enter the Kakao REST API key and client secret. Keep the secret in Supabase Dashboard; it is not needed by this app's browser code.
4. In Supabase Auth URL Configuration, set the local Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback` as a redirect URL.
5. Configure the Kakao `profile_nickname` and `profile_image` consent items required by Supabase's Kakao provider setup. This app does not display or use those profile fields. Email (`account_email`) is optional; leave it disabled for this app and allow users without an email in the Supabase Kakao provider settings.

After configuration, start the app with `npm run dev` and choose **카카오로 로그인**. The login flow uses Supabase Auth's PKCE callback. Kakao/Supabase dashboard settings are required for end-to-end login; without them, the random number preview remains usable.

## Product references

- [Feature specification](./spec.md)
- [Architecture](./architecture.md)
