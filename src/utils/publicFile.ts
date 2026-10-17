import { registerPlugin } from '@capacitor/core';

interface PublicFilePlugin {
  saveFile(options: {
    fileName: string;
    data: string;
    mimeType: string;
  }): Promise<{ uri: string; path: string }>;
  shareFile(options: { uri: string; mimeType: string; title?: string }): Promise<void>;
}

export const PublicFile = registerPlugin<PublicFilePlugin>('PublicFilePlugin');
