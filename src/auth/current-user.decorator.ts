import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Rol } from '@prisma/client';

export interface AuthenticatedUser {
  id: number | string;
  correo: string;
  rol: Rol;
  nombreCompleto?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
