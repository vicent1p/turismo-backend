import { Controller, Get, UseGuards } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { ResumenResponseDto } from './dto/resumen.dto';
import { GraficasResponseDto } from './dto/graficas.dto';
import { MapaHotelDto } from './dto/mapa.dto';
import { ListasResponseDto } from './dto/listas.dto';

@Controller(['dashboard', 'api/dashboard'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN, Rol.GESTOR)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/resumen
   * Conteo total, disponibles, no disponibles, distribución por municipio.
   * Solo incluye el desglose de usuarios si el usuario tiene rol ADMIN.
   */
  @Get('resumen')
  async getResumen(@CurrentUser() user: AuthenticatedUser): Promise<ResumenResponseDto> {
    return this.dashboardService.getResumen(user.rol);
  }

  /**
   * GET /dashboard/graficas
   * Datos estructurados para dona de disponibilidad, barras por estrellas (1 a 5)
   * y barras por municipio.
   */
  @Get('graficas')
  async getGraficas(): Promise<GraficasResponseDto> {
    return this.dashboardService.getGraficas();
  }

  /**
   * GET /dashboard/mapa
   * Hoteles con coordenadas geográficas para renderizado de marcadores Leaflet.
   */
  @Get('mapa')
  async getMapa(): Promise<MapaHotelDto[]> {
    return this.dashboardService.getMapa();
  }

  /**
   * GET /dashboard/listas
   * Listas rápidas de auditoría: últimos 5 modificados, hoteles incompletos y
   * hoteles sin actualizar en más de 30 días.
   */
  @Get('listas')
  async getListas(): Promise<ListasResponseDto> {
    return this.dashboardService.getListas();
  }
}
