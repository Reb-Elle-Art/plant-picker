# [Bug] /api/claim issues fake instant claim without sending invite email

## Severity
High (broken feature)

## Component
agents.composio.dev API

## Description
The `/api/claim` endpoint returns `"status": "invited"` but does not actually send an invite email to the target address. Instead, it immediately marks `claimed_by` with the provided email and sets a future expiry timestamp — with no actual email verification step.

## Steps to Reproduce
1. Create an agent account via the agent signup flow (POST /api/signup)
2. Call claim endpoint with any email address (real or fake)
3. Immediately check status via GET /api/whoami
4. Observe that `claimed_by` is already populated — no email was sent

## Test Data

| Email | Type | Claimed | Invite Email Received |
|-------|------|---------|----------------------|
| Email 1 | Real (Composio account exists) | Yes - instant | No |
| Email 2 | Real (different Composio account) | Yes - instant | No |
| Email 3 | Fake (non-existent domain) | Yes - instant | No |

Even completely non-existent email addresses result in an instant "claimed" status.

## Expected Behavior
- Invite email should be sent to the target address
- Claim should complete only after email verification (link click)
- `claimed_by` should remain null until the human verifies

## Actual Behavior
- No email sent to any tested address
- `claimed_by` populated instantly with whatever email is provided
- Works with completely non-existent email addresses
- Agent inbox shows no invite-related emails

## Evidence
Agent inbox (checked via GET /api/mail) shows only signup confirmation emails. No invite emails ever sent to the claimed email addresses or the agent inbox.

## Additional Notes
- The docs state invite expires after 24 hours, but API returns 7 days expiry — possible documentation drift
- Dashboard does not show agent orgs (separate but possibly related issue)
- Feature is new (launched early May 2026) — edge cases likely untested

## Impact
- Agents cannot properly hand off org control to humans
- Any email address can be claimed instantly with no verification
- The expiry is meaningless since no email is sent
- Human admin takeover flow is completely broken

## Recommendation
Implement actual email sending with a verification link. The claim should only complete after the human clicks the link in their email.