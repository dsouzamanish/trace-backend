import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  isManager: boolean;
  isAdmin?: boolean;
  team?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;
    return data ? user?.[data] : user;
  },
);

