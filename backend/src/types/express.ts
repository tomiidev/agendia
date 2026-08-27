import { Request } from 'express';
import { Role } from '../shared/types';

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
