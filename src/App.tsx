import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from '@/pages/Home';
import { Create } from '@/pages/Create';
import { Tournament } from '@/pages/Tournament';
import { Leaderboard } from '@/pages/Leaderboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastViewport } from '@/components/ui/Toast';
import { LoadingState } from '@/components/ui/Spinner';

// Enter-only transition. We deliberately do NOT animate route *exits* via a
// route-level AnimatePresence mode="wait": the Tournament page nests several
// AnimatePresence trees (tab content, RR/bracket swap, champion overlay), and
// when the whole page exits at once framer's wait-for-exit can deadlock — the
// new page never mounts and you're left staring at the body background (the
// "black page" on Return to Home). Mounting the next page immediately and only
// animating it *in* removes that entire failure class.
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  return (
    <Routes>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/create"
          element={
            <PageTransition>
              <ErrorBoundary>
                <Create />
              </ErrorBoundary>
            </PageTransition>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PageTransition>
              <ErrorBoundary>
                <Leaderboard />
              </ErrorBoundary>
            </PageTransition>
          }
        />
        <Route
          path="/tournament/:id"
          element={
            <PageTransition>
              <ErrorBoundary>
                <Tournament />
              </ErrorBoundary>
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
      </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingState />}>
          <AnimatedRoutes />
        </Suspense>
        <ToastViewport />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
