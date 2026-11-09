interface LinkResponse {
  result: "linked" | "invalid_or_expired" | "already_connected";
  linked_user_id: string | null;
}

interface ConnectionResponse {
  connected: boolean;
}

export interface TelegramSession {
  id: string;
  role: "USER" | "ADMIN" | "OWNER";
  status: "ACTIVE" | "SUSPENDED";
  fullName: string;
  telegramId: string;
  telegramUsername: string | null;
}

interface SessionResponse {
  connected: boolean;
  profile: TelegramSession | null;
}

export type TelegramTaxonomyCategory = "BRAND" | "FAMILY" | "MODEL";

export interface TelegramTaxonomyOption {
  id: string;
  category: TelegramTaxonomyCategory;
  value: string;
  metadata: Record<string, unknown> | null;
}

const API_BASE_URL = process.env.API_BASE_URL;
const BOT_SERVICE_TOKEN = process.env.BOT_SERVICE_TOKEN;

export async function linkTelegramAccount(
  code: string,
  telegramId: string,
  telegramUsername: string | null,
): Promise<LinkResponse> {
  if (!API_BASE_URL || !BOT_SERVICE_TOKEN) {
    throw new Error("Backend configuration is missing.");
  }

  const response = await fetch(`${API_BASE_URL}/telegram/verify-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BOT_SERVICE_TOKEN}`,
    },
    body: JSON.stringify({
      code,
      telegramId,
      telegramUsername,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Backend returned ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  return response.json() as Promise<LinkResponse>;
}

export async function checkTelegramConnection(
  telegramId: number | undefined,
): Promise<boolean> {
  if (!API_BASE_URL || !BOT_SERVICE_TOKEN) {
    throw new Error("Backend configuration is missing.");
  }
  if (telegramId === undefined) {
    throw new Error("Telegram user ID is missing.");
  }

  const response = await fetch(
    `${API_BASE_URL}/telegram/check-connection/${telegramId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${BOT_SERVICE_TOKEN}`,
      },
    },
  );
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Backend returned ${response.status}${details ? `: ${details}` : ""}`,
    );
  }
  const data = (await response.json()) as ConnectionResponse;
  return data.connected;
}

export async function getTelegramSession(
  telegramId: number | undefined,
): Promise<TelegramSession | null> {
  if (!API_BASE_URL || !BOT_SERVICE_TOKEN) {
    throw new Error("Backend configuration is missing.");
  }
  if (telegramId === undefined) {
    throw new Error("Telegram user ID is missing.");
  }

  const response = await fetch(
    `${API_BASE_URL}/telegram/session/${telegramId}`,
    {
      headers: {
        Authorization: `Bearer ${BOT_SERVICE_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Backend returned ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  const data = (await response.json()) as SessionResponse;
  return data.profile;
}

async function taxonomyRequest(
  telegramId: number,
  path: string,
  init: RequestInit,
): Promise<Response> {
  if (!API_BASE_URL || !BOT_SERVICE_TOKEN) {
    throw new Error("Backend configuration is missing.");
  }

  const response = await fetch(`${API_BASE_URL}/telegram/taxonomy${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BOT_SERVICE_TOKEN}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Backend returned ${response.status}${details ? `: ${details}` : ""}`,
    );
  }
  return response;
}

export async function getTelegramTaxonomy(
  telegramId: number,
  category: TelegramTaxonomyCategory,
  filters: { brand?: string; family?: string } = {},
): Promise<TelegramTaxonomyOption[]> {
  const params = new URLSearchParams({
    telegramId: String(telegramId),
    category,
  });
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.family) params.set("family", filters.family);

  const response = await taxonomyRequest(telegramId, `?${params.toString()}`, {
    method: "GET",
    body: undefined,
    headers: { "Content-Type": "application/json" },
  });
  const data = (await response.json()) as { options: TelegramTaxonomyOption[] };
  return data.options;
}

export async function addTelegramTaxonomy(
  telegramId: number,
  category: TelegramTaxonomyCategory,
  values: string[],
  metadata: Record<string, unknown> | null = null,
): Promise<TelegramTaxonomyOption[]> {
  const response = await taxonomyRequest(telegramId, "", {
    method: "POST",
    body: JSON.stringify({
      telegramId: String(telegramId),
      category,
      values,
      metadata,
    }),
  });
  const data = (await response.json()) as { options: TelegramTaxonomyOption[] };
  return data.options;
}
