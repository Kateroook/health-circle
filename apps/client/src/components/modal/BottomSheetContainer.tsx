import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/src/theme/theme";

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
  return (
    <Modal
      isVisible={isVisible}
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
      <SafeAreaView testID={testId} accessibilityLabel={testId} style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.container}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
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
