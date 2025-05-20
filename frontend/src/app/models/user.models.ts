import { ApiResponse } from './api.models';

/**
 * Available user roles in the system
 */
export type UserRole = 'admin' | 'user';

/**
 * Base user interface containing all possible user fields
 */
export interface User {
  // System fields
  uuid: string;
  email: string;
  role: UserRole;
  createdAt: string;

  // Personal fields
  name?: string;
  surname?: string;
  
  // Contact fields
  areaCode?: string;
  phone?: string;
  website?: string;
  
  // Configuration fields
  slug?: string;
  isVcardEnabled: boolean;
  isWhatsappEnabled: boolean;
  isWebsiteEnabled: boolean;
}

/**
 * Public user data interface
 * Used for public profile endpoints
 */
export interface PublicUserData {
  uuid: string;
  name?: string;
  surname?: string;
  areaCode?: string;
  phone?: string;
  website?: string;
  isVcardEnabled: boolean;
  isWhatsappEnabled: boolean;
  isWebsiteEnabled: boolean;
  slug?: string;
}

/**
 * Create user request
 * Only requires email
 */
export interface CreateUserRequest {
  email: string;
}

/**
 * Create user response data
 */
export interface CreateUserResponseData {
  email: string;
}

/**
 * Create user response
 */
export type CreateUserResponse = ApiResponse<CreateUserResponseData>;

/**
 * Edit user request
 * All fields are optional
 */
export interface EditUserRequest {
  name?: string;
  surname?: string;
  areaCode?: string;
  phone?: string;
  website?: string;
  isWhatsappEnabled?: boolean;
  isWebsiteEnabled?: boolean;
  isVcardEnabled?: boolean;
  slug?: string;
}

/**
 * Edit user response
 */
export type EditUserResponse = ApiResponse<User>;

/**
 * Delete user request
 */
export interface DeleteUserRequest {
  email: string;
}

/**
 * Delete user response
 */
export type DeleteUserResponse = ApiResponse<null>;

/**
 * List users response
 */
export type ListUsersResponse = ApiResponse<User[]>;

/**
 * Get user by slug response
 */
export type GetUserBySlugResponse = ApiResponse<PublicUserData>;

/**
 * Get user by UUID response
 */
export type GetUserByUuidResponse = ApiResponse<PublicUserData>;