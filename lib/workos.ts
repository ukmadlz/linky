import { WorkOS } from "@workos-inc/node";

let _client: WorkOS | null = null;

export function getWorkOS(): WorkOS {
  if (_client) return _client;

  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) {
    throw new Error("WORKOS_API_KEY is not set");
  }

  const clientId = process.env.WORKOS_CLIENT_ID;
  _client = new WorkOS(apiKey, { clientId });
  return _client;
}
