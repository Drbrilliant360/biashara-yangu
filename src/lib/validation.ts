import { z } from 'zod';

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/**
 * Validate values against a zod schema. Returns `{ ok: true, data }` or
 * `{ ok: false, errors }` where errors map field name -> first message.
 */
export function validate<S extends z.ZodTypeAny>(
  schema: S,
  values: unknown,
): { ok: boolean; data: z.infer<S> | undefined; errors: FieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data, errors: {} };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, data: undefined, errors };
}

const email = z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email, like name@example.com.');
const password = z.string().min(6, 'Password must be at least 6 characters.');
const phoneOptional = z.string().trim().refine((v) => v === '' || /^\+?[0-9\s-]{9,15}$/.test(v), 'Enter a valid phone number, like 0712 345 678.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email,
  password,
});

export const forgotSchema = z.object({ email });

export const shopSchema = z.object({
  name: z.string().trim().min(2, 'Enter the shop name (at least 2 characters).'),
  email: z.string().trim().refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email, or leave it empty.'),
  phone: phoneOptional,
});

export const paymentSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name.'),
  lastName: z.string().trim().min(1, 'Enter your last name.'),
  email,
  phone: z.string().trim().regex(/^(\+?255|0)[67][0-9]{8}$/, 'Enter a mobile money number like 0712345678.'),
});

export const supportSchema = z.object({
  subject: z.string().trim().min(3, 'Enter a short subject (at least 3 characters).'),
  message: z.string().trim().min(10, 'Describe the problem in at least 10 characters.'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name (at least 2 characters).'),
});
