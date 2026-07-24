import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoadGroup } from '../models/RoadGroup';

@Injectable({ providedIn: 'root' })
export class RoadGroupService {
  constructor(private readonly http: HttpClient) {}

  /** Configured road groups, used to label and filter tolls in the trips list. */
  getRoadGroups(): Observable<RoadGroup[]> {
    return this.http.get<RoadGroup[]>('/api/road-groups');
  }
}
