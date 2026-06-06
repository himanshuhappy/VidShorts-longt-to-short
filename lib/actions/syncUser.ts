import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Syncs the currently signed-in Clerk user to the database.
 * Uses upsert so calling this on every visit is safe and idempotent.
 * Returns the database user row, or null if no user is signed in.
 */
export async function syncUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (existing.length > 0) {
    // Update the existing user (keeps info fresh with Clerk)
    const [updated] = await db
      .update(users)
      .set({
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUser.id))
      .returning();

    return updated;
  }

  // Insert new user
  const [created] = await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    })
    .returning();

  return created;
}
