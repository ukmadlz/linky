import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { accounts, users } from "../lib/db/schema";

async function checkPassword() {
	const email = "finaltest@example.com";

	// Check user table
	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
	});

	console.log("User record:");
	console.log({
		id: user?.id,
		email: user?.email,
		name: user?.name,
		password: user?.password,
	});

	// Check accounts table
	if (user) {
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.userId, user.id),
		});

		console.log("\nAccount record:");
		console.log({
			id: account?.id,
			userId: account?.userId,
			providerId: account?.providerId,
			accountId: account?.accountId,
			password: account?.password ? "HASH_STORED" : null,
			passwordLength: account?.password?.length,
		});
	}

	process.exit(0);
}

checkPassword();
