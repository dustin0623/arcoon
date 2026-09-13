# Discord Account Linking Proposal

## Overview

This proposal outlines the implementation of Discord account linking for Idle Raiders. The primary purpose is to provide **identity verification as a withdrawal gate**, ensuring players have verified their identity through Discord before being allowed to withdraw tokens.

---

## Goals

1. **Withdrawal Security**: Require Discord verification before allowing RAID/SHRD withdrawals
2. **Account Limit**: Maximum of 3 game accounts per Discord account (prevents abuse)
3. **Identity Verification**: Use Discord as a trusted identity provider
4. **Community Integration**: Enable future Discord-based features (notifications, role sync, etc.)

---

## Database Schema

### New Collection: `discord_accounts`

```typescript
interface IDiscordAccount {
  discordId: string           // Discord user ID (unique, indexed)
  discordUsername: string     // e.g., "player#1234" or "player"
  discordAvatar?: string      // Avatar hash for profile display
  linkedPlayers: {
    playerId: ObjectId        // Reference to Player document
    username: string          // HIVE username
    linkedAt: Date            // When this account was linked
  }[]                         // Max 3 entries
  createdAt: Date
  updatedAt: Date
}
```

### Player Model Update

Add to `IPlayer` interface:

```typescript
{
  // ... existing fields
  discordId?: string          // Discord user ID (optional, indexed)
  discordLinkedAt?: Date      // When Discord was linked
}
```

---

## Environment Variables

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://idleraiders.com/api/auth/discord/callback
```

---

## OAuth2 Flow

### 1. Link Discord Account

```
Player clicks "Link Discord" in Settings/Profile
  ↓
GET /api/auth/discord
  ↓
Generate state token (playerId + timestamp, signed with JWT)
  ↓
Redirect to Discord OAuth2:
  https://discord.com/oauth2/authorize?
    client_id={CLIENT_ID}&
    redirect_uri={REDIRECT_URI}&
    response_type=code&
    scope=identify&
    state={signed_state}
  ↓
Player authorizes on Discord
  ↓
Discord redirects to:
  /api/auth/discord/callback?code={code}&state={state}
  ↓
Verify state token (decode JWT, check playerId, expiry)
  ↓
Exchange code for access_token:
  POST https://discord.com/api/oauth2/token
  ↓
Fetch Discord user info:
  GET https://discord.com/api/users/@me
  ↓
Validate & Link:
  - Check if Discord account already has 3 linked players
  - Check if player already has Discord linked
  - Create/update DiscordAccount document
  - Update Player.discordId
  ↓
Redirect to /game/profile?discord=linked
```

### 2. Unlink Discord Account

```
POST /api/auth/discord/unlink
  ↓
Verify player is authenticated
  ↓
Remove player from DiscordAccount.linkedPlayers
  ↓
Clear Player.discordId
  ↓
Return success
```

---

## API Endpoints

### `GET /api/auth/discord`

Initiates Discord OAuth2 flow.

**Request:**
- Requires authentication (JWT)

**Response:**
- 302 Redirect to Discord authorization URL

---

### `GET /api/auth/discord/callback`

Handles Discord OAuth2 callback.

**Query Parameters:**
- `code`: Authorization code from Discord
- `state`: Signed state token

**Response:**
- 302 Redirect to `/game/profile?discord=linked` on success
- 302 Redirect to `/game/profile?discord=error&reason={reason}` on failure

**Error Reasons:**
- `invalid_state` - State token invalid or expired
- `already_linked` - Player already has Discord linked
- `max_accounts` - Discord account has 3 linked players
- `discord_error` - Discord API error

---

### `POST /api/auth/discord/unlink`

Unlinks Discord from current player account.

**Request:**
- Requires authentication (JWT)

**Response:**
```json
{
  "success": true,
  "message": "Discord account unlinked"
}
```

---

### `GET /api/auth/discord/status`

Returns Discord linking status for current player.

**Response:**
```json
{
  "linked": true,
  "discordId": "123456789",
  "discordUsername": "player#1234",
  "linkedAt": "2024-01-15T10:30:00Z",
  "totalLinkedAccounts": 2
}
```

---

## Withdrawal Gate Implementation

### Update `/api/transactions/withdraw/route.ts`

```typescript
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId, username) => {
    const player = await Player.findById(playerId)
    if (!player) throw new Error('Player not found')

    // ═══════════════════════════════════════════════════════════════
    // Discord Verification Gate
    // ═══════════════════════════════════════════════════════════════
    if (!player.discordId) {
      throw new Error('Discord account must be linked before withdrawing. Go to Profile to link your Discord.')
    }

    // ... rest of withdrawal logic
  })
}
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `lib/modules/discord/discord.model.ts` | CREATE | DiscordAccount schema |
| `lib/modules/discord/discord.repository.ts` | CREATE | CRUD operations |
| `lib/modules/discord/discord.service.ts` | CREATE | OAuth2 logic, linking |
| `lib/modules/players/player.model.ts` | MODIFY | Add `discordId`, `discordLinkedAt` |
| `app/api/auth/discord/route.ts` | CREATE | Initiate OAuth2 |
| `app/api/auth/discord/callback/route.ts` | CREATE | Handle callback |
| `app/api/auth/discord/unlink/route.ts` | CREATE | Unlink Discord |
| `app/api/auth/discord/status/route.ts` | CREATE | Check link status |
| `app/api/transactions/withdraw/route.ts` | MODIFY | Add Discord gate |
| `app/game/profile/page.tsx` | MODIFY | Add Discord link UI |
| `features/actions/authActions.ts` | MODIFY | Add Discord actions |

