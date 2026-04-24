import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";

type PortalEntry = {
  id: string;
  group: "modals" | "toasts";
  node: ReactNode;
};

type PortalContextValue = {
  register: (entry: PortalEntry) => void;
  unregister: (id: string) => void;
};

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, PortalEntry>>({});

  const register = useCallback((entry: PortalEntry) => {
    setEntries((prev) => ({ ...prev, [entry.id]: entry }));
  }, []);

  const unregister = useCallback((id: string) => {
    setEntries((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const value = useMemo(() => ({ register, unregister }), [register, unregister]);

  return (
    <PortalContext.Provider value={value}>
      {children}
      <PortalHost entries={Object.values(entries)} />
    </PortalContext.Provider>
  );
}

function PortalHost({ entries }: { entries: PortalEntry[] }) {
  // We sort so that 'modals' appear before 'toasts', guaranteeing the toast is the top-most JSX node.
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.group === b.group) return 0;
      return a.group === "modals" ? -1 : 1;
    });
  }, [entries]);

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 10 }]}
    >
      {sortedEntries.map((e) => (
        <React.Fragment key={e.id}>{e.node}</React.Fragment>
      ))}
    </View>
  );
}

export function Portal({
  id,
  group,
  children,
}: {
  id: string;
  group?: PortalEntry["group"];
  children: ReactNode;
}) {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("Portal must be used within a PortalProvider");
  }

  React.useEffect(() => {
    context.register({ id, group: group ?? "modals", node: children });
  }, [id, group, children, context]);

  React.useEffect(() => {
    return () => context.unregister(id);
  }, [id, context]);

  return null;
}
