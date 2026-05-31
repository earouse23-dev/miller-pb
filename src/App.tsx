import { Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home } from '@/pages/Home';
import { Create } from '@/pages/Create';
import { Tournament } from '@/pages/Tournament';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastViewport } from '@/components/ui/Toast';
import { LoadingState } from '@/components/ui/Spinner';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
    </AnimatePresence>
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
