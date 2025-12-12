import { Module, Global } from '@nestjs/common';
import { ContentstackService } from './contentstack.service';

@Global()
@Module({
  providers: [ContentstackService],
  exports: [ContentstackService],
})
export class ContentstackModule {}

