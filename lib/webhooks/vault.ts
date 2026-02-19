import { getWorkOS } from "@/lib/workos";

/**
 * Store a webhook secret in WorkOS Vault.
 * Returns the vault object ID — never store the raw secret value.
 */
export async function storeSecret(
	workosUserId: string,
	name: string,
	value: string,
): Promise<string> {
	const workos = getWorkOS();
	const obj = await workos.vault.createObject({
		name,
		value,
		context: { userId: workosUserId },
	});
	return obj.id;
}

/**
 * Read a secret from WorkOS Vault by its object ID.
 * The returned value should be used immediately and never persisted.
 */
export async function readSecret(vaultId: string): Promise<string> {
	const workos = getWorkOS();
	const obj = await workos.vault.readObject({ id: vaultId });
	if (!obj.value) throw new Error(`Vault object ${vaultId} has no value`);
	return obj.value;
}

/**
 * Delete a secret from WorkOS Vault by its object ID.
 */
export async function deleteSecret(vaultId: string): Promise<void> {
	const workos = getWorkOS();
	await workos.vault.deleteObject({ id: vaultId });
}
