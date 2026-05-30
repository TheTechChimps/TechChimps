"use client";

import { X } from "lucide-react";
import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";

export function Modal({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div aria-labelledby={titleId} aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="modal">
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button aria-label="Close modal" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="button-row">
          <Button onClick={onClose} type="button" variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
