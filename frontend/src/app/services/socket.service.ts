import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { EncryptionService } from './encryption.service';
import { Subject } from 'rxjs';

export interface ChatMessage {
    roomId: string;
    senderId: string;
    senderName: string;
    text: string;
    iv?: string;
    isEncrypted: boolean;
    createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
    private socket!: Socket;
    public socketId: string | undefined = '';
    private publicKeys: Record<string, string> = {}; // { userId: publicKeyBase64 }
    public localMessage$ = new Subject<ChatMessage>();

    constructor(private encryptionService: EncryptionService) {
        this.socket = io('http://localhost:3000', { withCredentials: true });

        this.socket.on('connect', () => {
            this.socketId = this.socket.id;
            console.log('✅ Socket conectado:', this.socketId);
        });

        this.setupRoomKeyHandlers();

        this.socket.on('userPublicKey', ({ userId, publicKey }) => {
            this.publicKeys[userId] = publicKey;
            console.log(`📥 Clave pública recibida de ${userId}`);
        });

        this.socket.on('roomPublicKeys', (keys) => {
            for (const { userId, publicKey } of keys) {
                this.publicKeys[userId] = publicKey;
            }
            console.log('📦 Claves públicas del room recibidas:', this.publicKeys);
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket desconectado:', reason);
        });
    }

