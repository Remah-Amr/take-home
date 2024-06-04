import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { MessagesSearchService } from './services/messages-search.service';
import { UsersSearchService } from './services/users-search.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE', { infer: true }),
        auth: {
          apiKey: configService.get('ELASTICSEARCH_API_KEY', { infer: true }),
        },
      }),
    }),
  ],
  providers: [UsersSearchService, MessagesSearchService],
  exports: [ElasticsearchModule, UsersSearchService, MessagesSearchService],
})
export class SearchModule {}
