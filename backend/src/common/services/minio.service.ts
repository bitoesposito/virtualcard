import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MinioService implements OnModuleInit {
  private s3Client: S3Client;
  private bucket: string;
  private publicEndpoint: string;
  private internalEndpoint: string;

  constructor(private configService: ConfigService) {
    const minioEndpoint = this.configService.getOrThrow<string>('MINIO_ENDPOINT');
    const minioPort = this.configService.getOrThrow<string>('MINIO_PORT');
    const minioUser = this.configService.getOrThrow<string>('MINIO_ROOT_USER');
    const minioPassword = this.configService.getOrThrow<string>('MINIO_ROOT_PASSWORD');
    this.bucket = this.configService.getOrThrow<string>('MINIO_BUCKET_NAME');

    // Construct the full endpoint URL for internal communication
    // Remove any existing protocol from minioEndpoint
    const cleanEndpoint = minioEndpoint.replace(/^https?:\/\//, '');
    this.internalEndpoint = `http://${cleanEndpoint}`;

    // Get the public endpoint (for URLs returned to clients)
    this.publicEndpoint = this.configService.get<string>('MINIO_PUBLIC_ENDPOINT') || `http://localhost:${minioPort}`;

    // Create two S3 clients: one for internal operations and one for generating signed URLs
    this.s3Client = new S3Client({
      endpoint: this.internalEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: minioUser,
        secretAccessKey: minioPassword,
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.createBucketIfNotExists();
    await this.setPublicBucketPolicy();
  }

  private async createBucketIfNotExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  private async setPublicBucketPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };

    try {
      await this.s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify(policy),
        })
      );
    } catch (error) {
      console.error('Failed to set bucket policy:', error);
    }
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    return await this.getFileUrl(key);
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      // Create a new S3 client with the public endpoint for generating signed URLs
      const publicS3Client = new S3Client({
        endpoint: this.publicEndpoint,
        region: 'us-east-1',
        credentials: {
          accessKeyId: this.configService.getOrThrow<string>('MINIO_ROOT_USER'),
          secretAccessKey: this.configService.getOrThrow<string>('MINIO_ROOT_PASSWORD'),
        },
        forcePathStyle: true,
      });

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      // Generate the signed URL using the public endpoint client
      return await getSignedUrl(publicS3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate file URL');
    }
  }
}
