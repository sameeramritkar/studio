export enum UserRole {
  ADMIN = 'ADMIN',
  VOTER = 'VOTER',
  OBSERVER = 'OBSERVER',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface Participant extends User {
  vote?: string | number;
  hasVoted: boolean;
}

export const POKER_VALUES: readonly (string | number)[] = ['0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?'];
