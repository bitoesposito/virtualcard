import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from '../services/minio.service';

@Module({
  imports: [ConfigModule],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
