import { Brand } from '@/components/layout/Brand';

/** Shown when Supabase env vars are missing so the app explains itself
 *  instead of throwing. */
export function SetupNotice() {
  return (
    <div className="app-texture flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary px-6 text-center">
      <Brand size="lg" />
      <div className="max-w-md">
        <h1 className="font-display text-3xl uppercase tracking-[0.02em] text-content-primary">
          Connect Supabase to get started
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-content-secondary">
          Add your project credentials to a <code className="text-accent">.env</code> file at the
          project root, then restart the dev server:
        </p>
      </div>
      <pre className="w-full max-w-md overflow-x-auto rounded-card border border-line bg-surface p-4 text-left font-mono text-xs text-content-secondary shadow-inset">
        {`VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"`}
      </pre>
      <p className="max-w-md text-xs text-content-muted">
        Then run the SQL in{' '}
        <code className="text-content-secondary">supabase/migrations/</code> in your Supabase SQL
        editor to create the tables.
      </p>
    </div>
  );
}
