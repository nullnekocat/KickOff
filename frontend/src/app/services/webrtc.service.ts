import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class WebRTCService {
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private currentRoomId: string | null = null;
    private isVideoCall = false;

    private onRemoteStreamCallback?: (stream: MediaStream) => void;
    private onIncomingCallCallback?: (isVideo: boolean) => void;
    private onCallEndedCallback?: () => void;
    private onIncomingCallDetailedCallback?: (data: { from: string; sdp: RTCSessionDescriptionInit; isVideo: boolean }) => void;
    private pendingIncomingCall?: { from: string; sdp: RTCSessionDescriptionInit; isVideo: boolean };

    constructor(private socketService: SocketService) {
        this.setupSignalingListeners();
    }

    // Escucha las señales entrantes (oferta, respuesta, ice, finalización)
    private setupSignalingListeners() {
        this.socketService.on('webrtc:offer', async ({ roomId, sdp, isVideo, from }) => {
            console.log('📞 Oferta recibida de', from, 'para room', roomId);
            this.isVideoCall = isVideo;
            this.currentRoomId = roomId;
            this.pendingIncomingCall = { from, sdp, isVideo };
            if (this.onIncomingCallDetailedCallback) {
                this.onIncomingCallDetailedCallback({ from, sdp, isVideo });
            } else if (this.onIncomingCallCallback) {
                this.onIncomingCallCallback(isVideo);
            }
        });

        this.socketService.on('webrtc:answer', async ({ sdp }) => {
            if (!this.peerConnection) return;
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        this.socketService.on('webrtc:ice-candidate', async ({ candidate }) => {
            try {
                if (this.peerConnection)
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('Error añadiendo candidato ICE:', err);
            }
        });

        this.socketService.on('webrtc:end-call', () => this.endCall(false));
    }

    private pendingOffer: any = null;

    // Llamada saliente
    async startCall(roomId: string, isVideo: boolean) {
        this.isVideoCall = isVideo;
        this.currentRoomId = roomId;

        await this.createPeerConnection();

        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: isVideo,
            audio: true
        });

        this.localStream.getTracks().forEach(track =>
            this.peerConnection!.addTrack(track, this.localStream!)
        );

        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);

        //DebugLog
        console.log('🔊 [client] Emitiendo webrtc:offer ->', { roomId, isVideo, sdp: offer ? { type: offer.type, sdp: offer.sdp?.slice?.(0,100)+'...' } : null });
        this.socketService.emit('webrtc:offer', { roomId, sdp: offer, isVideo });
        return this.localStream;
    }

    // Llamada entrante aceptada
    async acceptCall() {
        if (!this.currentRoomId || !this.pendingOffer) return;

        await this.createPeerConnection();

        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: this.isVideoCall,
            audio: true
        });

        this.localStream.getTracks().forEach(track =>
            this.peerConnection!.addTrack(track, this.localStream!)
        );

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(this.pendingOffer));
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        this.socketService.emit('webrtc:answer', {
            roomId: this.currentRoomId,
            sdp: answer
        });

        this.pendingOffer = null;
        return this.localStream;
    }

    private async createPeerConnection() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
        });

        this.remoteStream = new MediaStream();

        this.peerConnection.ontrack = event => {
            event.streams[0].getTracks().forEach(track =>
                this.remoteStream!.addTrack(track)
            );
            if (this.onRemoteStreamCallback) this.onRemoteStreamCallback(this.remoteStream!);
        };

        this.peerConnection.onicecandidate = event => {
            if (event.candidate && this.currentRoomId) {
                this.socketService.emit('webrtc:ice-candidate', {
                    roomId: this.currentRoomId,
                    candidate: event.candidate
                });
            }
        };
    }

    // Callbacks
    onRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
    }

    onIncomingCall(callback: (isVideo: boolean) => void) {
        this.onIncomingCallCallback = callback;
    }

    onIncomingCallDetailed(callback: (data: { from: string; sdp: RTCSessionDescriptionInit; isVideo: boolean }) => void) {
        this.onIncomingCallDetailedCallback = callback;
    }

    async acceptIncomingCall(roomId: string) {
        if (!this.pendingIncomingCall) return null;

        const { sdp, isVideo } = this.pendingIncomingCall;
        this.pendingIncomingCall = undefined;
        this.isVideoCall = isVideo;
        this.currentRoomId = roomId;

        await this.createPeerConnection();

        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: isVideo,
            audio: true
        });

        this.localStream.getTracks().forEach(track =>
            this.peerConnection!.addTrack(track, this.localStream!)
        );

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        //DebugLog
        console.log('🔊 [client] Emitiendo webrtc:answer ->', { roomId: this.currentRoomId });
        this.socketService.emit('webrtc:answer', { roomId, sdp: answer });

        console.log('✅ Llamada entrante aceptada.');
        return this.localStream;
    }

    rejectIncomingCall() {
        console.log('🚫 Llamada rechazada.');
        this.pendingIncomingCall = undefined;
        if (this.currentRoomId) {
            this.socketService.emit('webrtc:end-call', { roomId: this.currentRoomId });
        }
    }

    onCallEnded(callback: () => void) {
        this.onCallEndedCallback = callback;
    }

    // Finalizar llamada
    endCall(emitSignal = true) {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.localStream?.getTracks().forEach(t => t.stop());
        this.remoteStream?.getTracks().forEach(t => t.stop());
        this.localStream = null;
        this.remoteStream = null;

        if (emitSignal && this.currentRoomId) {
            this.socketService.emit('webrtc:end-call', { roomId: this.currentRoomId });
        }

        if (this.onCallEndedCallback) this.onCallEndedCallback();

        this.currentRoomId = null;
        this.pendingOffer = null;
    }
}
