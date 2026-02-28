'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { userSchema, updateUserSchema } from '@/schemas/user';
import type { UserInput, UpdateUserInput } from '@/schemas/user';

export async function createUser(data: UserInput) {
  // Validate input
  const validated = userSchema.parse(data);

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      name: validated.name,
    },
  });

  revalidatePath('/users');
  return user;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  // Validate input
  const validated = updateUserSchema.parse(data);

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: validated,
  });

  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
  return user;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });

  revalidatePath('/users');
}
