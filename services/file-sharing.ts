import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface SharedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  mimeType?: string;
}

class FileService {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  async pickDocument(): Promise<SharedFile | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        if (file.size && file.size > FileService.MAX_FILE_SIZE) {
          throw new Error('Arquivo muito grande (máximo 100MB)');
        }

        return {
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
          type: this.getFileType(file.name),
          mimeType: file.mimeType,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao selecionar arquivo:', error);
      throw error;
    }
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const typeMap: { [key: string]: string } = {
      pdf: 'document',
      doc: 'document',
      docx: 'document',
      txt: 'document',
      zip: 'archive',
      rar: 'archive',
      '7z': 'archive',
      mp3: 'audio',
      wav: 'audio',
      m4a: 'audio',
      mp4: 'video',
      avi: 'video',
      mov: 'video',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
    };

    return typeMap[extension || ''] || 'file';
  }

  getFileIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      document: 'description',
      archive: 'archive',
      audio: 'audiotrack',
      video: 'movie',
      image: 'image',
      file: 'insert-drive-file',
    };

    return iconMap[type] || 'insert-drive-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();