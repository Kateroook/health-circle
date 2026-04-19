import { useEffect, useState } from "react";
import { apiFetch } from "../../api/api";
import { useToast } from "../../hooks/useToast";
import { useSettingsStore } from "../../store/settingsStore";

export function useNotifSettings() {
  const { showToast } = useToast();
  const { isPushEnabled, setPushEnabled } = useSettingsStore();
  const [notifSettings, setNotifSettings] = useState<any>(null);
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
    setNotifSettings((prev: any) => (prev ? { ...prev, [key]: value } : prev));
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
