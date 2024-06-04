import { Injectable } from '@nestjs/common';
import {
  Document,
  FilterQuery,
  Model,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';

@Injectable()
export abstract class BaseRepo<Entity extends Document> {
  constructor(protected readonly _model: Model<Entity>) {}

  async create(data: Partial<Entity>): Promise<Entity> {
    const document = await this._model.create(data);

    return document;
  }

  async find(
    query: FilterQuery<Entity>,
    options?: QueryOptions,
  ): Promise<Entity[]> {
    const documents = await this._model.find(query, options);

    return documents;
  }

  async findOne(query: FilterQuery<Entity>, options?): Promise<Entity> {
    const document = await this._model.findOne(query, options);

    return document;
  }

  async findById(_id: string, options?): Promise<Entity> {
    const document = await this._model.findById(_id, options);

    return document;
  }

  async findOneAndUpdate(
    query: FilterQuery<Entity>,
    data: UpdateQuery<Entity>,
  ): Promise<Entity> {
    const document = await this._model.findOneAndUpdate(query, data, {
      new: true,
    });

    return document;
  }

  async findByIdAndUpdate(_id: string, data: UpdateQuery<Entity>) {
    const document = await this._model.findByIdAndUpdate(_id, data, {
      new: true,
    });

    return document;
  }
}
