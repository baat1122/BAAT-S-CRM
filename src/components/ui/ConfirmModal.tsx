import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-neon-blue/10 text-neon-blue'}`}>
              <AlertTriangle size={24} />
            </div>
            <button onClick={onClose} className="text-foreground/50 hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-foreground/70 text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="bg-foreground/5 p-4 flex justify-end gap-3 border-t border-border">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-background border border-border hover:bg-foreground/5 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg font-bold text-sm text-white shadow-lg transition-colors ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                : 'bg-neon-blue hover:bg-neon-blue/80 shadow-neon-blue/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
