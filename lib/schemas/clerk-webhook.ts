import { z } from "zod";

export const clerkEmailAddressSchema = z.object({
  id: z.string(),
  email_address: z.string().email(),
});

export const clerkUserCreatedDataSchema = z.object({
  id: z.string().min(1),
  email_addresses: z.array(clerkEmailAddressSchema).min(1),
  primary_email_address_id: z.string().nullable(),
});

export const clerkUserCreatedEventSchema = z.object({
  type: z.literal("user.created"),
  data: clerkUserCreatedDataSchema,
});

export type ClerkUserCreatedData = z.infer<typeof clerkUserCreatedDataSchema>;

export function getPrimaryEmail(data: ClerkUserCreatedData): string {
  const primary = data.email_addresses.find(
    (entry) => entry.id === data.primary_email_address_id,
  );

  return primary?.email_address ?? data.email_addresses[0].email_address;
}