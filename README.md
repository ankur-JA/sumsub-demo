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
   SUMSUB_LEVEL_NAME=basic-kyc-level
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
POST https://api.sumsub.com/resources/applicants?levelName=basic-kyc-level
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

---

## 🔄 Complete Visual Flow Diagrams

### PHASE 1: Admin Sends Invite 📧

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Admin     │      │   Frontend   │      │   Backend   │      │   Sumsub     │
│  Dashboard  │      │    (page.tsx)│      │(invite API) │      │     API      │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘      └──────┬───────┘
       │                    │                     │                    │
  1) Enter email            │                     │                    │
  "user@test.com"           │                     │                    │
       │─────────────────>  │                     │                    │
       │                    │                     │                    │
  2) Click "Send Invite"    │                     │                    │
       │─────────────────>  │                     │                    │
       │                    │                     │                    │
       │              3) POST /api/kyc/invite     │                    │
       │                    │──────────────────>  │                    │
       │                    │ {email: "user@"}    │                    │
       │                    │                     │                    │
       │                    │              4) Check if exists          │
       │                    │              (db.getApplicantByEmail)    │
       │                    │                     │                    │
       │                    │              5) Generate externalUserId  │
       │                    │              "user_1234567_abc123"       │
       │                    │                     │                    │
       │                    │              6) Create applicant         │
       │                    │                     │────────────────>   │
       │                    │                     │ POST /resources/   │
       │                    │                     │ applicants?        │
       │                    │                     │ levelName=basic-   │
       │                    │                     │ kyc-level          │
       │                    │                     │ {                  │
       │                    │                     │  externalUserId,   │
       │                    │                     │  email             │
       │                    │                     │ }                  │
       │                    │                     │                    │
       │                    │                     │ <──────────────────│
       │                    │                     │ {                  │
       │                    │                     │  id: "6723fa...",  │
       │                    │                     │  createdAt: "..."  │
       │                    │                     │ }                  │
       │                    │                     │                    │
       │                    │              7) Save to database         │
       │                    │              db.createApplicant({        │
       │                    │                applicantId,              │
       │                    │                externalUserId,           │
       │                    │                email,                    │
       │                    │                status: 'created'         │
       │                    │              })                          │
       │                    │                     │                    │
       │                    │              8) Generate verification    │
       │                    │              link:                       │
       │                    │              localhost:3000/verify?      │
       │                    │              applicantId=6723fa...       │
       │                    │                     │                    │
       │                    │ <────────────────── │                    │
       │                    │ {                                        │
       │                    │   verificationLink,                      │
       │                    │   message: "Invite sent"                 │
       │                    │ }                                        │
       │ <──────────────────│                                          │
       │ Display link       │                                          │
```

**WHY THIS PHASE:**
- ✅ Creates user identity in Sumsub's system
- ✅ Gets unique applicantId to track this verification
- ✅ Generates verification link for user to click
- ✅ Stores mapping between email and applicantId in database

---

### PHASE 2: User Opens Verification Link 🔗

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│    User     │      │   Frontend   │      │   Backend   │      │   Sumsub     │
│             │      │ (verify/page)│      │ (token API) │      │     API      │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘      └──────┬───────┘
       │                    │                     │                    │
  1) Click link:            │                     │                    │
  /verify?applicantId=...   │                     │                    │
       │─────────────────>  │                     │                    │
       │                    │                     │                    │
       │              2) Extract applicantId      │                    │
       │              from URL params             │                    │
       │                    │                     │                    │
       │              3) Request access token     │                    │
       │                    │──────────────────>  │                    │
       │                    │ POST /api/kyc/token │                    │
       │                    │ {applicantId}       │                    │
       │                    │                     │                    │
       │                    │              4) Get applicant from DB    │
       │                    │              (db.getApplicant)           │
       │                    │                     │                    │
       │                    │              5) Generate short-lived     │
       │                    │              access token                │
       │                    │                     │────────────────>   │
       │                    │                     │ POST /resources/   │
       │                    │                     │ accessTokens?      │
       │                    │                     │ userId=user_123&   │
       │                    │                     │ ttlInSecs=600      │
       │                    │                     │ {externalUserId}   │
       │                    │                     │                    │
       │                    │                     │ <──────────────────│
       │                    │                     │ {                  │
       │                    │                     │  token: "sbx_at_"  │
       │                    │                     │ }                  │
       │                    │                     │                    │
       │                    │              6) Update status to         │
       │                    │              'started'                   │
       │                    │              (db.updateApplicantStatus)  │
       │                    │                     │                    │
       │                    │ <────────────────── │                    │
       │                    │ {accessToken}       │                    │
       │                    │                     │                    │
       │              7) Initialize Sumsub SDK    │                    │
       │              snsWebSdk.init(token)       │                    │
       │                    │                     │                    │
       │              8) Load SDK iframe          │                    │
       │ <──────────────────│                     │                    │
       │ See verification   │                     │                    │
       │ form               │                     │                    │
```

