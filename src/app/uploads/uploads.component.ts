import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Subscription } from 'rxjs/internal/Subscription';
import { SlideService } from '../slide.service';

@Component({
  selector: 'app-uploads',
  templateUrl: './uploads.component.html',
  styleUrls: ['./uploads.component.css']
})
export class UploadsComponent implements OnDestroy {

  @ViewChild("fileDropRef", { static: false }) fileDropEl: ElementRef = {} as ElementRef;
  files: any[];
  private subscriptions: Subscription[];

  constructor(private slideService: SlideService, private _snackBar: MatSnackBar) {
    this.files = [];
    this.subscriptions = [];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe);
  }

  onFileDropped(event: any): void {
    this.prepareFilesList(event);
  }

  fileBrowseHandler(event: any): void {
    this.prepareFilesList(event.target.files);
    console.log(event.target.files);
  }

  /**
   * Delete file from files list
   * @param index (file index)
   */
  deleteFile(index: number) {
    this.files.splice(index, 1);
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(index: number) {
    setTimeout(() => {
      if (index === this.files.length) {
        return;
      } else {
        const progressInterval = setInterval(() => {
          if (this.files[index].progress === 100) {
            clearInterval(progressInterval);
            this.uploadFilesSimulator(index + 1);
          } else {
            this.files[index].progress += 5;
          }
        }, 200);
      }
    }, 1000);
  }

  /**
   * Convert files list to normal array list
   * @param files (files list)
   */
  prepareFilesList(files: Array<any>): void {
    for(const file of files) {
      file.progress = 0;
      const name = file.name.toLowerCase();
      if(name.endsWith('jpeg') || name.endsWith('jpg') || name.endsWith('png')) {
        console.log(file);
        file.id = Date.now() + '_' + Math.round(Math.random() * 1E9) + '.' + file.name.split('.').pop();
        this.files.push(file);
        this.slideService.createSlide(file, file.id);
      } else {
        this._snackBar.open(file.name + " is an invalid file", "OK, GOT IT", {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          duration: 5000
        });
      }
    this.fileDropEl.nativeElement.value = "";
    this.uploadFilesSimulator(0);
    }
  }

  /**
   * Format bytes
   * @param bytes (file size in bytes)
   * @param decimals (decimals point)
   */
   formatBytes(bytes: number, decimals: number): string {
    let result = '';
    if (bytes === 0) {
      result = '0 Bytes';
    } else {
      const k = 1024;
      const dm = decimals <= 0 ? 0 : decimals || 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      result = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    return result;
  }

}
