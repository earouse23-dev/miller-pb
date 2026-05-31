import { Database } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';

/** Shown when Supabase env vars are missing so the app explains itself
 *  instead of throwing. */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ambient px-6 text-center">
      <Brand size="lg" showText={false} />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-card">
        <Database className="h-6 w-6 text-accent" />
      </div>
      <div className="max-w-md">
        <h1 className="text-xl font-bold text-content-primary">Connect Supabase to get started</h1>
        <p className="mt-2 text-sm text-content-secondary">
          Add your project credentials to a <code className="text-accent">.env</code> file at the
          project root, then restart the dev server:
        </p>
      </div>
      <pre className="w-full max-w-md overflow-x-auto rounded-card border border-line bg-bg-card p-4 text-left text-xs text-content-secondary">
        {`VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"`}
      </pre>
      <p className="max-w-md text-xs text-content-muted">
        Then run the SQL in <code className="text-content-secondary">supabase/migrations/0000_init_schema.sql</code>{' '}
        in your Supabase SQL editor to create the tables.
      </p>
    </div>
  );
}
