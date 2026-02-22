// Базові типи для API
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type UserStatus = 'SAFE' | 'DANGER' | 'UNKNOWN';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ApiResponseMeta {
  timestamp: string;
  path?: string;
  method?: string;
}

export interface UUIdEntryDto {
  id: string;
}