**WHY THIS PHASE:**
- 🔐 **Security**: Token generated server-side (secrets never exposed to frontend)
- ⏱️ **Short-lived token**: Expires in 10 minutes for security
- ✅ **Authenticates user**: Sumsub knows this is a valid verification session
- 📱 **Loads SDK**: User can now upload documents

---

### PHASE 3: User Submits Documents 📄

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│    User     │      │  Sumsub SDK  │      │   Sumsub     │
│             │      │   (iframe)   │      │   Backend    │
└──────┬──────┘      └──────┬───────┘      └──────┬───────┘
       │                    │                     │
  1) Upload ID document     │                     │
  (passport/driver license) │                     │
       │─────────────────>  │                     │
       │                    │──────────────────>  │
       │                    │ Upload image        │
       │                    │                     │
  2) Take selfie            │                     │
       │─────────────────>  │                     │
       │                    │──────────────────>  │
       │                    │ Upload selfie       │
       │                    │                     │
  3) Click "Submit"         │                     │
       │─────────────────>  │                     │
       │                    │──────────────────>  │
       │                    │ Submit verification │
       │                    │                     │
       │              4) SDK fires event:         │
       │              "idCheck.onApplicant        │
       │              Submitted"                  │
       │                    │                     │
       │              5) Redirect to:             │
       │              /progress?applicantId=...   │
       │ <──────────────────│                     │
```

**WHY THIS PHASE:**
- 📸 **Document collection**: Sumsub receives documents to verify
- 🤖 **AI verification**: Sumsub AI checks document authenticity, face match
- 🛡️ **Fraud detection**: Checks for manipulated images, stolen identities
- 👤 **User experience**: Real-time feedback and guidance

---

### PHASE 4: Sumsub Processes & Sends Webhooks 🔔

```
┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Sumsub     │      │   Backend   │      │   Database   │
│   Backend    │      │  (webhook)  │      │              │
└──────┬───────┘      └──────┬──────┘      └──────┬───────┘
       │                     │                     │
  1) AI processes documents  │                     │
  - OCR text extraction      │                     │
  - Face matching            │                     │
  - Fraud detection          │                     │
       │                     │                     │
  2) Send webhook:           │                     │
  "applicantPending"         │                     │
       │──────────────────>  │                     │
       │ POST /api/sumsub/   │                     │
       │ webhook             │                     │
       │ {                   │                     │
       │   applicantId,      │                     │
       │   type: "pending"   │                     │
       │ }                   │                     │
       │                     │                     │
       │              3) Verify webhook signature  │
       │              (HMAC verification)          │
       │                     │                     │
       │              4) Update database           │
       │                     │──────────────────>  │
       │                     │ db.updateApplicant  │
       │                     │ Status(id,          │
       │                     │  'pending')         │
       │                     │                     │
       │ <────────────────── │                     │
       │ 200 OK              │                     │
       │                     │                     │
  5) Manual review (if needed)                     │
  by Sumsub team             │                     │
       │                     │                     │
  6) Send final webhook:     │                     │
  "applicantApproved"        │                     │
       │──────────────────>  │                     │
       │ POST /api/sumsub/   │                     │
       │ webhook             │                     │
       │ {                   │                     │
       │   applicantId,      │                     │
       │   type: "Approved", │                     │
       │   reviewStatus: {   │                     │
       │     reviewAnswer:   │                     │
       │     "GREEN"         │                     │
       │   }                 │                     │
       │ }                   │                     │
       │                     │                     │
       │              7) Update to completed       │
       │                     │──────────────────>  │
       │                     │ db.updateApplicant  │
       │                     │ Status(id,          │
       │                     │  'completed',       │
       │                     │  'green')           │
