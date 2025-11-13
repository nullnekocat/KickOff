import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GroupService {
    private apiUrl = 'http://localhost:3000/api/groups';

    constructor(private http: HttpClient) { }

    createGroup(name: string, members: string[]): Observable<any> {
        return this.http.post(this.apiUrl, { name, members }, { withCredentials: true });
    }

    getMyGroups(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl, { withCredentials: true });
    }
}
