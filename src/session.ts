export type Binding = {
  tenantId: string;
  memberId: string;
  token: string;
  brand: string;
};

export type SessionState = {
  account: boolean;
  bindings: Binding[];
};

const HEADER = "X-Partner-Session";

export async function loadSession(): Promise<SessionState> {
  try {
    const response = await fetch("/p/session", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return { account: false, bindings: [] };
    }
    return (await response.json()) as SessionState;
  } catch {
    return { account: false, bindings: [] };
  }
}

export async function bindPartner(token: string): Promise<Binding | null> {
  try {
    const response = await fetch("/p/session/bind", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", [HEADER]: "1" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Binding;
  } catch {
    return null;
  }
}

export async function unbindPartner(tenantId: string): Promise<boolean> {
  try {
    const response = await fetch("/p/session/unbind", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", [HEADER]: "1" },
      body: JSON.stringify({ tenantId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
