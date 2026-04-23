import { collection, doc, getFirestore, onSnapshot } from "@react-native-firebase/firestore";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

/**
 * Listens to a user-specific Firestore document.
 * The backend updates this document whenever relevant groups or statuses change,
 * acting as a webhook to trigger data refetching without polling.
 */
export function useSyncSignal(onSync: () => void) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || !user.id) return;

    const db = getFirestore();
    const documentRef = doc(collection(db, "user_sync"), user.id);

    const unsubscribe = onSnapshot(
      documentRef,
      (docSnapshot) => {
        // Trigger sync when the document updates
        // To prevent initial redundant fetch, you can optionally check `docSnapshot.metadata.hasPendingWrites`
        // but fetching on mount is usually desired anyway.
        if (docSnapshot?.data?.()) {
          onSync();
        }
      },
      (error) => {
        console.error("Sync signal listener error:", error);
      },
    );

    return () => unsubscribe();
  }, [user?.id, onSync]);
}
