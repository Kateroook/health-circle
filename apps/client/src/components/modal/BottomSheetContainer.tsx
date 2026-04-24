import React, { useEffect, useId, useRef, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/src/theme/theme";
import { markModalHidden, markModalVisible } from "./modalVisibility";
import { Portal } from "./PortalProvider";

type BottomSheetContainerProps = {
  isVisible: boolean;
  onClose?: () => void;
  children: ReactNode;
  testId?: string;
};

export const BottomSheetContainer: React.FC<BottomSheetContainerProps> = ({
  isVisible,
  onClose,
  children,
  testId,
}) => {
  const reportedVisibleRef = useRef(false);

  useEffect(() => {
    if (isVisible && !reportedVisibleRef.current) {
      markModalVisible();
      reportedVisibleRef.current = true;
    } else if (!isVisible && reportedVisibleRef.current) {
      markModalHidden();
      reportedVisibleRef.current = false;
    }
  }, [isVisible]);

  useEffect(
    () => () => {
      if (reportedVisibleRef.current) {
        markModalHidden();
        reportedVisibleRef.current = false;
      }
    },
    [],
  );

  const id = useId();

  return (
    <Portal id={id} group="modals">
      <Modal
        isVisible={isVisible}
        coverScreen={false}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        onSwipeComplete={onClose}
        swipeDirection="down"
        useNativeDriver
        useNativeDriverForBackdrop
        backdropColor={theme.colors.background.overlay}
        backdropOpacity={1}
        propagateSwipe
        style={styles.modal}
      >
        <SafeAreaView
          edges={["bottom"]}
          testID={testId}
          accessibilityLabel={testId}
          style={styles.sheet}
        >
          <View style={styles.grabber} />
          <View style={styles.container}>{children}</View>
        </SafeAreaView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
    zIndex: 99999,
    elevation: 20,
  },
  sheet: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "92%",
    width: "100%",
  },
  grabber: {
    alignSelf: "center",
    width: theme.spacing[40],
    height: theme.spacing[4],
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.content.secondary,
    marginTop: theme.spacing[12],
    marginBottom: 0,
  },
  container: {
    paddingTop: theme.spacing[32],
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[40],
    gap: theme.spacing[16],
  },
});
