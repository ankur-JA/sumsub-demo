# Sumsub KYC Demo

A complete implementation of Sumsub KYC verification flow with admin dashboard, user verification, and real-time progress tracking.

## Features

✅ **Admin Dashboard** - Send verification invites to users  
✅ **Secure Token Generation** - Backend generates short-lived access tokens  
✅ **Sumsub WebSDK Integration** - Embedded verification flow  
✅ **Webhook Handler** - Receives real-time status updates from Sumsub  
✅ **Progress Tracking** - Real-time status updates with polling  
✅ **Status Mapping** - Maps Sumsub statuses to progress percentages  

## Architecture Overview

### Flow

1. **Admin sends invite**
   - Admin enters email in dashboard
   - Backend creates Sumsub applicant
   - Stores applicantId and user info
   - Generates verification link
   - (In production) Emails link to user

2. **User opens verification link**
   - Link contains applicantId parameter
   - Page requests access token from backend
   - Backend generates short-lived token (10 min)
   - Sumsub WebSDK loads with token

3. **User completes verification**
   - Uploads ID document
   - Completes liveness check
   - Submits for review

4. **Sumsub webhooks**
   - Sumsub sends status updates to `/api/sumsub/webhook`
   - Backend verifies HMAC signature
   - Updates applicant status in database

5. **Progress tracking**
   - User redirected to progress page
   - Page polls `/api/kyc/status/:applicantId` every 3 seconds
   - Real-time progress bar updates
   - Shows final result (approved/rejected/on hold)

## Project Structure

```
sumsub-demo/
├── app/
│   ├── api/
│   │   ├── kyc/
│   │   │   ├── invite/route.ts          # Create applicant & send invite
│   │   │   ├── token/route.ts           # Generate access token
│   │   │   └── status/[id]/route.ts     # Get applicant status
│   │   └── sumsub/
│   │       └── webhook/route.ts         # Handle Sumsub webhooks
│   ├── page.tsx                         # Admin dashboard
│   ├── verify/page.tsx                  # Verification page (WebSDK)
│   └── progress/page.tsx                # Progress tracking page
├── lib/
│   ├── sumsub.ts                        # Sumsub API client
│   ├── db.ts                            # In-memory database
│   └── status-mapper.ts                 # Status to progress mapping
└── .env.example                         # Environment variables template
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
# Sumsub Configuration
SUMSUB_APP_TOKEN=your_app_token_here
SUMSUB_SECRET_KEY=your_secret_key_here
SUMSUB_BASE_URL=https://api.sumsub.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your Sumsub credentials from:
- Dashboard → Settings → [App Tokens](https://cockpit.sumsub.com/checkus/#/app/tokens)

### 3. Configure Sumsub Webhook

In your Sumsub dashboard:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/sumsub/webhook`
3. Select events to subscribe to:
   - `applicantCreated`
   - `applicantPending`
   - `applicantOnHold`
   - `applicantApproved`
   - `applicantRejected`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### POST /api/kyc/invite
Create applicant and send verification invite

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "applicantId": "abc123...",
  "verificationLink": "http://localhost:3000/verify?applicantId=abc123",
  "message": "Invite sent successfully"
}
```

### POST /api/kyc/token
Generate access token for applicant

**Request:**
```json
{
  "applicantId": "abc123..."
}
```

**Response:**
```json
{
  "accessToken": "sbx_at_..."
}
```

### GET /api/kyc/status/:applicantId
Get applicant verification status

**Response:**
```json
{
  "applicantId": "abc123...",
  "email": "user@example.com",
  "status": "completed",
  "reviewStatus": "green",
  "progress": 100,
  "text": "Verification approved ✅",
  "state": "completed",
  "updatedAt": "2025-10-14T..."
}
```

### POST /api/sumsub/webhook
Receive webhooks from Sumsub (called by Sumsub)

**Headers:**
- `x-payload-digest`: HMAC signature

## Status Mapping

The system maps Sumsub statuses to progress percentages:

| Status | Review Status | Progress | Description |
|--------|--------------|----------|-------------|
| created | - | 5% | Verification initiated |
| started | - | 15% | Verification started |
| pending | init | 40% | Documents uploaded |
| pending | - | 85% | Under review |
| queued | - | 85% | Queued for review |
| completed | green | 100% | Approved ✅ |
| completed | red | 100% | Rejected ❌ |
| completed | onHold | 100% | Additional info required ⚠️ |

## Database

Currently uses in-memory storage (`lib/db.ts`). For production:

### Replace with PostgreSQL/MongoDB:

```typescript
// Example with Prisma
export const db = {
  async createApplicant(data) {
    return await prisma.applicant.create({ data });
  },
  async updateApplicantStatus(applicantId, status, reviewStatus) {
    return await prisma.applicant.update({
      where: { applicantId },
      data: { status, reviewStatus, updatedAt: new Date() }
    });
  },
  // ...
};
```

## Production Checklist

- [ ] Replace in-memory database with persistent storage (PostgreSQL, MongoDB, etc.)
- [ ] Add email service (SendGrid, AWS SES, etc.) to send verification links
- [ ] Implement user authentication
- [ ] Add rate limiting to API endpoints
- [ ] Set up proper error logging (Sentry, etc.)
- [ ] Configure Sumsub webhook with production URL
- [ ] Add monitoring and alerting
- [ ] Implement SSE or WebSocket for real-time updates (instead of polling)
- [ ] Add retry logic for failed Sumsub API calls
- [ ] Secure environment variables

## Security Notes

1. **HMAC Verification**: All webhooks are verified using HMAC signatures
2. **Short-lived Tokens**: Access tokens expire in 10 minutes
3. **No Secrets in Frontend**: Access tokens generated server-side only
4. **applicantId Validation**: Backend validates applicantId before generating tokens

## Testing

### Test the Flow:

1. Open admin dashboard at `http://localhost:3000`
2. Enter an email and click "Send Invite"
3. Copy the verification link
4. Open the link in a new tab
5. Complete the verification process
6. View progress updates in real-time

### Test Webhooks Locally:

Use ngrok to expose your local server:

```bash
ngrok http 3000
```

Then configure the webhook URL in Sumsub dashboard with the ngrok URL.

## Common Issues

### "Failed to get access token"
- Check that `SUMSUB_APP_TOKEN` and `SUMSUB_SECRET_KEY` are correctly set
- Verify the applicantId exists in the database

### Webhook not receiving events
- Ensure webhook URL is publicly accessible
- Check HMAC signature verification
- Verify events are selected in Sumsub dashboard

### SDK not loading
- Check browser console for errors
- Verify access token is valid and not expired
- Ensure Sumsub SDK is properly installed

## License

MIT
