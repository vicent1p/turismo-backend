import { IsString, MinLength } from 'class-validator';

/** Request payload for `PATCH /api/auth/change-password`. */
export class ChangePasswordDto {
  @IsString()
  @MinLength(4, { message: 'Debe ingresar su contraseña actual' })
  currentPassword: string;

  @IsString()
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword: string;
}