    // ---------------- Utilidades de conversión ---------------- //
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }

    // ---------------- Public keys & room join ---------------- //
    sendPublicKey(userId: string) {
        const publicKey = this.encryptionService.getPublicKey();
        if (publicKey) {
            this.socket.emit('publicKey', { userId, publicKey });
        } else {
            console.warn('⚠️ No se encontró la clave pública local.');
        }
    }

    getPublicKey(userId: string): string | undefined {
        return this.publicKeys[userId];
    }

    joinRoom(roomId: string) {
        this.socket.emit('joinRoom', { roomId });
        console.log('📤 Uniendo al room:', roomId);
    }

    // ---------------- AES room-key management ---------------- //
    async generateAndStoreRoomKey(roomId: string): Promise<string> {
        const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
        const raw = await crypto.subtle.exportKey('raw', key);
        const b64 = this.arrayBufferToBase64(raw);
        localStorage.setItem(`roomKey_${roomId}`, b64);
        return b64;
    }

    getStoredRoomKeyBase64(roomId: string): string | null {
        return localStorage.getItem(`roomKey_${roomId}`);
    }

    async importRoomKeyFromBase64(base64: string): Promise<CryptoKey> {
        const raw = this.base64ToArrayBuffer(base64);
        return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    }

    // AES helpers (iv+ciphertext separate)
    private async aesEncryptWithIvBase64(roomKeyBase64: string, plain: string): Promise<{ ciphertextBase64: string; ivBase64: string; }> {
        const key = await this.importRoomKeyFromBase64(roomKeyBase64);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit
        const encoded = new TextEncoder().encode(plain);
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
        const ciphertextBase64 = this.arrayBufferToBase64(ct);
        const ivBase64 = this.arrayBufferToBase64(iv.buffer); // note .buffer
        return { ciphertextBase64, ivBase64 };
    }

    async aesDecryptBase64(roomKeyBase64: string, ciphertextBase64: string, ivBase64: string): Promise<string> {
        const key = await this.importRoomKeyFromBase64(roomKeyBase64);
        const iv = new Uint8Array(this.base64ToArrayBuffer(ivBase64));
        const ct = this.base64ToArrayBuffer(ciphertextBase64);
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        return new TextDecoder().decode(plainBuf);
    }

    // ---------------- Room key exchange (RSA to share AES key) ---------------- //
    // helpers para esperar (simple polling/timeout)
    private waitForPublicKey(userId: string, timeout = 7000): Promise<string | null> {
        return new Promise(resolve => {
            const existing = this.getPublicKey(userId);
            if (existing) return resolve(existing);
            const start = Date.now();
            const iv = setInterval(() => {
                const p = this.getPublicKey(userId);
                if (p) { clearInterval(iv); resolve(p); }
                else if (Date.now() - start > timeout) { clearInterval(iv); resolve(null); }
            }, 200);
        });
    }

    private waitForRoomKeyAck(roomId: string, toUserId: string, timeout = 8000): Promise<boolean> {
        return new Promise(resolve => {
            const handler = ({ roomId: r, fromUserId }: any) => {
                if (r === roomId && fromUserId === toUserId) {
                    this.socket.off('roomKeyAck', handler);
                    resolve(true);
                }
            };
            this.socket.on('roomKeyAck', handler);
            setTimeout(() => { this.socket.off('roomKeyAck', handler); resolve(false); }, timeout);
        });
    }

    // ensureRoomKey: genera y ofrece (si corresponde) y espera ack
    async ensureRoomKey(roomId: string, myUserId: string, otherUserId: string) {
        const existing = this.getStoredRoomKeyBase64(roomId);
        if (existing) return;

        // publicar mi clave pública en caso de que el otro la necesite
        const myPub = this.encryptionService.getPublicKey();
        if (myPub) this.socket.emit('publicKey', { userId: myUserId, publicKey: myPub });

        // esperar por la publicKey del peer
        const recipientPub = await this.waitForPublicKey(otherUserId, 7000);
        if (!recipientPub) {
            console.warn('⚠️ No public key del receptor; reintentando en 2s...');
            setTimeout(() => this.ensureRoomKey(roomId, myUserId, otherUserId), 2000);
            return;
        }

        // determinista: menor userId genera y ofrece la roomKey
        if (myUserId < otherUserId) {
            const roomKeyB64 = await this.generateAndStoreRoomKey(roomId);
            try {
                const pubBuf = this.base64ToArrayBuffer(recipientPub);
                const pubKey = await crypto.subtle.importKey('spki', pubBuf, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
                const encoded = new TextEncoder().encode(roomKeyB64);
                const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pubKey, encoded);
                const encryptedB64 = this.arrayBufferToBase64(encrypted);

                this.socket.emit('roomKeyOffer', { roomId, toUserId: otherUserId, encryptedRoomKey: encryptedB64 });
                console.log('📤 roomKeyOffer enviada a', otherUserId);

                const ok = await this.waitForRoomKeyAck(roomId, otherUserId, 8000);
                if (!ok) console.warn('⚠️ No se recibió ack de roomKey del peer; puede que no la tenga aún');
                else console.log('✅ roomKey acknowledged por', otherUserId);
            } catch (err) {
                console.error('❌ Error al cifrar/enviar roomKey:', err);
            }
        } else {
            console.log('⏳ Esperando oferta de roomKey del peer');
        }
    }

    private setupRoomKeyHandlers() {
        // cuando me ofrecen la roomKey (persistente o en vivo)
        this.socket.on('roomKeyOffered', async ({ roomId, fromUserId, encryptedRoomKey }) => {
            try {
                const privateKeyBase64 = this.encryptionService.getPrivateKey();
                if (!privateKeyBase64) { console.error('❌ No private key'); return; }
                const privBuf = this.base64ToArrayBuffer(privateKeyBase64);
                const privKey = await crypto.subtle.importKey('pkcs8', privBuf, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
                const encryptedBuf = this.base64ToArrayBuffer(encryptedRoomKey);
                const decryptedBuf = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privKey, encryptedBuf);
                const roomKeyB64 = new TextDecoder().decode(decryptedBuf);

                localStorage.setItem(`roomKey_${roomId}`, roomKeyB64);
                console.log('🔐 roomKey recibida y guardada para', roomId);

                // ack
                this.socket.emit('roomKeyAck', { roomId, toUserId: fromUserId });
            } catch (err) {
                console.error('❌ Error al procesar roomKeyOffered:', err);
            }
        });

        this.socket.on('roomKeyAck', ({ roomId, fromUserId }) => {
            console.log('✅ roomKey acknowledged by', fromUserId, 'for', roomId);
        });
    }

    // ---------------- Messaging (AES only for messages) ---------------- //
    async sendMessage(roomId: string, text: string, isEncrypted: boolean = false): Promise<void> {
        if (!roomId || !text.trim()) return;

        let payload: any = { roomId, text, isEncrypted: false };

        if (isEncrypted) {
            const roomKeyB64 = this.getStoredRoomKeyBase64(roomId);
            if (!roomKeyB64) {
                console.warn('⚠️ No se encontró la roomKey para', roomId);
                return;
            }

            try {
                const { ciphertextBase64, ivBase64 } = await this.aesEncryptWithIvBase64(roomKeyB64, text);
                payload = { roomId, text: ciphertextBase64, iv: ivBase64, isEncrypted: true };
                console.log('🔐 Mensaje cifrado con AES listo para enviar');
            } catch (err) {
                console.error('❌ Error al cifrar con AES:', err);
                return;
            }
        }

        this.socket.emit('message', payload);

        // Se muestra el mensaje local sin encriptar
        const localMsg: ChatMessage = {
            roomId,
            senderId: localStorage.getItem('currentUserId') || '',
            senderName: 'Tú',
            text,
            iv: payload.iv,
            isEncrypted
        };
        this.localMessage$.next(localMsg);
    }

    //Receptor desencripta AES si corresponde
    onMessage(callback: (message: ChatMessage) => void): void {
        this.socket.on('message', async (msg: ChatMessage) => {
            try {
                const currentUserId = localStorage.getItem('currentUserId');

                // si no está cifrado o es mi propio mensaje lo mostramos tal cual
                if (!msg.isEncrypted || msg.senderId === currentUserId) {
                    callback(msg);
                    return;
                }

                // desencriptar con roomKey
                const roomKeyB64 = this.getStoredRoomKeyBase64(msg.roomId);
                if (!roomKeyB64) {
                    console.warn('⚠️ No roomKey local para desencriptar');
                    msg.text = '[Mensaje encriptado]';
                    callback(msg);
                    return;
                }

                const decrypted = await this.aesDecryptBase64(roomKeyB64, msg.text, msg.iv || '');
                msg.text = decrypted;
                callback(msg);
            } catch (err) {
                console.error('❌ Error al desencriptar mensaje:', err);
                msg.text = '[Mensaje encriptado]';
                callback(msg);
            }
        });
    }

    onUserStatusChange(callback: (data: { userId: string, status: number }) => void): void {
        this.socket.on('userStatus', callback);
    }
}
