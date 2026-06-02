import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Layers, ShieldCheck, Zap } from "lucide-react";

export default function DemoSpotlight() {
  return (
    <div className="flex min-h-[500px] w-full items-center justify-center bg-bg-primary p-4 sm:p-10">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        <SpotlightCard className="flex h-full flex-col gap-4 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface-2">
            <Layers className="h-5 w-5 text-content-primary" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-semibold text-content-primary">Seamless UX</h3>
            <p className="text-sm text-content-secondary">
              Smooth, mouse-responsive interactions that elevate the user experience to the next level.
            </p>
          </div>
        </SpotlightCard>

        <SpotlightCard className="flex h-full flex-col gap-4 p-6" spotlightColor="rgba(74, 222, 128, 0.25)">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/40 bg-accent-dim">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-semibold text-content-primary">Secure By Design</h3>
            <p className="text-sm text-content-secondary">
              Built with modern security standards, ensuring your data is protected with end-to-end encryption.
            </p>
          </div>
        </SpotlightCard>

        <SpotlightCard className="flex h-full flex-col gap-4 p-6" spotlightColor="rgba(245, 200, 75, 0.25)">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface-2">
            <Zap className="h-5 w-5 text-content-primary" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-semibold text-content-primary">Lightning Fast</h3>
            <p className="text-sm text-content-secondary">
              Optimized for performance. Import the component and start building without configuration overhead.
            </p>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
