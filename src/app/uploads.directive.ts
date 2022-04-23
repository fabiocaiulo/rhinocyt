import { Directive, HostBinding, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appUploads]'
})
export class UploadsDirective {

  @HostBinding('class.fileover') private fileOver: boolean;
  @Output() private fileDropped;

  constructor() {
    this.fileOver = false;
    this.fileDropped = new EventEmitter<File>();
  }

  // Dragover Listener
  @HostListener('dragover', ['$event']) onDragOver(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = true;
  }

  // Dragleave Listener
  @HostListener('dragleave', ['$event']) public onDragLeave(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = false;
  }

  // Drop Listener
  @HostListener('drop', ['$event']) public onDrop(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = false;
    let files = (event as any).dataTransfer.files;
    if (files.length > 0) {
      this.fileDropped.emit(files);
    }
  }

}
