import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlideService {

  // URL to Web Server
  private slidesUrl = 'https://localhost:8080/api/slides/';
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  // REST APIs: GET, POST, PUT, DELETE
  constructor(private http: HttpClient) { }

  // POST: create a new slide to the server
  createSlide(image: File): Observable<any> {
    const url = this.slidesUrl + 'create';
    let formData = new FormData();
    formData.append('image', image);
    return this.http.post(url, formData).pipe(
      tap(msg => console.log('createSlide successed: ' + msg)),
      catchError(this.handleError<any>('createSlide'))
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   *
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(operation + ' failed: ' + error.message);
      return of(result as T);
    }
  }

}
