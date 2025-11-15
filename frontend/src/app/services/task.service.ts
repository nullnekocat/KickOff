import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {

    private api = `${environment.apiUrl}/api/tasks`;

    constructor(private http: HttpClient) { }

    createTask(text: string, inChargeId: string, groupId: string) {
        return this.http.post(
            this.api,
            { text, inChargeId, groupId },
            { withCredentials: true }
        );
    }

    getTasks(groupId: string) {
        return this.http.get(
            `${this.api}/${groupId}`,
            { withCredentials: true }
        );
    }

    toggleCompleted(taskId: string) {
        return this.http.put(
            `${this.api}/${taskId}/toggle`,
            {},
            { withCredentials: true }
        );
    }

    deleteTask(taskId: string) {
        return this.http.delete(
            `${this.api}/${taskId}`,
            { withCredentials: true }
        );
    }

    hideTask(taskId: string, hidden: boolean) {
        return this.http.put(
            `${this.api}/${taskId}/hide`,
            { hidden },
            { withCredentials: true }
        );
    }

    getHiddenTasks(groupId: string) {
        return this.http.get(
            `${this.api}/${groupId}/hidden`,
            { withCredentials: true }
        );
    }

}