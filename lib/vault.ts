import { getWorkOS } from "./workos";

/**
 * Store a secret in WorkOS Vault on behalf of a user.
 * Returns the Vault object ID to persist in the database.
 * The DB should only ever store this ID, never the raw secret.
 */
export async function storeSecret(
	workosUserId: string,
	name: string,
	value: string,
): Promise<string> {
	const workos = getWorkOS();
	const object = await workos.vault.createObject({
		name,
		value,
		context: { organizationId: workosUserId },
	});
	return object.id;
}

/**
 * Retrieve a secret value by its Vault object ID.
 * Use immediately and do not persist the returned value.
 */
export async function readSecret(vaultObjectId: string): Promise<string> {
	const workos = getWorkOS();
	const object = await workos.vault.readObject({ id: vaultObjectId });
	if (!object.value) {
		throw new Error(`Vault object ${vaultObjectId} has no value`);
	}
	return object.value;
}

/**
 * Update a secret's value in-place (same Vault object ID).
 */
export async function updateSecret(
	vaultObjectId: string,
	value: string,
): Promise<void> {
	const workos = getWorkOS();
	await workos.vault.updateObject({ id: vaultObjectId, value });
}

/**
 * Delete a secret from Vault.
 * Call this when the associated DB row is deleted.
 */
export async function deleteSecret(vaultObjectId: string): Promise<void> {
	const workos = getWorkOS();
	await workos.vault.deleteObject({ id: vaultObjectId });
}
