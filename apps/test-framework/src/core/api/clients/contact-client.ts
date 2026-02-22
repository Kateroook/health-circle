import { BaseClient, ApiResult } from './base-client';
import {
  GetAllContactsResponse,
  CreateContactRequest,
  CreateContactResponse,
  UpdateContactRequest,
  UpdateContactResponse,
  SetContactAliasRequest,
  SetContactAliasResponse,
  ContactEntity,
} from '../../types/api';

/**
 * ContactClient - клієнт для роботи з Contacts API
 * Пласка структура методів для простоти використання
 */
export class ContactClient extends BaseClient {
  /**
   * GET /api/contacts
   * Отримати всі контакти
   */
  public async getAllContacts(): Promise<ApiResult<GetAllContactsResponse>> {
    return await this.get<GetAllContactsResponse>('/api/contacts');
  }

  /**
   * POST /api/contacts
   * Створити новий контакт
   */
  public async createContact(data: CreateContactRequest): Promise<ApiResult<CreateContactResponse>> {
    const result = await this.post<CreateContactResponse>('/api/contacts', { data });
    
    // Автоматично зберігаємо ID створеного контакту
    if (result.data && result.data.id) {
      this.updateContext({ contactId: result.data.id });
    }
    
    return result;
  }

  /**
   * PATCH /api/contacts/{targetId}
   * Оновити контакт
   */
  public async updateContact(
    targetId: string,
    body: UpdateContactRequest['body']
  ): Promise<ApiResult<UpdateContactResponse>> {
    return await this.patch<UpdateContactResponse>(`/api/contacts/${targetId}`, { data: body });
  }

  /**
   * DELETE /api/contacts/{targetId}
   * Видалити контакт
   */
  public async deleteContact(targetId: string): Promise<ApiResult<void>> {
    return await this.delete<void>(`/api/contacts/${targetId}`);
  }

  /**
   * PUT /api/contacts/{targetId}
   * Встановити псевдонім контакту
   */
  public async setContactAlias(
    targetId: string,
    body: SetContactAliasRequest['body']
  ): Promise<ApiResult<SetContactAliasResponse>> {
    return await this.put<SetContactAliasResponse>(`/api/contacts/${targetId}`, { data: body });
  }

  /**
   * Хелпер: знайти контакт за targetId
   */
  public async findContactByTargetId(targetId: string): Promise<ContactEntity | null> {
    const result = await this.getAllContacts();
    if (!result.data) return null;
    return result.data.find((c) => c.targetId === targetId) || null;
  }

  /**
   * Хелпер: перевірити, чи існує контакт
   */
  public async contactExists(targetId: string): Promise<boolean> {
    const contact = await this.findContactByTargetId(targetId);
    return contact !== null;
  }
}