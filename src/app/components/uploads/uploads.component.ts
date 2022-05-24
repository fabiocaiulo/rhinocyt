import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import { FeedbackService } from '../../services/feedback/feedback.service';

@Component({
  selector: 'app-uploads',
  templateUrl: './uploads.component.html',
  styleUrls: ['./uploads.component.css']
})
export class UploadsComponent implements OnDestroy {

  @ViewChild('fileDropRef', { static: false }) private fileDropRef: ElementRef;
  files: any[];
  imageModal: string;
  image: any;
  name: string;
  private subscriptions: Subscription[];

  constructor(private slideService: SlideService, private feedbackService: FeedbackService) {
    this.fileDropRef = {} as ElementRef;
    this.files = [];
    this.name = '';
    this.imageModal = 'none';
    this.subscriptions = [];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe);
  }

  // On File Drop handler
  onFileDropped(files: File): void {
    this.prepareFilesList(files as any);
  }

  // Handle File from Browsing
  fileBrowseHandler(event: Event): void {
    this.prepareFilesList((event as any).target.files);
  }

  // Convert Files List to Array List
  private prepareFilesList(files: Array<File>): void {
    for(const file of files) {
      if(this.checkFile(file)) {
        (file as any).id = Date.now() + '_' + Math.round(Math.random() * 1E9) + '.' + file.name.split('.').pop();
        (file as any).progress = 0;
        this.uploadFile(file);
      }
    }
    this.fileDropRef.nativeElement.value = '';
  }

  // Check that the File is an Image
  private checkFile(file: File): boolean {
    let image = true;
    const name = file.name.toLowerCase();
    if(!name.endsWith('jpeg') && !name.endsWith('jpg') && !name.endsWith('png')) {
      image = false;
      this.feedbackService.showFeedback(file.name + ' is an invalid file', 'OK, GOT IT');
    }
    return image;
  }

  // Upload File on Remote Server
  private uploadFile(file: File): void {
    this.subscriptions.push(
      this.slideService.uploadSlide(file, (file as any).id).subscribe(res => {
        if(res.msg.toLowerCase() !== 'error') {
          this.showProgress(file);
          this.files.push(file);
        }
      })
    );
  }

  // Show Upload file Progress
  private showProgress(file: File): void {
    setTimeout(() => {
      setInterval(() => {
        if((file as any).progress < 100) (file as any).progress += 5;
      }, 100);
    }, 500);
  }

  // Show Image previously Uploaded
  showImage(index: number): void {
    const reader = new FileReader();
    reader.readAsDataURL(this.files[index]);
    reader.onload = () => this.image = reader.result;
    this.name = this.files[index].name;
    this.imageModal = 'block';
  }

  // Close Modal previously Showed
  closeModal(): void {
    this.imageModal = 'none';
  }

  // Remove File previously Uploaded
  removeFile(index: number): void {
    this.slideService.removeSlide(this.files[index], this.files[index].id).subscribe(res => {
      if(res.msg.toLowerCase() !== 'error') this.files.splice(index, 1);
    })
  }

  /**
   * Format Bytes
   *
   * @param bytes - file size in bytes
   * @param decimals - decimals point
   */
  formatBytes(bytes: number, decimals: number): string {
    let conversion = '';
    if(bytes !== 0) {
      const k = 1024;
      const dm = decimals <= 0 ? 0 : decimals || 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      conversion = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    } else {
      conversion = '0 Bytes';
    }
    return conversion;
  }

}
