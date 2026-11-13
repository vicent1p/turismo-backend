import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('api/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /** GET /api/usuarios — Lists all system users (ADMIN only). */
  @Get()
  async findAll() {
    return this.usuariosService.findAll();
  }

  /** GET /api/usuarios/:id — Fetches one user profile (ADMIN only). */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  /** POST /api/usuarios — Creates a new user account (ADMIN only). */
  @Post()
  async create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  /** PATCH /api/usuarios/:id — Updates user account or password (ADMIN only). */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usuariosService.update(id, dto, actor.id);
  }

  /** DELETE /api/usuarios/:id — Soft-deactivates user account (ADMIN only). */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usuariosService.deactivate(id, actor.id);
  }
}

