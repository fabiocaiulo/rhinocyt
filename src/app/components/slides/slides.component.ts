import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import { Slide } from '../../interfaces/slide';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-slides',
  templateUrl: './slides.component.html',
  styleUrls: ['./slides.component.css']
})
export class SlidesComponent implements OnInit, OnDestroy {

  @ViewChild('slidesPaginator', { static: false }) private slidesPaginator: ElementRef;
  values: boolean;
  items: Slide[];
  slides: Slide[];
  private subscriptions: Subscription[];

  mobileQuery: MediaQueryList = {} as MediaQueryList;
  laptopQuery: MediaQueryList = {} as MediaQueryList;
  desktopQuery: MediaQueryList = {} as MediaQueryList;
  private _mobileQueryListener = () => {};
  private _laptopQueryListener = () => {};
  private _desktopQueryListener = () => {};

  constructor(private slideService: SlideService, private dialog: MatDialog, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.slidesPaginator = {} as ElementRef;
    this.values = true;
    this.items = [];
    this.slides = [];
    this.subscriptions = [];
    this.makeResponsive(changeDetectorRef, media);
  }

  ngOnInit(): void {
    this.getSlides();
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    this.laptopQuery.removeListener(this._laptopQueryListener);
    this.desktopQuery.removeListener(this._desktopQueryListener);
    this.subscriptions.forEach(sub => sub.unsubscribe);
  }

  // Make the Interface Responsive for Devices
  private makeResponsive(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher): void {
    this.makeResponsiveMobile(changeDetectorRef, media);
    this.makeResponsiveLaptop(changeDetectorRef, media);
    this.makeResponsiveDesktop(changeDetectorRef, media);
  }

  // Make the Interface Responsive for Mobiles
  private makeResponsiveMobile(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher): void {
    this.mobileQuery = media.matchMedia('(max-width: 1000px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  // Make the Interface Responsive for Laptops
  private makeResponsiveLaptop(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher): void {
    this.laptopQuery = media.matchMedia('(max-width: 1450px)');
    this._laptopQueryListener = () => changeDetectorRef.detectChanges();
    this.laptopQuery.addListener(this._laptopQueryListener);
  }

  // Make the Interface Responsive for Desktops
  private makeResponsiveDesktop(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher): void {
    this.desktopQuery = media.matchMedia('(max-width: 1900px)');
    this._desktopQueryListener = () => changeDetectorRef.detectChanges();
    this.desktopQuery.addListener(this._desktopQueryListener);
  }

  // Return Columns by Device
  getCols(): number {
    let cols = 0;
    if(this.mobileQuery.matches) cols = 1;
    else if(this.laptopQuery.matches) cols = 2;
    else if(this.desktopQuery.matches) cols = 3;
    else cols = 4;
    return cols;
  }

  // Adapts Items by Paginator
  changeItems(event: PageEvent): void {
    const start = event.pageSize * event.pageIndex;
    const end = start + event.pageSize;
    this.items = this.slides.slice(start, end);
  }

  // Retrieve Slides from Server
  private getSlides(): void {
    this.subscriptions.push(
      this.slideService.readSlides().subscribe(slides => {
        if(slides) {
          this.slides = slides;
          this.slides.length !== 0 ? this.items = this.slides.slice(0, 2*this.getCols()) : this.values = false;
        } else {
          this.values = false;
        }
      })
    );
  }

  // Show Confirmation Dialog
  showDialog(id: string, index: number): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Delete this slide?',
        content: 'This will delete slide that are currently on this page and cannot be undone.',
        action: 'Delete'
      }
    });
    this.subscriptions.push(
      dialogRef.afterClosed().subscribe(result => {
        if(result) this.deleteSlide(id, index)
      })
    );
  }

  // Hide the Slide from Server
  deleteSlide(id: string, index: number): void {
    this.subscriptions.push(
      this.slideService.hideSlide(id).subscribe(res => {
        if(res.msg.toLowerCase() !== 'error') {
          this.items.splice(index, 1);
          this.slides.splice(this.getSlideIndexById(id), 1);
          this.updateItems();
        }
      })
    );
  }

  // Return the Index of Slide to be Removed
  private getSlideIndexById(id: string): number {
    let index = 0;
    for(let i = 0; i < this.slides.length; i++) {
      if(this.slides[i].id === id) index = i;
    }
    return index;
  }

  // Update the Slides
  private updateItems(): void {
    if(this.slides.length !== 0) {
      const start = (this.slidesPaginator as any).pageSize * (this.slidesPaginator as any).pageIndex;
      const end = start + (this.slidesPaginator as any).pageSize;
      this.items = this.slides.slice(start, end);
    } else {
      this.values = false;
    }
  }

}
