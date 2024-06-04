import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { SignUpDto } from 'src/auth/dtos/sign-up.dto';
import { hashPassword } from 'src/common/utils/hash-password';
import { UsersSearchService } from 'src/search/services/users-search.service';
import { UsersRepo } from './repos/users.repo';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    private _usersRepo: UsersRepo,
    private _usersSearchService: UsersSearchService,
  ) {}

  async createUser(signUpDto: SignUpDto) {
    let user = await this._usersRepo.findOne({
      email: signUpDto.email,
    });

    if (!user) {
      if (signUpDto.password) {
        signUpDto.password = await hashPassword(signUpDto.password);
      }
      user = await this._usersRepo.create(signUpDto);
      await this._usersSearchService.indexUser(user);
    }

    const updateBody = {
      outlookId: signUpDto.outlookId,
      googleId: signUpDto.googleId,
      facebookId: signUpDto.facebookId,
    };
    user = await this.findOneAndUpdate({ email: signUpDto.email }, updateBody);
    await this._usersSearchService.updateUser(user);

    return user;
  }

  async findOne(filter: FilterQuery<User>) {
    const user = await this._usersRepo.findOne(filter);

    return user;
  }

  async findAll(filter: FilterQuery<User>) {
    const users = await this._usersRepo.find(filter);

    return users;
  }

  async findOneAndUpdate(query: FilterQuery<User>, body) {
    const user = await this._usersRepo.findOneAndUpdate(query, body);

    return user;
  }

  // @Cron('*/15 * * * *')
  // async handleCron() {
  //   const accessToken = await this.getAccessToken();
  //   console.log('🚀 ~ UsersService ~ handleCron ~ accessToken:', accessToken);
  // }
}
