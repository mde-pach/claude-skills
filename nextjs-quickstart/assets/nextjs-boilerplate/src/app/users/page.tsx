import { prisma } from '@/lib/db';
import { UsersClient } from './users-client';

export default async function UsersPage() {
  // Fetch users on the server
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-2">
          Example page demonstrating TanStack Query, nuqs, and React Hook Form
        </p>
      </div>
      <UsersClient initialUsers={users} />
    </div>
  );
}