```

**WHY THIS PHASE:**
- ⚡ **Async processing**: Sumsub processes documents in background
- 📡 **Real-time updates**: Webhooks notify your system of status changes
- 🔐 **Security**: HMAC signature verification prevents fake webhooks
- 🎯 **Reliability**: Your system has latest verification status

---

### PHASE 5: User Sees Progress Updates 📊

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│    User     │      │   Frontend   │      │   Backend   │      │   Database   │
│             │      │(progress/page│      │(status API) │      │              │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘      └──────┬───────┘
       │                    │                     │                     │
  1) On /progress page      │                     │                     │
       │                    │                     │                     │
       │              2) Fetch current status     │                     │
       │                    │──────────────────>  │                     │
       │                    │ GET /api/kyc/status/│                     │
       │                    │ 6723fa...           │                     │
       │                    │                     │                     │
       │                    │              3) Get from database         │
       │                    │                     │──────────────────>  │
       │                    │                     │ db.getApplicant(id) │
       │                    │                     │ <────────────────── │
       │                    │                     │ {status: 'pending', │
       │                    │                     │  reviewStatus: null}│
       │                    │                     │                     │
       │                    │              4) Map to progress           │
       │                    │              mapStatusToProgress()        │
       │                    │              Returns:                     │
       │                    │              {                            │
       │                    │                progress: 85,              │
       │                    │                text: "Under review",      │
       │                    │                state: "in-progress"       │
       │                    │              }                            │
       │                    │                     │                     │
       │                    │ <────────────────── │                     │
       │                    │ {progress, text,    │                     │
       │                    │  state, ...}        │                     │
       │ <──────────────────│                     │                     │
       │ Display:           │                     │                     │
       │ ████████░░ 85%     │                     │                     │
       │ "Under review"     │                     │                     │
       │                    │                     │                     │
       │              5) Wait 3 seconds           │                     │
       │              (polling interval)          │                     │
       │                    │                     │                     │
       │              6) Fetch again              │                     │
       │                    │──────────────────>  │──────────────────>  │
       │                    │                     │ <────────────────── │
       │                    │                     │ {status: 'completed'│
       │                    │                     │  reviewStatus:      │
       │                    │                     │  'green'}           │
       │                    │                     │                     │
       │                    │              7) Map to progress           │
       │                    │              {                            │
       │                    │                progress: 100,             │
       │                    │                text: "Approved ✅",       │
       │                    │                state: "completed"         │
       │                    │              }                            │
       │                    │ <────────────────── │                     │
       │ <──────────────────│                     │                     │
       │ Display:           │                     │                     │
       │ ██████████ 100%    │                     │                     │
       │ "✅ Verification   │                     │                     │
       │ Approved!"         │                     │                     │
```

**WHY THIS PHASE:**
- 📊 **Real-time feedback**: User sees progress as Sumsub processes
- 🔄 **Polling**: Every 3 seconds checks for updates
- ✨ **User experience**: Clear progress bar and status messages
- 🚫 **No refresh needed**: Updates automatically

---

## 📋 API Summary Table

| API Endpoint | Method | Purpose | Who Calls It | Returns |
|-------------|--------|---------|--------------|---------|
| **`/api/kyc/invite`** | POST | Create applicant in Sumsub | Admin dashboard | Verification link |
| **`/api/kyc/token`** | POST | Generate short-lived access token | Verify page | Access token (10min) |
| **`/api/kyc/status/:id`** | GET | Get current verification status | Progress page | Status + progress % |
| **`/api/sumsub/webhook`** | POST | Receive status updates from Sumsub | Sumsub servers | 200 OK |

---

## 🎯 Status Flow Diagram

```
created (5%) - Applicant profile created
    ↓
started (15%) - User opened verification link
    ↓
pending (85%) - Documents submitted, under review
    ↓
completed (100%)
    ├─> green ✅ (Approved - verification passed)
    ├─> red ❌ (Rejected - verification failed)
    └─> onHold ⚠️ (Need more info - resubmission required)
```

---

## 🚀 Key Takeaways

1. **Two-way communication**: Your app ↔ Sumsub
2. **Webhook-driven**: Sumsub pushes updates to you
3. **Polling**: Frontend pulls updates from your backend
4. **Secure by design**: Tokens, HMAC, server-side processing
5. **User-friendly**: Real-time progress, clear messaging

---

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

---

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
