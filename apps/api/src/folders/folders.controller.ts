import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AuthUser } from '@id-daddy/shared';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { FoldersService } from './folders.service';

@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'STAFF', 'VIEWER')
  list(@CurrentUser() user: AuthUser) {
    return this.folders.list(user);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'STAFF')
  create(@CurrentUser() user: AuthUser, @Body() data: { name: string }) {
    return this.folders.create(user, data.name);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'STAFF')
  rename(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() data: { name: string }) {
    return this.folders.rename(user, id, data.name);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'STAFF')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.folders.delete(user, id);
  }
}
