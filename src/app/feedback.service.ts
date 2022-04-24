import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  // Use SnackBar to Notify the User
  constructor(private _snackBar: MatSnackBar) { }

  // Notify the User in Bottom position
  showBottomFeedback(message: string): void {
    this._snackBar.open(
      message, "OK, GOT IT", {
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        duration: 5000
      }
    );
  }

  // Notify the User in Top position
  showTopFeedback(message: string): void {
    this._snackBar.open(
      message, "OK, GOT IT", {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 5000
      }
    );
  }

}
