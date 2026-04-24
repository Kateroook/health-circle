import { useSyncExternalStore } from "react";

type Listener = () => void;

let visibleModalCount = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function markModalVisible() {
  visibleModalCount += 1;
  emit();
}

export function markModalHidden() {
  visibleModalCount = Math.max(0, visibleModalCount - 1);
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return visibleModalCount > 0;
}

export function useAnyModalVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
