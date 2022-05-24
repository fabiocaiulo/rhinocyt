import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import { Slide } from '../../interfaces/slide';

import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';

@Component({
  selector: 'app-see',
  templateUrl: './see.component.html',
  styleUrls: ['./see.component.css']
})
export class SeeComponent implements OnInit, OnDestroy {

  slide: Slide;
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
    const anno = Annotorious(this.getViewer(url), this.getConfig());
    if(this.slide.annotations.length > 0) anno.setAnnotations(this.slide.annotations);
  }

  // Initialize Openseadragon Viewer
  private getViewer(url: string): any {
    const viewer = OpenSeadragon({
      id: 'slide',
      tileSources: {
        type: 'image',
        url: url,
        crossOriginPolicy: 'Anonymous'
      }
    });
    return viewer;
  }

  // Initialize Annotorious Config
  private getConfig(): any {
    const config = {
      formatter: this.Formatter,
      readOnly: true,
      widgets: [
        'TAG',
        'COMMENT'
      ]
    };
    return config;
  }

  // Labels Annotorious Formatter
  Formatter = function(annotation: any): any {
    let result = {}
    const bodies = Array.isArray(annotation.body) ? annotation.body : [ annotation.body ];
    const firstTag = bodies.find((b: { purpose: string; }) => b.purpose == 'tagging');
    if (firstTag) {
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      foreignObject.setAttribute('width', '1px');
      foreignObject.setAttribute('height', '1px');
      foreignObject.innerHTML = '<div xmlns="http://www.w3.org/1999/xhtml" class="a9s-shape-label-wrapper"><div class="a9s-shape-label">' + firstTag.value + '</div></div>';
      result = { element: foreignObject, className: firstTag.value };
    }
    return result;
  }

}
