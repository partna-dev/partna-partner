export type Brand = {
  name: string;
  color: string;
  color2: string;
  logo: string | null;
  support: string;
};

export type Profile = {
  memberId: string;
  status: string;
  referralCode: string | null;
  referralUrl: string | null;
  createdAt: string;
};

export type Summary = {
  currency: string;
  invitedCount: number;
  activeInvitedCount: number;
  netEarnedMinor: number;
  paidMinor: number;
  pendingPayoutMinor: number;
  availableMinor: number;
  heldMinor: number;
  leadsTotal: number;
  leadsPaid: number;
};

export type Invited = {
  memberId: string;
  externalId: string;
  code: string;
  status: string;
  claimedAt: string;
  accruedMinor: number;
};

export type Payout = {
  itemId: string;
  batchId: string;
  periodId: string;
  amountMinor: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

export type Specialist = {
  tenantId: string;
  name: string;
  domain: string | null;
  createdAt: string;
  published: boolean;
  paid: boolean;
};

export type Discount = {
  limitBp: number;
  currentBp: number;
};

export type DiscountLink = {
  code: string;
  url: string;
  label: string;
  discountBp: number;
  expiresAt: string;
  used: boolean;
};

export type Access = {
  expiresAt: string | null;
  token: string | null;
};

export type Dashboard = {
  profile: Profile;
  summary: Summary;
  invited: Invited[];
  payouts: Payout[];
  specialists: Specialist[];
  discount: Discount;
  links: DiscountLink[];
  brand: Brand;
  currency: string;
  payoutMinimumMinor: number;
  access: Access;
};

export class Unauthorized extends Error {
  constructor() {
    super("ссылка недействительна");
  }
}

export class TooMany extends Error {
  constructor() {
    super("слишком много запросов");
  }
}

const BASE = (
  (import.meta.env.VITE_PARTNA_API as string | undefined) ?? "https://networks.partna.dev"
).replace(/\/+$/, "");

export function apiBase(): string {
  return BASE;
}

export class Refused extends Error {}

async function call<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (response.status === 401 || response.status === 404) {
    throw new Unauthorized();
  }
  if (response.status === 429) {
    throw new TooMany();
  }
  if (!response.ok) {
    let detail = `ошибка ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        detail = String(body.detail);
      }
    } catch {
      // тело не json — оставляем код
    }
    throw new Refused(detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function loadDashboard(token: string): Promise<Dashboard> {
  return call<Dashboard>("/v1/portal/me", token);
}

export function createDiscountLink(
  token: string,
  body: { label: string; percent: number | null; days: number },
): Promise<DiscountLink> {
  return call<DiscountLink>("/v1/portal/me/discount-links", token, {
    method: "POST",
    body: JSON.stringify({
      label: body.label,
      percent: body.percent,
      days: body.days,
    }),
  });
}

export function deleteDiscountLink(
  token: string,
  code: string,
): Promise<{ status: string; code: string }> {
  return call<{ status: string; code: string }>(
    `/v1/portal/me/discount-links/${encodeURIComponent(code)}`,
    token,
    { method: "DELETE" },
  );
}

export function saveDiscount(
  token: string,
  percent: number,
): Promise<Discount> {
  return call<Discount>("/v1/portal/me/discount", token, {
    method: "PUT",
    body: JSON.stringify({ percent }),
  });
}
