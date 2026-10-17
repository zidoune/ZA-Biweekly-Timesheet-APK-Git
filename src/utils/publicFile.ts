import { registerPlugin } from '@capacitor/core';

interface PublicFilePlugin {
  saveFile(options: {
    fileName: string;
    data: string;
    mimeType: string;
  }): Promise<{ uri: string; path: string }>;
}

export const PublicFile = registerPlugin<PublicFilePlugin>('PublicFilePlugin');
