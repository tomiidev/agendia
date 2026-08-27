import { Request } from 'express';
import { Role } from '@miturnouy/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  businessId?: string;
  role?: Role;
  clientId?: string;
}
