import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';

import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';

import { SlideService } from '../slide.service';
import { Slide } from '../slide';

@Component({
  selector: 'app-slides',
  templateUrl: './slides.component.html',
  styleUrls: ['./slides.component.css']
})
export class SlidesComponent implements OnInit, OnDestroy {

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

  constructor(private slideService: SlideService, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
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
  private makeResponsiveLaptop(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.laptopQuery = media.matchMedia('(max-width: 1450px)');
    this._laptopQueryListener = () => changeDetectorRef.detectChanges();
    this.laptopQuery.addListener(this._laptopQueryListener);
  }

  // Make the Interface Responsive for Desktops
  private makeResponsiveDesktop(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
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
          this.slides.length !== 0 ? this.items = this.slides.splice(0, 2*this.getCols()) : this.values = false;
        } else {
          this.values = false;
        }
      })
    );
  }

}
