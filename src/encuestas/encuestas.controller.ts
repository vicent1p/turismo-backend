import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateEncuestaDto,
  ResponderEncuestaDto,
  UpdateEncuestaDto,
} from './dto/encuesta.dto';
import { EncuestasService } from './encuestas.service';

@Controller('api/encuestas')
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

  /**
   * GET /api/encuestas/landing/activa
   * Public: returns active survey configured for the public landing page.
   */
  @Get('landing/activa')
  async findLandingActiva() {
    return this.encuestasService.findLandingActiva();
  }

  /**
   * POST /api/encuestas/:id/respuestas
   * Public: receives responses from visitors/tourists.
   */
  @Post(':id/respuestas')
  async responder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResponderEncuestaDto,
  ) {
    return this.encuestasService.responder(id, dto);
  }

  /**
   * GET /api/encuestas
   * Gestor/Admin: lists all surveys.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async findAll() {
    return this.encuestasService.findAll();
  }

  /**
   * GET /api/encuestas/:id/resultados
   * Gestor/Admin: views response statistics and aggregated metrics.
   */
  @Get(':id/resultados')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async obtenerResultados(@Param('id', ParseIntPipe) id: number) {
    return this.encuestasService.obtenerResultados(id);
  }

  /**
   * GET /api/encuestas/:id
   * Gestor/Admin: full survey detail for editing.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.encuestasService.findOne(id);
  }

  /**
   * POST /api/encuestas
   * Gestor/Admin: creates a new survey.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async create(@Body() dto: CreateEncuestaDto) {
    return this.encuestasService.create(dto);
  }

  /**
   * PATCH /api/encuestas/:id
   * Gestor/Admin: updates survey details or questions.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEncuestaDto,
  ) {
    return this.encuestasService.update(id, dto);
  }

  /**
   * DELETE /api/encuestas/:id
   * Gestor/Admin: deletes a survey.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.GESTOR)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.encuestasService.remove(id);
  }
}

