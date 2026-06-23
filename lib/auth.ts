export function isDemoUser(userId: string): boolean {
  const demoUserId = process.env.DEMO_USER_ID;

  if (!demoUserId) {
    return false;
  }

  return userId === demoUserId;
}