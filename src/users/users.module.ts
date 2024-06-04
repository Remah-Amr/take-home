import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModelNames } from 'src/common/constants';
import { SearchModule } from 'src/search/search.module';
import { UsersRepo } from './repos/users.repo';
import { userSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: DatabaseModelNames.USER_MODEL,
        useFactory: () => {
          const schema = userSchema;

          return schema;
        },
      },
    ]),
    SearchModule,
  ],
  providers: [UsersService, UsersRepo],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
