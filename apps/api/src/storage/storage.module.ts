import { Module, Global } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [LocalStorageProvider, StorageService],
  exports: [StorageService, LocalStorageProvider],
})
export class StorageModule {}

