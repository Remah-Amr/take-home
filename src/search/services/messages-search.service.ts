import { Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { IMessage } from '../interfaces/message.interface';

@Injectable()
export class MessagesSearchService implements OnModuleInit {
  private readonly index = 'messages';

  constructor(private elasticsearchService: ElasticsearchService) {}

  private get mappings() {
    return {
      properties: {
        id: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        subject: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        bodyPreview: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        isRead: {
          type: 'boolean',
        },
        from: {
          properties: {
            name: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            address: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
          },
        },
        to: {
          properties: {
            name: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
            address: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256,
                },
              },
            },
          },
        },
        createdDateTime: {
          type: 'date',
        },
        lastModifiedDateTime: {
          type: 'date',
        },
      },
    };
  }

  async onModuleInit() {
    // await this.elasticsearchService.indices.delete({ index: this.index });
    const { body: indexExists } =
      await this.elasticsearchService.indices.exists({
        index: this.index,
      });

    if (!indexExists) {
      await this.createIndex();
    }

    await this.elasticsearchService.indices.close({
      index: this.index,
    });

    await this.elasticsearchService.indices.putMapping({
      index: this.index,
      body: this.mappings,
    });

    await this.elasticsearchService.indices.open({
      index: this.index,
    });
  }

  async createIndex() {
    console.log('create index');

    await this.elasticsearchService.indices.create({
      index: this.index,
    });
  }

  async indexMessage(messages: IMessage[]) {
    // TODO: bulk insert
    for (const message of messages) {
      await this.elasticsearchService.index({
        id: message.id.toString(),
        index: this.index,
        body: message,
      });
    }

    return { status: 'success' };
  }

  async deleteMessage(messageId: string) {
    await this.elasticsearchService.delete({
      index: this.index,
      id: messageId.toString(),
    });
  }
}
