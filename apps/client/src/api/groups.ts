import { apiFetch } from "./api";

export async function getGroups() {
  return apiFetch("/groups", {
    method: "GET",
  });
}

export async function createGroup(name: string) {
  return apiFetch("/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateGroup(data: { id: string; members: string[]; name?: string }) {
  return apiFetch("/groups", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getGroupById(id: string) {
  return apiFetch(`/groups/${id}`, {
    method: "GET",
  });
}

export async function deleteGroup(id: string) {
  return apiFetch(`/groups/${id}`, {
    method: "DELETE",
  });
}

export async function leaveGroup(id: string) {
  return apiFetch(`/groups/${id}/leave`, {
    method: "POST",
  });
}

export async function generateGroupInviteCode(id: string) {
  return apiFetch(`/groups/${id}/invite`, {
    method: "POST",
  });
}

export async function joinGroup(code: string) {
  return apiFetch("/groups/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

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

export async function initiateRollCall(groupId: string) {
  return apiFetch(`/groups/${groupId}/roll-call`, {
    method: "POST",
  });
}
