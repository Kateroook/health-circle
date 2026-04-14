import { Member } from "../types";

export const formatRelativeTime = (dateString: string, currentTime?: number) => {
  const date = new Date(dateString);
  const now = currentTime ? new Date(currentTime) : new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "щойно";
  if (diffMins < 60) return `${diffMins} хв тому`;
  if (diffHours < 24) return `${diffHours} год тому`;

  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const getStatusText = (member: Member, currentTime?: number) => {
  if (!member.lastStatusUpdate) return "ще не відповідав(ла)";

  const timeAgo = formatRelativeTime(member.lastStatusUpdate, currentTime);
  const statusLabels: Record<string, string> = {
    SAFE: "",
    WAS_SAFE: "нещодавно в безпеці",
    DANGER: "потребує допомоги",
    UNKNOWN: "востаннє відповів(ла)",
  };

  const label = statusLabels[member.status] ?? "оновив(ла) статус";
  return `${label}${label ? " · " : ""}${timeAgo}`;
};

export const getRollCallText = (lastPersonalRollCallAt?: string, currentTime?: number) => {
  if (!lastPersonalRollCallAt) return null;
  const timeAgo = formatRelativeTime(lastPersonalRollCallAt, currentTime);
  return `запит надіслано · ${timeAgo}`;
};
