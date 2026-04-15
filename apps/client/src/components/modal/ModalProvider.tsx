import React, { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import { BottomSheetContainer } from "./BottomSheetContainer";
import { ModalContainer } from "./ModalContainer";

type ModalType = "center" | "bottomSheet";

type OpenModalOptions = {
  type?: ModalType;
};

type ModalEntry = {
  node: ReactNode;
  type: ModalType;
  id: number;
};

type ModalContextValue = {
  openModal: (node: ReactNode, options?: OpenModalOptions) => void;
  closeModal: () => void;
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

type ModalProviderProps = {
  children: ReactNode;
};

let nextId = 0;

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [stack, setStack] = useState<ModalEntry[]>([]);

  const openModal = useCallback<ModalContextValue["openModal"]>((node, options) => {
    const type: ModalType = options?.type ?? "center";
    setStack((prev) => [...prev, { node, type, id: nextId++ }]);
  }, []);

  const closeModal = useCallback(() => {
    // Mark top modal as closing by removing it after animation
    setStack((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({ openModal, closeModal }),
    [openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}

      <FullWindowOverlay>
        <View pointerEvents="box-none" style={styles.modalLayer}>
          {/* Render each modal in the stack */}
          {stack.map((entry) =>
            entry.type === "center" ? (
              <ModalContainer key={entry.id} isVisible={true} onClose={closeModal}>
                {entry.node}
              </ModalContainer>
            ) : (
              <BottomSheetContainer key={entry.id} isVisible={true} onClose={closeModal}>
                {entry.node}
              </BottomSheetContainer>
            ),
          )}
        </View>
      </FullWindowOverlay>
    </ModalContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 9999,
  },
});
