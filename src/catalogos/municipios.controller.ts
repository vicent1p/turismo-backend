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
import { SkipThrottle } from '@nestjs/throttler';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogosService } from './catalogos.service';
import { CreateMunicipioDto, UpdateMunicipioDto } from './dto/catalogo.dto';

@Controller('api/municipios')
export class MunicipiosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  /** GET /api/municipios — Public directory of Magdalena municipalities. */
  @Get()
  @SkipThrottle()
  async findAll() {
    return this.catalogosService.findAllMunicipios();
  }

  /** GET /api/municipios/:id — Single municipality details. */
  @Get(':id')
  @SkipThrottle()
  async findOne(@Param('id') id: string) {
    return this.catalogosService.findOneMunicipio(id);
  }

  /** POST /api/municipios — Add a municipality (ADMIN or GESTOR). */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async create(@Body() dto: CreateMunicipioDto) {
    return this.catalogosService.createMunicipio(dto);
  }

  /** PATCH /api/municipios/:id — Rename or edit municipality metadata (ADMIN or GESTOR). */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async update(@Param('id') id: string, @Body() dto: UpdateMunicipioDto) {
    return this.catalogosService.updateMunicipio(id, dto);
  }

  /** DELETE /api/municipios/:id — Delete an unused municipality (ADMIN only). */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  async remove(@Param('id') id: string) {
    return this.catalogosService.removeMunicipio(id);
  }
}

