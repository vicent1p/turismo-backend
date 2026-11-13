import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Rol } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateHotelDto,
  QueryHotelsDto,
  UpdateAvailabilityDto,
  UpdateHotelDto,
} from './dto/hotel.dto';
import { HotelesService, SerializedHotel } from './hoteles.service';

@Controller(['api/hoteles', 'api/establecimientos'])
export class HotelesController {
  constructor(private readonly hotelesService: HotelesService) {}

  /** GET /api/hoteles or /api/establecimientos — Public catalog. */
  @Get()
  @SkipThrottle()
  async findAll(@Query() query: QueryHotelsDto): Promise<SerializedHotel[]> {
    return this.hotelesService.findAll(query);
  }

  /** GET /api/hoteles/:id or /api/establecimientos/:id — Public single card detail. */
  @Get(':id')
  @SkipThrottle()
  async findOne(@Param('id') id: string): Promise<SerializedHotel> {
    return this.hotelesService.findOne(id);
  }

  /** POST /api/hoteles or /api/establecimientos — Create a card (ADMIN or GESTOR). */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async create(
    @Body() dto: CreateHotelDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SerializedHotel> {
    return this.hotelesService.create(dto, user.id);
  }

  /** PATCH /api/hoteles/:id — Full/partial update of card fields (ADMIN or GESTOR). */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHotelDto,
  ): Promise<SerializedHotel> {
    return this.hotelesService.update(id, dto);
  }

  /** PATCH /api/hoteles/:id/disponibilidad — Toggle card availability (ADMIN or GESTOR). */
  @Patch(':id/disponibilidad')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async updateDisponibilidad(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<SerializedHotel> {
    return this.hotelesService.updateDisponibilidad(id, dto.disponible);
  }

  /** DELETE /api/hoteles/:id — Soft-delete a card (ADMIN or GESTOR). */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async remove(@Param('id') id: string): Promise<{ deleted: true; id: string }> {
    return this.hotelesService.remove(id);
  }
}
