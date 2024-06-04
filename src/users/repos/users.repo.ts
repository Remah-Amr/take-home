import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseModelNames } from 'src/common/constants';
import { BaseRepo } from 'src/common/utils/base.repo';
import { UserDocument } from '../schemas/user.schema';

export class UsersRepo extends BaseRepo<UserDocument> {
  constructor(
    @InjectModel(DatabaseModelNames.USER_MODEL)
    private _usersModel: Model<UserDocument>,
  ) {
    super(_usersModel);
  }
}
