// src/app/services/webrtc.service.ts
import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { BehaviorSubject, Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WebrtcService {

    private peer: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private currentTarget: string | null = null;

    private incomingCallSubject = new Subject<{ from: string; isVideo: boolean }>();
    private localStreamSubject = new BehaviorSubject<MediaStream | null>(null);
    private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);
    private callEndedSubject = new Subject<void>();

    private pendingRemoteCandidates: RTCIceCandidateInit[] = [];
    private remoteDescSet = false;

    constructor(private socketService: SocketService) {
        const socket = this.socketService.socket;

        socket.on('incoming-call', ({ fromUserId, isVideo }: any) => {
            this.incomingCallSubject.next({ from: fromUserId, isVideo: !!isVideo });
        });

        socket.on('webrtc:call-accepted', async ({ fromUserId }: any) => {
            try {
                this.currentTarget = fromUserId;

                await this.ensureLocalMedia();
                await this.ensurePeerConnection();
                this.attachLocalTracks();

                const offer = await this.peer!.createOffer();
                await this.peer!.setLocalDescription(offer);

                this.socketService.socket.emit('webrtc:offer', {
                    toUserId: fromUserId,
                    sdp: offer
                });

            } catch (err) {
            }
        });

        // CALLEE recibe offer
        socket.on('webrtc:offer', async ({ fromUserId, sdp }: any) => {
            try {
                this.currentTarget = fromUserId;

                await this.ensurePeerConnection();
                await this.peer!.setRemoteDescription(new RTCSessionDescription(sdp));
                this.remoteDescSet = true;

                for (const c of this.pendingRemoteCandidates) {
                    try {
                        await this.peer!.addIceCandidate(new RTCIceCandidate(c));
                    } catch (e) {
                    }
                }
                this.pendingRemoteCandidates = [];

                await this.ensureLocalMedia();
                this.attachLocalTracks();
                const answer = await this.peer!.createAnswer();
                await this.peer!.setLocalDescription(answer);

                this.socketService.socket.emit('webrtc:answer', {
                    toUserId: fromUserId,
                    sdp: answer
                });

            } catch (err) {

            }
        });

        socket.on('webrtc:answer', async ({ fromUserId, sdp }: any) => {
            try {
                await this.peer!.setRemoteDescription(new RTCSessionDescription(sdp));
                this.remoteDescSet = true;

                for (const c of this.pendingRemoteCandidates) {
                    try {
                        await this.peer!.addIceCandidate(new RTCIceCandidate(c));
                    } catch (e) {

                    }
                }
                this.pendingRemoteCandidates = [];

            } catch (err) {

            }
        });

        socket.on('webrtc:ice-candidate', async ({ fromUserId, candidate }: any) => {
            try {
                if (!candidate || !this.peer) return;

                if (!this.remoteDescSet) {
                    this.pendingRemoteCandidates.push(candidate);
                    return;
                }
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {

            }
        });

        socket.on('webrtc:end-call', (payload: any) => {
            this.cleanup();
            this.callEndedSubject.next();
        });
    }

    private async ensurePeerConnection(): Promise<void> {
        if (this.peer) {
            return;
        }

        this.peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        // ICE candidate handler
        this.peer.onicecandidate = (ev) => {
            if (ev.candidate && this.currentTarget) {
                this.socketService.socket.emit('webrtc:ice-candidate', {
                    toUserId: this.currentTarget,
                    candidate: ev.candidate
                });
            } else if (!ev.candidate) {

            }
        };

        // Track handler
        this.peer.ontrack = (ev: RTCTrackEvent) => {

            // Usar ev.streams[0] si está disponible
            if (ev.streams && ev.streams.length > 0) {
                const incomingStream = ev.streams[0];

                if (!this.remoteStream || this.remoteStream.id !== incomingStream.id) {
                    this.remoteStream = incomingStream;
                    this.remoteStreamSubject.next(this.remoteStream);
                } else {
                    // Verificar si hay tracks nuevos
                    const currentTrackIds = this.remoteStream.getTracks().map(t => t.id);
                    const incomingTrackIds = incomingStream.getTracks().map(t => t.id);

                    if (JSON.stringify(currentTrackIds.sort()) !== JSON.stringify(incomingTrackIds.sort())) {
                        this.remoteStream = incomingStream;
                        this.remoteStreamSubject.next(this.remoteStream);
                    }
                }
                return;
            }

            // Fallback: crear stream manualmente
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }

            if (!this.remoteStream.getTracks().some(t => t.id === ev.track.id)) {
                this.remoteStream.addTrack(ev.track);
                this.remoteStreamSubject.next(this.remoteStream);
            }
        };

        this.remoteDescSet = false;
    }

    private async ensureLocalMedia(): Promise<void> {
        if (this.localStream) {
            return;
        }

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            const tracks = this.localStream.getTracks();
            this.localStreamSubject.next(this.localStream);

        } catch (err) {
            throw err;
        }
    }

    private attachLocalTracks(): void {
        if (!this.peer || !this.localStream) {
            return;
        }

        const tracks = this.localStream.getTracks();

        tracks.forEach(track => {
            // Verificar si el track ya está agregado
            const existingSender = this.peer!.getSenders()
                .find(s => s.track?.id === track.id);

            if (existingSender) {
                return;
            }

            // Agregar track
            try {
                this.peer!.addTrack(track, this.localStream!);
            } catch (e) {

            }
        });
    }

    async callUser(targetUserId: string): Promise<void> {
        if (!targetUserId) {
            return;
        }
        this.currentTarget = targetUserId;
        await this.ensureLocalMedia();

        this.socketService.socket.emit('webrtc:call-user', {
            toUserId: targetUserId,
            isVideo: true
        });
    }

    async acceptCall(fromUserId: string): Promise<void> {
        if (!fromUserId) {
            return;
        }
        this.currentTarget = fromUserId;
        await this.ensureLocalMedia();

        this.socketService.socket.emit('webrtc:accept-call', {
            toUserId: fromUserId
        });
    }

    rejectCall(fromUserId: string): void {
        this.socketService.socket.emit('webrtc:end-call', {
            toUserId: fromUserId
        });
        this.cleanup();
    }

    endCall(): void {
        if (this.currentTarget) {
            this.socketService.socket.emit('webrtc:end-call', {
                toUserId: this.currentTarget
            });
        }
        this.cleanup();
        this.callEndedSubject.next();
    }

    private cleanup(): void {
        if (this.peer) {
            try {
                this.peer.onicecandidate = null;
                this.peer.ontrack = null;
                this.peer.onconnectionstatechange = null;
                this.peer.oniceconnectionstatechange = null;
                this.peer.close();
            } catch (e) {
            }
            this.peer = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(t => {
                try { t.stop(); } catch (e) { }
            });
            this.remoteStream = null;
            this.remoteStreamSubject.next(null);
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(t => {
                try { t.stop(); } catch (e) { }
            });
            this.localStream = null;
            this.localStreamSubject.next(null);
        }

        this.pendingRemoteCandidates = [];
        this.remoteDescSet = false;
        this.currentTarget = null;
    }

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    onIncomingCallDetailed(): Observable<{ from: string; isVideo: boolean }> {
        return this.incomingCallSubject.asObservable();
    }

    onLocalStream(): Observable<MediaStream | null> {
        return this.localStreamSubject.asObservable();
    }

    onRemoteStream(): Observable<MediaStream | null> {
        return this.remoteStreamSubject.asObservable();
    }

    onCallEnded(): Observable<void> {
        return this.callEndedSubject.asObservable();
    }

}