import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import { Slide } from '../../interfaces/slide';

import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import * as Toolbar from '@recogito/annotorious-toolbar';

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit, OnDestroy {

  slide: Slide;
  private annotorious: any;
  private subscriptions: Subscription[];

  constructor(private route: ActivatedRoute, private slideService: SlideService) {
    this.slide = {} as Slide;
    this.subscriptions = [];
  }

  ngOnInit(): void {
    this.getSlide();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe);
  }

  // Retrieve the Slide from the Server
  private getSlide(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.subscriptions.push(
      this.slideService.readSlide(id !== null ? id : '').subscribe(slide => {
        if(slide) {
          this.slide = slide;
          this.setAnnotorious(this.slide.image);
        }
      })
    );
  }

  // Initialize Annotorious Plugin
  private setAnnotorious(url: string): void {
    const viewer = OpenSeadragon({
      id: 'slide',
      tileSources: {
        type: 'image',
        url: url
      }
    });
    const config = {
      widgets: [{
        widget: 'TAG',
        vocabulary: ['Ciliata', 'Mucipara', 'Striata', 'Basale', 'Neutrofilo', 'Eosinofilo', 'Mastcellula', 'Linfocita']
      }]
    };
    this.annotorious = Annotorious(viewer, config);
    Toolbar(this.annotorious, <HTMLDivElement>document.getElementById('toolbar'));
  }

}
