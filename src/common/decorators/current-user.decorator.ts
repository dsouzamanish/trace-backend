import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  isManager: boolean;
  isAdmin?: boolean;
  team?: string;           // Deprecated: use teamUid instead
  teamUid?: string;        // Team entry UID
  teamName?: string;       // Team name
  managedTeams?: string[]; // UIDs of teams managed by this user
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;
    return data ? user?.[data] : user;
  },
);

