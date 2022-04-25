import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

import { FeedbackService } from './feedback.service';
import { Response } from './response';
import { Slide } from './slide';

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
  constructor(
    private http: HttpClient,
    private feedbackService: FeedbackService
  ) { }

  // POST: Upload a new Slide to the Server
  uploadSlide(image: File, id: string): Observable<Response> {
    const url = this.slidesUrl + 'upload';
    let formData = new FormData();
    formData.append('image', image, id);
    return this.http.post<Response>(url, formData).pipe(
      catchError(this.handleError<Response>('upload ' + image.name))
    );
  }

  // DELETE: Remove the Slide from the Server
  removeSlide(image: File, id: string): Observable<Response> {
    const url = this.slidesUrl + 'remove?id=' + id;
    return this.http.delete<Response>(url, this.httpOptions).pipe(
      catchError(this.handleError<Response>('remove ' + image.name))
    );
  }

  // GET: Read the Slides from the Server
  readSlides(): Observable<Slide[]> {
    const url = this.slidesUrl + 'read';
    return this.http.get<Slide[]>(url).pipe(
      catchError(this.handleError<Slide[]>('read slides'))
    );
  }

  // POST: Hide the Slide to the Server
  hideSlide(id: string): Observable<Response> {
    const url = this.slidesUrl + 'hide?id=' + id;
    return this.http.post<Response>(url, this.httpOptions).pipe(
      catchError(this.handleError<Response>('delete the slide'))
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
      this.feedbackService.showFeedback('An error occured when trying to ' + operation, 'OK, GOT IT');
      return of(result as T);
    }
  }

}
