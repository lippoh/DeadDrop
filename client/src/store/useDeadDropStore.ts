import { create } from 'zustand';

interface DeadDropState {
  isEncrypting: boolean;
  resultLink: string | null;
  setEncrypting: (state: boolean) => void;
  setResultLink: (link: string | null) => void;
  reset: () => void;
}

export const useDeadDropStore = create<DeadDropState>((set) => ({
  isEncrypting: false,
  resultLink: null,
  setEncrypting: (state) => set({ isEncrypting: state }),
  setResultLink: (link) => set({ resultLink: link }),
  reset: () => set({ isEncrypting: false, resultLink: null }),
}));