import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold">Next.js App</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline">Admin Dashboard</Button>
              </Link>
              <Button>Sign In</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Welcome to</span>
            <span className="block text-blue-600 dark:text-blue-400">Next.js 16</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
            A modern Next.js boilerplate with TypeScript, Tailwind CSS, Prisma, Better Auth, and
            shadcn/ui components.
          </p>
          <div className="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </div>
            <div className="mt-3 rounded-md shadow sm:ml-3 sm:mt-0">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
              <h3 className="text-lg font-semibold">⚡ Fast & Modern</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Built with Next.js 16 App Router and React 19 for optimal performance.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
              <h3 className="text-lg font-semibold">🔐 Authentication Ready</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Better Auth integration with database-backed sessions and user management.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
              <h3 className="text-lg font-semibold">🎨 Beautiful UI</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                shadcn/ui components with Tailwind CSS for stunning interfaces.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
