import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

import { SlideService } from '../slide.service';
import { Slide } from '../slide';

@Component({
  selector: 'app-slides',
  templateUrl: './slides.component.html',
  styleUrls: ['./slides.component.css']
})
export class SlidesComponent implements OnInit, OnDestroy {

  slides: Slide[];
  mobileQuery: MediaQueryList;
  laptopQuery: MediaQueryList;
  desktopQuery: MediaQueryList;
  private _mobileQueryListener;
  private _laptopQueryListener;
  private _desktopQueryListener;
  private subscriptions: Subscription[];

  constructor(private slideService: SlideService, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.slides = [];
    this.mobileQuery = media.matchMedia('(max-width: 1000px)');
    this.laptopQuery = media.matchMedia('(max-width: 1450px)');
    this.desktopQuery = media.matchMedia('(max-width: 1900px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this._laptopQueryListener = () => changeDetectorRef.detectChanges();
    this._desktopQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.laptopQuery.addListener(this._laptopQueryListener);
    this.desktopQuery.addListener(this._desktopQueryListener);
    this.subscriptions = [];
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

  private getSlides(): void {
    this.subscriptions.push(
      this.slideService.readSlides().subscribe(slides => {
        if(slides) this.slides = slides;
      })
    );
  }

}
