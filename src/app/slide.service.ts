import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Slide } from './slide';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlideService {

  // URL to Remote Web Server
  // private slidesUrl = 'https://rhinocyt.herokuapp.com';

  // URL to Local Web Server
  private slidesUrl = 'http://localhost:8080/api/slides/';

  // REST APIs: GET, POST, PUT, DELETE
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  // Use Http Requests
  constructor(private http: HttpClient, private _snackBar: MatSnackBar) { }

  // POST: Create a new Slide to the Server
  createSlide(image: File, id: string): void {
    const url = this.slidesUrl + 'create';
    let formData = new FormData();
    formData.append('image', image, id);
    this.http.post(url, formData).pipe(
      tap(_ => console.log('display snackbar')),
      catchError(this.handleError<any>('createSlide'))
    );
  }

  // DELETE: Delete the Slide from the Server
  deleteSlide(id: string): Observable<any> {
    const url = this.slidesUrl + 'delete?id=' + id;
    return this.http.delete(url, this.httpOptions).pipe(
      catchError(this.handleError<any>('deleteSlide'))
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
    return (error: Error): Observable<T> => {
      console.log(operation + ' failed: ' + error.message);
      return of(result as T);
    }
  }

}
