import React, { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

import { BottomSheetContainer } from "./BottomSheetContainer";
import { ModalContainer } from "./ModalContainer";

type ModalType = "center" | "bottomSheet";

type OpenModalOptions = {
  type?: ModalType;
};

type ModalState = {
  node: ReactNode | null;
  type: ModalType;
};

type ModalContextValue = {
  openModal: (node: ReactNode, options?: OpenModalOptions) => void;
  closeModal: () => void;
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

type ModalProviderProps = {
  children: ReactNode;
};

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>({ node: null, type: "center" });
  const [isVisible, setIsVisible] = useState(false);

  const closeModal = useCallback(() => {
    setIsVisible(false);
    // Let exit animations play before clearing content
    setTimeout(() => {
      setModalState((prev) => (prev.node ? { ...prev, node: null } : prev));
    }, 250);
  }, []);

  const openModal = useCallback<ModalContextValue["openModal"]>((node, options) => {
    const type: ModalType = options?.type ?? "center";
    setModalState({ node, type });
    setIsVisible(true);
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({
      openModal,
      closeModal,
    }),
    [openModal, closeModal],
  );

  const shouldShowCenter = isVisible && modalState.node && modalState.type === "center";
  const shouldShowBottomSheet = isVisible && modalState.node && modalState.type === "bottomSheet";

  return (
    <ModalContext.Provider value={value}>
      {children}

      <ModalContainer isVisible={!!shouldShowCenter} onClose={closeModal}>
        {shouldShowCenter ? modalState.node : null}
      </ModalContainer>

      <BottomSheetContainer isVisible={!!shouldShowBottomSheet} onClose={closeModal}>
        {shouldShowBottomSheet ? modalState.node : null}
      </BottomSheetContainer>
    </ModalContext.Provider>
  );
};
