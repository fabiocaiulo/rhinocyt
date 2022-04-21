import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-uploads',
  templateUrl: './uploads.component.html',
  styleUrls: ['./uploads.component.css']
})
export class UploadsComponent implements OnInit {

  files: any[];

  constructor() {
    this.files = [];
  }

  ngOnInit(): void {
  }

  /**
   * On file drop handler
   */
  onFileDropped(event: any) {
    this.prepareFilesList(event);
  }

  /**
   * Handle file from browsing
   */
  fileBrowseHandler(event: any) {
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
        }, 200);
      }
    }, 1000);
  }

  /**
   * Convert files list to normal array list
   * @param files (files list)
   */
  prepareFilesList(files: Array<any>): void {
    for(const item of files) {
      item.progress = 0;
      this.files.push(item);
    }
    this.uploadFilesSimulator(0);
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
