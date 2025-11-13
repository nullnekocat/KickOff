import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SelectedChat {
    id: string;
    name: string;
    email?: string;
    status?: number;
    type?: 'privado' | 'grupo';
    members?: any[];
}

@Injectable({ providedIn: 'root' })
export class ChatSelectionService {
    private selectedSubject = new BehaviorSubject<SelectedChat | null>(null);
    selected$ = this.selectedSubject.asObservable();

    setSelected(chat: SelectedChat | null) {
        console.log('📦 ChatSelectionService -> setSelected:', chat);
        this.selectedSubject.next(chat);
    }

    getSelected(): SelectedChat | null {
        return this.selectedSubject.value;
    }
}
