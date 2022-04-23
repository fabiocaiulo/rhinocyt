import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-uploads',
  templateUrl: './uploads.component.html',
  styleUrls: ['./uploads.component.css']
})
export class UploadsComponent implements OnInit {

  files: any[];

  constructor(private _snackBar: MatSnackBar) {
    this.files = [];
  }

  ngOnInit(): void {
  }

  onFileDropped(event: any): void {
    this.prepareFilesList(event);
  }

  fileBrowseHandler(event: any): void {
    this.prepareFilesList(event.target.files);
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
        }, 100);
      }
    }, 100);
  }

  /**
   * Convert files list to normal array list
   * @param files (files list)
   */
  prepareFilesList(files: Array<any>): void {
    //const prefix = Date.now() + '_' + Math.round(Math.random() * 1E9) + '.' + file.originalname.split('.').pop();
    for(const file of files) {
      this.uploadFilesSimulator(0);
      file.progress = 0;
      const name = file.name.toLowerCase();
      if(name.endsWith('jpeg') || name.endsWith('jpg') || name.endsWith('png')) {
        this.files.push(file);
        file.progress = 100;
      } else {
        this._snackBar.open(file.name + " is an invalid file", "OK, GOT IT", {
          horizontalPosition: 'center',
          verticalPosition: 'top',
          duration: 5000
        });
      }
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
