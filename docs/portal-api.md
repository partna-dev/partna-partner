# Partner cabinet contract

English · [Русский](portal-api.ru.md)

Read-only. All responses are JSON in `camelCase`, amounts are in minor units
(kopecks, tiyins, cents).

## Authorisation

```
Authorization: Bearer <partner token>
```

The specialist issues the token together with the link. Two kinds are accepted:

- opaque: stored in the service database, the owner can revoke it at any moment;
- signed: carries an expiry and is renewed on every call.

The tenant and the partner come from the token. There are no parameters saying
whose data is requested — otherwise one partner's token would open another's.

The contract does not use cookies: the interface works from any domain.

## CORS

Open only for `/v1/portal/me*`: `GET`, `OPTIONS`, `Access-Control-Allow-Origin: *`,
the `Authorization` header, no `Allow-Credentials`.

## Routes

### `GET /v1/portal/me`

```json
{
  "profile": {
    "memberId": "real-estate",
    "status": "active",
    "referralCode": "IRON",
    "referralUrl": "https://client.example/r/IRON",
    "createdAt": "2026-11-01T10:00:00Z"
  },
  "summary": {
    "currency": "RUB",
    "invitedCount": 3,
    "activeInvitedCount": 2,
    "netEarnedMinor": 30000,
    "paidMinor": 20000,
    "pendingPayoutMinor": 0,
    "availableMinor": 10000,
    "heldMinor": 0,
    "leadsTotal": 5,
    "leadsPaid": 2
  },
  "invited": [
    {
      "memberId": "u-1",
      "externalId": "user-42",
      "code": "IRON",
      "status": "active",
      "claimedAt": "2026-11-02T10:00:00Z",
      "accruedMinor": 10000
    }
  ],
  "payouts": [
    {
      "itemId": "01J...",
      "batchId": "01J...",
      "periodId": "2026-11",
      "amountMinor": 20000,
      "currency": "RUB",
      "status": "paid",
      "paidAt": "2026-11-15T10:00:00Z",
      "createdAt": "2026-11-14T10:00:00Z"
    }
  ],
  "certificates": [
    {
      "id": "01J...",
      "label": "Masha",
      "amountMinor": 100000,
      "currency": "RUB",
      "status": "active",
      "createdAt": "2026-11-10T10:00:00Z",
      "expiresAt": "2027-02-08T10:00:00Z"
    }
  ],
  "certificateRequests": [
    {
      "id": "01J...",
      "label": "Masha",
      "amountMinor": 100000,
      "currency": "RUB",
      "status": "new",
      "createdAt": "2026-11-15T10:00:00Z",
      "decidedAt": null
    }
  ],
  "certificateRule": { "minimumMinor": 50000, "days": 90 },
  "discount": { "limitBp": 1000, "currentBp": 500 },
  "links": [
    {
      "code": "MASHA10",
      "url": "https://networks.partna.dev/r/MASHA10",
      "label": "Masha",
      "discountBp": 1000,
      "expiresAt": "2026-12-14T10:00:00Z",
      "used": false
    }
  ],
  "specialists": [
    {
      "tenantId": "olga",
      "name": "Olga",
      "domain": "olga.example",
      "createdAt": "2026-11-03T10:00:00Z",
      "published": true,
      "paid": false
    }
  ],
  "brand": {
    "name": "AI SUNRISE",
    "color": "#4f46e5",
    "color2": "#7c3aed",
    "logo": null,
    "support": "Questions go to support"
  },
  "message": "Hi! This is AI SUNRISE: ...",
  "currency": "RUB",
  "payoutMinimumMinor": 500000,
  "access": {
    "expiresAt": "2026-12-19T09:00:00Z",
    "token": "a-new-token-or-null"
  }
}
```

`access.token` arrives only for signed tokens: it is the renewed token and must be
kept on the client. For opaque tokens `access` is
`{"expiresAt": null, "token": null}` — no expiry is needed, access is revoked
instead.

`message` is the ready-to-send text for a client: name, link and brand already
substituted.

### `GET /v1/portal/me/invited`

```json
{ "memberId": "real-estate", "invited": [], "access": { "expiresAt": null, "token": null } }
```

### `GET /v1/portal/me/payouts`

```json
{ "memberId": "real-estate", "payouts": [], "access": { "expiresAt": null, "token": null } }
```

### `POST /v1/portal/me/discount-links`

A discount for one client. No money moves: it is a percentage off the price within
the programme limit.

```json
{ "label": "Masha", "percent": 10, "days": 30 }
```

- `label` is required, up to 40 characters;
- `percent` is optional; without it the partner's common percentage is used; never
  above `discount.limitBp`;
- `days` is 1 to 365, 30 by default;
- at most 50 active links, otherwise `409`.

Response `201`:

```json
{
  "code": "MASHA10",
  "url": "https://networks.partna.dev/r/MASHA10",
  "label": "Masha",
  "discountBp": 1000,
  "expiresAt": "2026-12-14T10:00:00Z",
  "used": false
}
```

### `POST /v1/portal/me/certificate-requests`

A certificate spends the balance, so a link cannot issue one: the partner asks,
the owner confirms. Money moves only after confirmation.

```json
{ "label": "Masha", "amountMinor": 100000 }
```

- `amountMinor` is not below `certificateRule.minimumMinor` and not above the
  available balance (`summary.availableMinor`), otherwise `422`;
- at most five pending requests, otherwise `409`;
- response `201`: a request with the status `new`.

Request statuses: `new`, `approving`, `approved`, `declined`.

### `DELETE /v1/portal/me/discount-links/{code}`

Revocation. Response `200`: `{"status": "revoked", "code": "MASHA10"}`. Someone
else's or a missing link — `404`.

### `PUT /v1/portal/me/discount`

The partner's common percentage.

```json
{ "percent": 5 }
```

Response `200`: `{"limitBp": 1000, "currentBp": 500}`. Above the limit — `422`.

## Statuses

| Field | Values |
|---|---|
| `profile.status`, `invited[].status` | `active`, `inactive`, `blocked`, `pending` |
| `payouts[].status` | `draft`, `approved`, `paid`, `cancelled` |
| `certificateRequests[].status` | `new`, `approving`, `approved`, `declined` |
| `certificates[].status` | `active`, `reserved`, `used`, `expired` |

Status names are for logic. Showing them to a person is a separate mapping.

## Errors

| Code | When | Body |
|---|---|---|
| `401` | no token, or it is broken or revoked | `{"detail": "partner token ..."}` |
| `404` | no such partner for this tenant | `{"detail": "partner not found"}` |
| `429` | more than 60 requests per minute per token | `{"detail": "too many requests"}` |
| `409` | more than 50 active links, or a code could not be allocated | `{"detail": "..."}` |
| `422` | no label, percentage outside the programme limit | `{"detail": "..."}` |

## What counts as a compatible change

- adding optional fields to responses;
- new routes;
- new payout statuses, as long as the interface shows unknown values as they are.

Incompatible: renaming or removing fields, changing what amounts mean, changing
units (always minor), moving routes, dropping `Bearer`.

## What the contract will never include

- money writes: payouts and settings stay with the owner, a certificate is issued
  only after their confirmation;
- discount links are the only action that changes data immediately, and it does not
  move the balance;
- the tenant key: it lives only on the owner's server;
- cookies and sessions: a token in the header is the only way.
