# partna-partner

The partner cabinet: a single page that shows a partner their numbers — how much
was accrued, how much was paid, what is available, who came through the link.

The interface is open (MIT) because it holds no secrets and no money: it reads
data through the partner's personal link, while the specialist's service does the
counting and the paying.

English · [Русский](README.ru.md)

## What is inside

- Vue 3 + TypeScript + Vite, no UI libraries: one bundle, one CSS file.
- Summary, invited clients, payouts, specialists, the client link.
- Discount links: the partner issues one for a single client and revokes it.
- Certificates: the partner asks, the owner confirms; the balance is debited only
  after confirmation.
- The brand (name, colours, logo, support text) comes from the server, so one
  build serves any specialist.
- The token arrives in the address: `https://your-domain/#t=<token>`; the address
  is cleaned after load and the token is kept in `sessionStorage`.
- No keys, no cookies: requests carry `Authorization: Bearer`.

## Build

```bash
npm ci
VITE_PARTNA_API=https://networks.partna.dev npm run build
```

`dist/` is static and can live on any host. `VITE_PARTNA_API` selects the service
that serves the data; it defaults to `https://networks.partna.dev`.

Check locally:

```bash
npm ci
npm run dev
# open http://localhost:5173/#t=<token>
```

The specialist issues the token in their cabinet together with the partner link.

## Contract

Reading is described in [docs/portal-api.md](docs/portal-api.md): `GET /v1/portal/me`,
`/me/invited`, `/me/payouts`, the `Authorization: Bearer` header, error codes.

The partner only reads and issues discount links. Payouts are closed and confirmed
by the owner.

## Boundaries

- Money does not pass through the interface: it shows accruals and payouts counted
  on the service side.
- The tenant key (`X-API-Key`) never reaches the browser and is not used here.
- Nothing moves money: discount links hand out a percentage within the programme
  limit; the balance and payouts stay with the owner.

## License

MIT — see [LICENSE](LICENSE).
