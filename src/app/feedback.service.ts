import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  // Use SnackBar
  constructor(private _snackBar: MatSnackBar) { }

  // Notify the User
  showFeedback(message: string, button: string): void {
    this._snackBar.open(
      message, button, {
        horizontalPosition: 'center',
        verticalPosition: 'top',
        duration: 5000
      }
    );
  }

}
