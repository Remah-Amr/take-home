import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/is-public.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private _usersService: UsersService) {}

  @Get()
  @Public()
  async findAll(@Query() filter) {
    return this._usersService.findAll(filter);
  }
}
