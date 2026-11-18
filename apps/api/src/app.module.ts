import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { MediaModule } from './media/media.module';
import { RenderingModule } from './rendering/rendering.module';
import { AiModule } from './ai/ai.module';
import { EditorModule } from './editor/editor.module';
import { BillingModule } from './billing/billing.module';
import { TemplatesModule } from './templates/templates.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')],
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rawPath = configService.get<string>('LOCAL_STORAGE_PATH') || './storage';
        return [
          {
            rootPath: path.resolve(process.cwd(), rawPath),
            serveRoot: '/storage',
            serveStaticOptions: {
              index: false,
              setHeaders: (res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
              },
            },
          },
        ];
      },
    }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    MediaModule,
    RenderingModule,
    AiModule,
    EditorModule,
    BillingModule,
    TemplatesModule,
    AdminModule,
  ],
})
export class AppModule {}

