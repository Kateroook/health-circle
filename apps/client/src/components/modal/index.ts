/**
 * Modal design system: use ModalHeader, ModalContent, ModalActions inside
 * ModalContainer (center) or BottomSheetContainer (sheet).
 * Example: <ModalContainer><ModalHeader /><ModalContent /><ModalActions /></ModalContainer>
 */
export { ModalProvider } from "./ModalProvider";
export { useModal } from "./useModal";
export { useAnyModalVisible } from "./modalVisibility";
export { ModalContainer } from "./ModalContainer";
export { BottomSheetContainer } from "./BottomSheetContainer";
export { ModalHeader } from "./ModalHeader";
export { ModalContent } from "./ModalContent";
export { ModalActions } from "./ModalActions";

export type { ModalHeaderProps } from "./ModalHeader";
export type { ModalContentProps } from "./ModalContent";
export type { ModalActionsProps } from "./ModalActions";