---

## UI Components

### Profile Page - Discord Section

```tsx
<Card>
  <CardHeader>
    <CardTitle>Discord Account</CardTitle>
    <CardDescription>
      Link your Discord to enable withdrawals
    </CardDescription>
  </CardHeader>
  <CardContent>
    {discordLinked ? (
      <div className="flex items-center gap-4">
        <Avatar src={discordAvatar} />
        <div>
          <p className="font-medium">{discordUsername}</p>
          <p className="text-sm text-muted-foreground">
            Linked {formatDate(linkedAt)}
          </p>
        </div>
        <Button variant="outline" onClick={handleUnlink}>
          Unlink
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Link your Discord account to enable withdrawals. 
          Each Discord can link up to 3 game accounts.
        </p>
        <Button onClick={handleLink}>
          <DiscordIcon className="mr-2 h-4 w-4" />
          Link Discord
        </Button>
      </div>
    )}
  </CardContent>
</Card>
```

### Withdrawal Modal - Discord Warning

```tsx
{!discordLinked && (
  <Alert variant="warning">
    <AlertTitle>Discord Required</AlertTitle>
    <AlertDescription>
      You must link your Discord account before withdrawing.
      <Link href="/game/profile">Go to Profile</Link>
    </AlertDescription>
  </Alert>
)}
```

---

## Security Considerations

### State Token

The OAuth2 state parameter contains:

```typescript
interface DiscordOAuthState {
  playerId: string
  timestamp: number
  nonce: string        // Random string for uniqueness
}

// Sign with JWT, expires in 10 minutes
const state = jwt.sign(statePayload, JWT_SECRET, { expiresIn: '10m' })
```

### Token Storage

- Discord access tokens are **not stored** (we only need one-time user info fetch)
- Only Discord user ID and username are persisted
- Tokens are exchanged and immediately discarded

### Rate Limiting

```typescript
// Prevent abuse of OAuth2 initiation
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,               // 5 attempts per minute
  message: 'Too many link attempts'
})
```

---

## Migration Script

For existing players, no migration is needed. Discord linking is:
- Optional for existing accounts (until they want to withdraw)
- Enforced only at withdrawal time
- Players can link at their convenience

---

## Future Enhancements

1. **Discord Role Sync**: Assign roles based on in-game achievements
2. **Discord Notifications**: Send DMs for important events (withdrawal confirmed, etc.)
3. **Discord Login**: Use Discord as alternative login method
4. **Linked Accounts View**: Show all linked game accounts in profile
5. **Account Recovery**: Use Discord for account recovery verification

---

## Implementation Phases

### Phase 1: Core Linking (MVP)
- Discord OAuth2 flow
- Link/Unlink functionality
- Profile UI integration
- Withdrawal gate

### Phase 2: Enhanced Security
- Rate limiting
- Audit logging
- Admin tools for viewing linked accounts

### Phase 3: Community Features
- Role sync with Discord server
- Optional DM notifications
- Account recovery flow

---

## Testing Checklist

- [ ] OAuth2 flow completes successfully
- [ ] State token validation works
- [ ] 3-account limit enforced
- [ ] Already-linked account rejected
- [ ] Unlink removes player from Discord account
- [ ] Withdrawal blocked without Discord
- [ ] Withdrawal succeeds with Discord linked
- [ ] UI shows correct state for linked/unlinked
- [ ] Error messages clear and actionable

---

## Questions to Resolve

1. Should unlinking Discord disable withdrawals immediately?
2. Cooldown period after unlinking before re-linking?
3. Should we notify via Discord webhook when accounts are linked?
4. Admin override for withdrawal gate in special cases?
