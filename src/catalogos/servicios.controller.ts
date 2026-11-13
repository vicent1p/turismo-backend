import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogosService } from './catalogos.service';
import { CreateServicioDto } from './dto/catalogo.dto';

@Controller('api/servicios')
export class ServiciosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  /** GET /api/servicios — Public list of amenities/services. */
  @Get()
  async findAll() {
    return this.catalogosService.findAllServicios();
  }

  /** POST /api/servicios — Add an amenity (ADMIN or GESTOR). */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async create(@Body() dto: CreateServicioDto) {
    return this.catalogosService.createServicio(dto);
  }

  /** DELETE /api/servicios/:id — Remove an amenity (ADMIN only). */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  async remove(@Param('id') id: string) {
    return this.catalogosService.removeServicio(id);
  }
}

