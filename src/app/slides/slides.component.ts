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
  laptopQuery: MediaQueryList;
  mobileQuery: MediaQueryList;
  private _laptopQueryListener;
  private _mobileQueryListener;
  private subscriptions: Subscription[];

  constructor(private slideService: SlideService, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.slides = [];
    this.laptopQuery = media.matchMedia('(max-width: 1300px)');
    this.mobileQuery = media.matchMedia('(max-width: 1000px)');
    this._laptopQueryListener = () => changeDetectorRef.detectChanges();
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.laptopQuery.addListener(this._laptopQueryListener);
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.subscriptions = [];
  }

  ngOnInit(): void {
    this.getSlides();
  }

  ngOnDestroy(): void {
    this.laptopQuery.removeListener(this._laptopQueryListener);
    this.mobileQuery.removeListener(this._mobileQueryListener);
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
