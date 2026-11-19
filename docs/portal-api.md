# Контракт партнёрского кабинета

Только чтение. Все ответы — JSON в `camelCase`, суммы — в минорных единицах
(копейки, тиыны, центы).

## Авторизация

```
Authorization: Bearer <токен партнёра>
```

Токен выдаёт специалист вместе со ссылкой. Видов два, оба принимаются:

- непрозрачный: живёт в базе сервиса, владелец может отозвать его в любой момент;
- подписанный: содержит срок, продлевается при каждом обращении.

Пара «тенант + партнёр» берётся из токена. Параметров о том, чьи данные
запрашиваются, в контракте нет — иначе токен одного партнёра открывал бы чужие.

Cookie контракт не использует: интерфейс работает с любого домена.

## CORS

Открыт только для `/v1/portal/me*`: `GET`, `OPTIONS`, `Access-Control-Allow-Origin: *`,
заголовки `Authorization`, без `Allow-Credentials`.

## Маршруты

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
  "specialists": [
    {
      "tenantId": "olga",
      "name": "Ольга",
      "domain": "olga.example",
      "createdAt": "2026-11-03T10:00:00Z",
      "published": true,
      "paid": false
    }
  ],
  "brand": {
    "name": "РАССВЕТ ИНТЕЛЛЕКТ",
    "color": "#4f46e5",
    "color2": "#7c3aed",
    "logo": null,
    "support": "Вопросы — в поддержку"
  },
  "currency": "RUB",
  "payoutMinimumMinor": 500000,
  "access": {
    "expiresAt": "2026-12-19T09:00:00Z",
    "token": "новый-токен-или-null"
  }
}
```

Поле `access.token` приходит только для подписанных токенов: это продлённый
токен, его нужно сохранить на клиенте. Для непрозрачных токенов `access` равно
`{"expiresAt": null, "token": null}` — срок не нужен, доступ отзывается.

### `GET /v1/portal/me/invited`

```json
{ "memberId": "real-estate", "invited": [], "access": { "expiresAt": null, "token": null } }
```

### `GET /v1/portal/me/payouts`

```json
{ "memberId": "real-estate", "payouts": [], "access": { "expiresAt": null, "token": null } }
```

## Статусы

| Поле | Значения |
|---|---|
| `profile.status`, `invited[].status` | `active`, `inactive`, `blocked`, `pending` |
| `payouts[].status` | `draft`, `approved`, `paid`, `cancelled` |

Названия статусов — для логики. Показывать их человеку нужно своими словами.

## Ошибки

| Код | Когда | Тело |
|---|---|---|
| `401` | токена нет, он битый или отозван | `{"detail": "partner token ..."}` |
| `404` | партнёра нет у этого тенанта | `{"detail": "partner not found"}` |
| `429` | больше 60 запросов в минуту по токену | `{"detail": "too many requests"}` |

## Что считается совместимым изменением

- добавление необязательных полей в ответы;
- новые маршруты;
- новые статусы выплат, если интерфейс показывает неизвестное значение как есть.

Несовместимо: переименование и удаление полей, смена смысла сумм, изменение
единиц (всегда минорные), перенос маршрутов, отказ от `Bearer`.

## Чего в контракте не будет

- записи: выплаты и настройки остаются у владельца;
- ключа тенанта: он живёт только на сервере владельца;
- cookie и сессий: токен в заголовке — единственный способ.
