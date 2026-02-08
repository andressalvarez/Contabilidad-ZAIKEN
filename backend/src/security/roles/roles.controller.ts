import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  CreateSecurityRoleDto,
  UpdateSecurityRoleDto,
  AssignPermissionsDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Action } from '../../casl/action.enum';
import { extractRequestContext } from '../../common/utils/request-context.util';

@Controller('security/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findAll(@Request() req) {
    return this.rolesService.findAll(req.user.negocioId);
  }

  @Get(':id')
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.rolesService.findOne(id, req.user.negocioId);
  }

  @Post()
  @Permissions({ action: Action.Create, subject: 'SecurityRole' })
  create(@Body() dto: CreateSecurityRoleDto, @Request() req) {
    return this.rolesService.create(req.user.negocioId, dto, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      ...extractRequestContext(req),
    });
  }

  @Patch(':id')
  @Permissions({ action: Action.Update, subject: 'SecurityRole' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSecurityRoleDto,
    @Request() req,
  ) {
    return this.rolesService.update(id, req.user.negocioId, dto, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      ...extractRequestContext(req),
    });
  }

  @Delete(':id')
  @Permissions({ action: Action.Delete, subject: 'SecurityRole' })
  delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.rolesService.delete(id, req.user.negocioId, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      ...extractRequestContext(req),
    });
  }

  @Put(':id/permissions')
  @Permissions({ action: Action.Update, subject: 'SecurityRole' })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @Request() req,
  ) {
    return this.rolesService.assignPermissions(id, req.user.negocioId, dto, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      ...extractRequestContext(req),
    });
  }

  @Get(':id/users')
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  getUsersForRole(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.rolesService.getUsersForRole(id, req.user.negocioId);
  }

  @Post(':id/users/:userId')
  @Permissions({ action: Action.Update, subject: 'SecurityRole' })
  assignRoleToUser(
    @Param('id', ParseIntPipe) roleId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.rolesService.assignRoleToUser(
      userId,
      roleId,
      req.user.negocioId,
      {
        actorUserId: req.user.userId,
        actorEmail: req.user.email,
        ...extractRequestContext(req),
      },
    );
  }
}
