import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Action } from '../../casl/action.enum';

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

  @Get('subject/:subject')
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findBySubject(@Param('subject') subject: string) {
    return this.permissionsService.findBySubject(subject);
  }

  @Get('my-permissions')
  getMyPermissions(@Request() req) {
    return this.permissionsService.getPermissionsForUser(req.user.id);
  }
}
