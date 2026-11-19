type WidgetConfig = {
  tag: string;
  script: string;
  attrs: Record<string, string>;
};

export async function mountSupport(tenantId: string): Promise<void> {
  if (!tenantId) {
    return;
  }
  try {
    const response = await fetch(
      `/cabinet/api/support-widget?tenant=${encodeURIComponent(tenantId)}`,
      { credentials: "include", headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
      return;
    }
    const config = (await response.json()) as WidgetConfig;
    if (!config?.tag || !config?.script || document.querySelector(config.tag)) {
      return;
    }
    const element = document.createElement(config.tag);
    for (const [name, value] of Object.entries(config.attrs ?? {})) {
      element.setAttribute(name, String(value));
    }
    document.body.appendChild(element);

    const script = document.createElement("script");
    script.src = config.script;
    script.defer = true;
    document.body.appendChild(script);
  } catch {
    return;
  }
}
