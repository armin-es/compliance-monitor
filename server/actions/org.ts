"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function provisionOrg(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  const { data: memberships } =
    await client.users.getOrganizationMembershipList({ userId });
  if (memberships.length > 0) {
    return memberships[0].organization.id;
  }

  const user = await client.users.getUser(userId);
  const name = user.firstName ? `${user.firstName}'s Workspace` : "My Workspace";

  const org = await client.organizations.createOrganization({
    name,
    createdBy: userId,
  });

  return org.id;
}
