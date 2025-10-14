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

## How It Works

### The Problem This Solves
- ❌ Manual document verification (slow, expensive)
- ❌ No real-time status updates  
- ❌ Complex integration with multiple providers
- ❌ Security concerns with document handling

**This Solution Provides:**
- ✅ Automated document verification via Sumsub
- ✅ Real-time progress tracking
- ✅ Secure, compliant verification
- ✅ Great user experience

### Complete Flow

#### 1. Admin Sends Invite
```javascript
// User enters email in dashboard
email: "user@example.com"

// Backend creates applicant in Sumsub
POST https://api.sumsub.com/resources/applicants
{
  "externalUserId": "user_1736789123_abc123",
  "email": "user@example.com"
}

// Sumsub responds with applicantId
{
  "id": "6723fa1234567890abcdef",  // ← This is the key!
  "externalUserId": "user_1736789123_abc123"
}
```

#### 2. User Opens Verification Link
```javascript
// Link: http://localhost:3000/verify?applicantId=6723fa1234567890abcdef

// Page requests access token from backend
POST /api/kyc/token
{
  "applicantId": "6723fa1234567890abcdef"
}

// Backend generates Sumsub access token (valid 10 minutes)
POST https://api.sumsub.com/resources/accessTokens?userId=user_1736789123_abc123&ttlInSecs=600
// Returns: "sbx_at_xxxxxxxxxxxxx"
```

#### 3. Sumsub WebSDK Loads
```javascript
// Frontend loads Sumsub SDK with token
snsWebSdk.init("sbx_at_xxxxxxxxxxxxx")
  .withConf({ lang: "en", theme: "light" })
  .build()
  .launch(containerElement);

// User uploads ID document, takes selfie, submits
```

#### 4. Real-time Status Updates
```javascript
// Sumsub sends webhook to your backend
POST /api/sumsub/webhook
{
  "applicantId": "6723fa1234567890abcdef",
  "type": "applicantApproved",
  "reviewStatus": { "reviewAnswer": "GREEN" }
}

// Backend updates database
applicants.set("6723fa1234567890abcdef", {
  status: "completed",
  reviewStatus: "green"
});

// Frontend polls for updates every 3 seconds
GET /api/kyc/status/6723fa1234567890abcdef
// Returns: { progress: 100, text: "Verification approved ✅" }
```

### Security Features

#### 1. No Secrets in Frontend
```javascript
// ❌ Bad: Token in frontend
const token = "sbx_at_...";  // Exposed to users!

// ✅ Good: Token generated server-side
const response = await fetch('/api/kyc/token', {
  method: 'POST',
  body: JSON.stringify({ applicantId })
});
const { accessToken } = await response.json();
```

#### 2. HMAC Verification
```javascript
// All webhooks verified with HMAC
const expectedSignature = crypto
  .createHmac('sha256', SUMSUB_SECRET_KEY)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

#### 3. Short-lived Tokens
```javascript
// Tokens expire in 10 minutes
POST /resources/accessTokens?userId=...&ttlInSecs=600

// If token expires, SDK automatically requests new one
snsWebSdk.init(token, () => fetchNewToken())
```

### User Experience Flow

**Admin Experience:**
1. Open dashboard → Enter email → Click "Send Invite"
2. Copy verification link → Send to user
3. Monitor verification status in real-time

**User Experience:**
1. Click verification link → Sumsub SDK loads
2. Upload ID document → Take selfie → Submit
3. Watch progress bar update in real-time
4. See final result: ✅ Approved / ❌ Rejected / ⚠️ Needs more info

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
