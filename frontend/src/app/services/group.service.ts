import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupService {
    private apiUrl = `${environment.apiUrl}/api/groups`;

    constructor(private http: HttpClient) { }

    createGroup(name: string, members: string[]): Observable<any> {
        return this.http.post(this.apiUrl, { name, members }, { withCredentials: true });
    }

    getMyGroups(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl, { withCredentials: true });
    }
}
