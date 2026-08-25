import { z } from "zod";

export const organizationCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80),
});

export const websiteCreateSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80),
});

export const domainCreateSchema = z.object({
  websiteId: z.string().min(1),
  hostname: z.string().trim().toLowerCase().min(3).max(253).regex(/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),
  isPrimary: z.boolean().default(false),
});

export const applicationCreateSchema = z.object({
  websiteId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  image: z.string().trim().min(1).max(255),
  port: z.number().int().min(1).max(65535).default(3000),
});

export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;
export type WebsiteCreate = z.infer<typeof websiteCreateSchema>;
export type DomainCreate = z.infer<typeof domainCreateSchema>;
export type ApplicationCreate = z.infer<typeof applicationCreateSchema>;
