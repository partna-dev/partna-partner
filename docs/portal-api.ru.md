# Контракт партнёрского кабинета

[English](portal-api.md) · Русский

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
`profile.tenantId` повторяет тенанта токена: по нему страница спрашивает у
кабинета то, чего нет в этом контракте (например, вошёл ли владелец).

Cookie контракт не использует: интерфейс работает с любого домена.

## CORS

Открыт только для `/v1/portal/me*`: `GET`, `OPTIONS`, `Access-Control-Allow-Origin: *`,
заголовки `Authorization`, без `Allow-Credentials`.

## Маршруты

### `GET /v1/portal/me`

```json
{
  "profile": {
    "tenantId": "real-estate",
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
      "label": "Маша",
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
      "label": "Маша",
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
      "label": "Маша",
      "discountBp": 1000,
      "expiresAt": "2026-12-14T10:00:00Z",
      "used": false
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

### `POST /v1/portal/me/discount-links`

Скидка одному клиенту. Деньги не двигаются: это процент от цены в пределах
лимита программы.

```json
{ "label": "Маша", "percent": 10, "days": 30 }
```

- `label` — обязательна, до 40 знаков;
- `percent` — необязателен; без него берётся общий процент партнёра; не выше
  `discount.limitBp`;
- `days` — от 1 до 365, по умолчанию 30;
- не больше 50 активных ссылок, иначе `409`.

Ответ `201`:

```json
{
  "code": "MASHA10",
  "url": "https://networks.partna.dev/r/MASHA10",
  "label": "Маша",
  "discountBp": 1000,
  "expiresAt": "2026-12-14T10:00:00Z",
  "used": false
}
```

### `POST /v1/portal/me/certificate-requests`

Сертификат — это расход баланса, поэтому по ссылке он не выдаётся: партнёр
просит, владелец подтверждает. Деньги двигаются только после подтверждения.

```json
{ "label": "Маша", "amountMinor": 100000 }
```

- `amountMinor` не ниже `certificateRule.minimumMinor` и не выше доступного
  баланса (`summary.availableMinor`), иначе `422`;
- не больше пяти заявок в ожидании, иначе `409`;
- ответ `201`: заявка со статусом `new`.

Статусы заявки: `new`, `approving`, `approved`, `declined`.

### `DELETE /v1/portal/me/discount-links/{code}`

Отзыв. Ответ `200`: `{"status": "revoked", "code": "MASHA10"}`. Чужая или
несуществующая ссылка — `404`.

### `PUT /v1/portal/me/discount`

Общий процент партнёра.

```json
{ "percent": 5 }
```

Ответ `200`: `{"limitBp": 1000, "currentBp": 500}`. Выше лимита — `422`.

## Статусы

| Поле | Значения |
|---|---|
| `profile.status`, `invited[].status` | `active`, `inactive`, `blocked`, `pending` |
| `payouts[].status` | `draft`, `approved`, `paid`, `cancelled` |
| `certificateRequests[].status` | `new`, `approving`, `approved`, `declined` |
| `certificates[].status` | `active`, `reserved`, `used`, `expired` |

Названия статусов — для логики. Показывать их человеку нужно своими словами.

## Ошибки

| Код | Когда | Тело |
|---|---|---|
| `401` | токена нет, он битый или отозван | `{"detail": "partner token ..."}` |
| `404` | партнёра нет у этого тенанта | `{"detail": "partner not found"}` |
| `429` | больше 60 запросов в минуту по токену | `{"detail": "too many requests"}` |
| `409` | больше 50 активных скидочных ссылок или код не удалось выделить | `{"detail": "..."}` |
| `422` | нет метки, процент вне лимита программы | `{"detail": "..."}` |

## Что считается совместимым изменением

- добавление необязательных полей в ответы;
- новые маршруты;
- новые статусы выплат, если интерфейс показывает неизвестное значение как есть.

Несовместимо: переименование и удаление полей, смена смысла сумм, изменение
единиц (всегда минорные), перенос маршрутов, отказ от `Bearer`.

## Чего в контракте не будет

- записи денег: выплаты и настройки остаются у владельца, сертификат выдаётся
  только после его подтверждения;
- скидочные ссылки — единственное действие, которое меняет данные сразу, и оно
  не двигает баланс;
- ключа тенанта: он живёт только на сервере владельца;
- cookie и сессий: токен в заголовке — единственный способ.
