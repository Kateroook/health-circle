import { apiFetch } from "./api";

export interface Contact {
  id: string;
  ownerId: string;
  targetId: string;
  alias: string;
  createdAt: string;
  updatedAt: string;
}

export async function setContactAlias(targetId: string, alias: string) {
  return apiFetch(`/contacts/${targetId}`, {
    method: "PUT",
    body: JSON.stringify({ alias }),
  });
}

export async function removeContact(targetId: string) {
    return apiFetch(`/contacts/${targetId}`, {
        method: "DELETE",
    });
}
