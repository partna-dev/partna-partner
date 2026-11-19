const PAYOUT_STATUS: Record<string, string> = {
  draft: "черновик",
  approved: "утверждена",
  paid: "выплачена",
  cancelled: "отменена",
};

const MEMBER_STATUS: Record<string, string> = {
  active: "активен",
  inactive: "неактивен",
  blocked: "заблокирован",
  pending: "ожидает",
};

export function money(minor: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function when(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function payoutStatus(value: string): string {
  return PAYOUT_STATUS[value] ?? value;
}

export function memberStatus(value: string): string {
  return MEMBER_STATUS[value] ?? value;
}
