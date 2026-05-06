import { useEffect, useState } from "react";
import { create } from "zustand";
import { apiFetch } from "../../api/api";
import { useToast } from "../../hooks/useToast";
import { useSettingsStore } from "../../store/settingsStore";

interface NotifSettingsState {
  notifSettings: any;
  setNotifSettings: (settings: any) => void;
  updateLocalSetting: (key: string, value: boolean) => void;
}

const useNotifSettingsStore = create<NotifSettingsState>((set) => ({
  notifSettings: null,
  setNotifSettings: (settings) => set({ notifSettings: settings }),
  updateLocalSetting: (key, value) =>
    set((state) => ({
      notifSettings: state.notifSettings
        ? { ...state.notifSettings, [key]: value }
        : state.notifSettings,
    })),
}));

export function useNotifSettings() {
  const { showToast } = useToast();
  const { isPushEnabled, setPushEnabled } = useSettingsStore();
  const { notifSettings, setNotifSettings, updateLocalSetting } = useNotifSettingsStore();
  const [loading, setLoading] = useState(false);

  const fetchNotifSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/users/notifications/settings");
      setNotifSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifSettings();
  }, []);

  const updateNotifSetting = async (key: string, value: boolean) => {
    updateLocalSetting(key, value);
    try {
      await apiFetch("/users/notifications/settings", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: "Не вдалося зберегти налаштування",
      });
      fetchNotifSettings(); // revert
    }
  };

  return {
    notifSettings,
    loading,
    isPushEnabled,
    setPushEnabled,
    updateNotifSetting,
    refreshSettings: fetchNotifSettings,
  };
}
