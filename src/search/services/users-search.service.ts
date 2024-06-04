import { Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticsearchResult } from 'src/search/interfaces/elasticsearch-result.interface';
import { User } from 'src/users/schemas/user.schema';

export type UsersSearchResult = ElasticsearchResult<User>;
@Injectable()
export class UsersSearchService implements OnModuleInit {
  private readonly index = 'users';

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
        name: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        email: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        googleId: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        facebookId: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        outlookId: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256,
            },
          },
        },
        createdAt: {
          type: 'date',
        },
        updatedAt: {
          type: 'date',
        },
      },
    };
  }

  // private get settings() {
  //   return {
  //     analysis: {
  //       analyzer: {
  //         ngram_analyzer: {
  //           tokenizer: 'ngram_tokenizer',
  //           filter: ['lowercase'],
  //         },
  //         phone_analyzer: {
  //           tokenizer: 'phone_tokenizer',
  //         },
  //       },

  //       tokenizer: {
  //         ngram_tokenizer: {
  //           type: 'ngram',
  //           min_gram: 1,
  //           max_gram: 8,
  //           token_chars: [
  //             'symbol',
  //             'private_use',
  //             'paragraph_separator',
  //             'start_punctuation',
  //             'unassigned',
  //             'enclosing_mark',
  //             'connector_punctuation',
  //             'letter_number',
  //             'other_number',
  //             'math_symbol',
  //             'lowercase_letter',
  //             'surrogate',
  //             'initial_quote_punctuation',
  //             'decimal_digit_number',
  //             'digit',
  //             'other_punctuation',
  //             'dash_punctuation',
  //             'currency_symbol',
  //             'non_spacing_mark',
  //             'format',
  //             'modifier_letter',
  //             'control',
  //             'uppercase_letter',
  //             'other_symbol',
  //             'end_punctuation',
  //             'modifier_symbol',
  //             'other_letter',
  //             'line_separator',
  //             'titlecase_letter',
  //             'letter',
  //             'punctuation',
  //             'combining_spacing_mark',
  //             'final_quote_punctuation',
  //           ],
  //         },
  //         phone_tokenizer: {
  //           type: 'ngram',
  //           min_gram: 3,
  //           max_gram: 8,
  //           token_chars: [
  //             'symbol',
  //             'private_use',
  //             'paragraph_separator',
  //             'start_punctuation',
  //             'unassigned',
  //             'enclosing_mark',
  //             'connector_punctuation',
  //             'letter_number',
  //             'other_number',
  //             'math_symbol',
  //             'lowercase_letter',
  //             'surrogate',
  //             'initial_quote_punctuation',
  //             'decimal_digit_number',
  //             'digit',
  //             'other_punctuation',
  //             'dash_punctuation',
  //             'currency_symbol',
  //             'non_spacing_mark',
  //             'format',
  //             'modifier_letter',
  //             'control',
  //             'uppercase_letter',
  //             'other_symbol',
  //             'end_punctuation',
  //             'modifier_symbol',
  //             'other_letter',
  //             'line_separator',
  //             'titlecase_letter',
  //             'letter',
  //             'punctuation',
  //             'combining_spacing_mark',
  //             'final_quote_punctuation',
  //           ],
  //         },
  //       },
  //     },

  //     'index.max_ngram_diff': 50,
  //   };
  // }

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

    // await this.elasticsearchService.indices.putSettings({
    //   index: this.index,
    //   body: this.settings,
    // });

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

  async indexUser(user: User) {
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      facebookId: user.facebookId,
      outlookId: user.outlookId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const indexedUser = await this.elasticsearchService.index({
      id: user._id.toString(),
      index: this.index,
      body: userData,
    });

    return indexedUser;
  }

  async updateUser(user: User) {
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      facebookId: user.facebookId,
      outlookId: user.outlookId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    await this.elasticsearchService.update({
      index: this.index,
      id: user._id.toString(),
      body: {
        doc: userData,
      },
      retry_on_conflict: 6,
    });
  }
}
