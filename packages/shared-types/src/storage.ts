export interface StorageFile {
  key: string;
  filename: string;
  size: number;
  mimeType: string;
  path: string;
  url: string;
  checksum?: string;
}

export interface StorageProvider {
  /**
   * Save a file buffer or stream to the storage provider
   */
  upload(
    key: string,
    data: Uint8Array | any,
    options?: { mimeType?: string; isPublic?: boolean }
  ): Promise<StorageFile>;

  /**
   * Read file stream from storage
   */
  getStream(key: string): Promise<any>;

  /**
   * Read entire file buffer into memory
   */
  getBuffer(key: string): Promise<Uint8Array | any>;

  /**
   * Generate an accessible URL for the stored resource
   */
  getUrl(key: string): Promise<string>;

  /**
   * Delete a stored object
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if file exists in storage
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get physical file path (useful for FFmpeg CLI processing in local driver)
   */
  getLocalPath(key: string): string;
}
