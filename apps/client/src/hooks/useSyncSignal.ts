import { collection, doc, getFirestore, onSnapshot } from "@react-native-firebase/firestore";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export function useSyncSignal(onSync: () => void) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || !user.id) return;

    const db = getFirestore();
    const documentRef = doc(collection(db, "user_sync"), user.id);

    const unsubscribe = onSnapshot(
      documentRef,
      (docSnapshot) => {
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
