import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Action } from '../../casl/action.enum';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { extractRequestContext } from '../../common/utils/request-context.util';

@Controller('security/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('categories')
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  getCategories() {
    return this.permissionsService.getCategories();
  }

  @Get('category/:category')
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findByCategory(@Param('category') category: string) {
    return this.permissionsService.findByCategory(category);
  }

  @Get('by-category')
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findByCategoryGrouped() {
    return this.permissionsService.findByCategoryGrouped();
  }

  @Get('subject/:subject')
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findBySubject(@Param('subject') subject: string) {
    return this.permissionsService.findBySubject(subject);
  }

  @Get('my-permissions')
  getMyPermissions(@Request() req) {
    return this.permissionsService.getPermissionsForUser(req.user.userId);
  }

  @Post()
  @Permissions({ action: Action.Create, subject: 'SecurityRole' })
  create(@Body() dto: CreatePermissionDto, @Request() req) {
    return this.permissionsService.create(dto, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      context: extractRequestContext(req),
    });
  }

  @Patch(':id')
  @Permissions({ action: Action.Update, subject: 'SecurityRole' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
    @Request() req,
  ) {
    return this.permissionsService.update(id, dto, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      context: extractRequestContext(req),
    });
  }

  @Delete(':id')
  @Permissions({ action: Action.Delete, subject: 'SecurityRole' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.permissionsService.remove(id, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      context: extractRequestContext(req),
    });
  }
}
