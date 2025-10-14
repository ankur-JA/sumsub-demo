# Sumsub KYC Demo

Complete Sumsub KYC verification flow with admin dashboard, user verification, and real-time progress tracking.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add Sumsub credentials to `.env.local`**
   ```env
   SUMSUB_APP_TOKEN=your_app_token_here
   SUMSUB_SECRET_KEY=your_secret_key_here
   SUMSUB_BASE_URL=https://api.sumsub.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run the app**
   ```bash
   npm run dev
   ```

4. **Test the flow**
   - Go to http://localhost:3000
   - Enter email and click "Send Invite"
   - Copy verification link and open it
   - Complete KYC process
   - Watch real-time progress updates

## Features

- ✅ Admin dashboard for sending invites
- ✅ Secure token generation (server-side)
- ✅ Sumsub WebSDK integration
- ✅ Real-time progress tracking
- ✅ Webhook handling for status updates
- ✅ Status mapping (created → approved)

## API Endpoints

- `POST /api/kyc/invite` - Create applicant and send invite
- `POST /api/kyc/token` - Generate access token
- `GET /api/kyc/status/:applicantId` - Get verification status
- `POST /api/sumsub/webhook` - Handle Sumsub webhooks

## Status Flow

```
created (5%) → started (15%) → pending (85%) → completed (100%)
                                                      ↓
                                               green ✅ / red ❌ / onHold ⚠️
```

## Production Setup

- Replace in-memory database with PostgreSQL/MongoDB
- Add email service for sending verification links
- Configure Sumsub webhooks with production URL
- Add authentication and rate limiting

## Get Sumsub Credentials

1. Sign up at https://sumsub.com
2. Go to https://cockpit.sumsub.com
3. Settings → App Tokens
4. Copy App Token and Secret Key

## License

MIT
