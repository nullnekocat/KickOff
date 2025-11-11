import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';


export interface UploadResult {
    url: string;
    type: 'image' | 'video' | 'audio' | 'file';
    name: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.SUPABASE_URL,
            environment.SUPABASE_KEY
        );
    }

    async uploadFile(file: File): Promise<UploadResult | null> {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `${Date.now()}_${file.name}`;

        let type: UploadResult['type'] = 'file';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) type = 'image';
        else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) type = 'video';
        else if (['mp3', 'wav', 'ogg'].includes(ext)) type = 'audio';

        const { error } = await this.supabase.storage.from('kick').upload(path, file);

        if (error) {
            console.error('❌ Error subiendo archivo:', error.message);
            return null;
        }

        const { data } = this.supabase.storage.from('kick').getPublicUrl(path);
        return { url: data.publicUrl, type, name: file.name };
    }
}
