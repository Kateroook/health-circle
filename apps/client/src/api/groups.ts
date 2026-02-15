import { apiFetch } from "./api";

export async function blockUser(groupId: string, userId: string) {
  return apiFetch(`/groups/${groupId}/block/${userId}`, {
    method: "POST",
  });
}

export async function unblockUser(groupId: string, userId: string) {
  return apiFetch(`/groups/${groupId}/block/${userId}`, {
    method: "DELETE",
  });
}

export async function getBlockedUsers(groupId: string) {
  return apiFetch(`/groups/${groupId}/blocked-users`, {
    method: "GET",
  });
}
