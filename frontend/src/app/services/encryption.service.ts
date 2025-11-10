import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EncryptionService {
    private readonly publicKeyKey = 'chat_publicKey';
    private readonly privateKeyKey = 'chat_privateKey';

    constructor() {}

    /** Genera un nuevo par de claves RSA y las guarda localmente */
    async generateAndStoreKeyPair(): Promise<void> {
        const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
        );

        // Exportar a formato binario
        const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

        // Guardar en localStorage en Base64
        localStorage.setItem(this.publicKeyKey, this.arrayBufferToBase64(publicKey));
        localStorage.setItem(this.privateKeyKey, this.arrayBufferToBase64(privateKey));

        console.log('🔑 Claves RSA generadas y guardadas en localStorage.');
    }

    // Devuelve la clave pública en Base64
    getPublicKey(): string | null {
        return localStorage.getItem(this.publicKeyKey);
    }

    // Devuelve la clave privada en Base64
    getPrivateKey(): string | null {
        return localStorage.getItem(this.privateKeyKey);
    }

    // Convierte ArrayBuffer a Base64
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Convierte base64 → ArrayBuffer
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
    }

    // Cifra un texto con la clave pública del receptor
    async encryptWithPublicKey(publicKeyBase64: string, text: string): Promise<string> {
    const keyBuffer = this.base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await crypto.subtle.importKey(
        'spki',
        keyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );

    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encoded);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }

    // Descifra un texto cifrado con nuestra clave privada
    async decryptWithPrivateKey(cipherBase64: string): Promise<string> {
    const privateKeyBase64 = this.getPrivateKey();
    if (!privateKeyBase64) throw new Error('No private key found');

    const keyBuffer = this.base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        keyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
    );

    const encrypted = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encrypted);
    return new TextDecoder().decode(decrypted);
    }

}
