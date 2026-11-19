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

export async function loadDashboard(token: string): Promise<Dashboard> {
  const response = await fetch(`${BASE}/v1/portal/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (response.status === 401 || response.status === 404) {
    throw new Unauthorized();
  }
  if (response.status === 429) {
    throw new TooMany();
  }
  if (!response.ok) {
    throw new Error(`ошибка ${response.status}`);
  }
  return (await response.json()) as Dashboard;
}
