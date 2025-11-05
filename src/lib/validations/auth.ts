import { z } from 'zod';

// Custom email validation with more strict rules
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const emailValidation = z
  .string()
  .min(1, 'El email es requerido')
  .trim()
  .toLowerCase()
  .refine(
    (email) => emailRegex.test(email),
    'El formato del email no es válido'
  )
  .refine(
    (email) => !email.includes('..'),
    'El email no puede contener puntos consecutivos'
  )
  .refine(
    (email) => !email.startsWith('.') && !email.endsWith('.'),
    'El email no puede empezar o terminar con un punto'
  )
  .refine(
    (email) => email.split('@')[0].length <= 64,
    'La parte local del email no puede exceder 64 caracteres'
  )
  .refine(
    (email) => email.split('@')[1]?.length <= 255,
    'El dominio del email no puede exceder 255 caracteres'
  )
  .refine(
    (email) => email.length <= 320,
    'El email no puede exceder 320 caracteres'
  );

export const loginSchema = z.object({
  email: emailValidation,
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim()
    .refine(
      (name) => name.length > 0,
      'El nombre no puede estar vacío'
    ),
  email: emailValidation,
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .refine(
      (password) => /[a-z]/.test(password),
      'La contraseña debe contener al menos una letra minúscula'
    )
    .refine(
      (password) => /[A-Z]/.test(password) || /[0-9]/.test(password),
      'La contraseña debe contener al menos una letra mayúscula o un número'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Debes confirmar la contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
