import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface EndTournamentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading: boolean;
}

export function EndTournamentModal({ open, onClose, onConfirm, loading }: EndTournamentModalProps) {
  return (
    <Modal open={open} onClose={onClose} variant="scale" dismissable={!loading}>
      <h2 className="text-xl font-bold tracking-tight text-content-primary">End this tournament?</h2>
      <p className="mt-2 text-sm text-content-secondary">
        Final standings will be saved. This cannot be undone.
      </p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onConfirm()} loading={loading}>
          End Tournament
        </Button>
      </div>
    </Modal>
  );
}
