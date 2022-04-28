import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import { Slide } from '../../interfaces/slide';

import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import * as Selector from '@recogito/annotorious-selector-pack';
import * as Toolbar from '@recogito/annotorious-toolbar';

import * as MobileNet from '@tensorflow-models/mobilenet';
import * as KNNClassifier from '@tensorflow-models/knn-classifier';
import '@tensorflow/tfjs';

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit, OnDestroy {

  slide: Slide;
  modelLoaded: boolean;
  private subscriptions: Subscription[];

  constructor(private route: ActivatedRoute, private slideService: SlideService) {
    this.slide = {} as Slide;
    this.modelLoaded = false;
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
    this.setToolbar(anno);
    this.smartTagging(anno, this.slide.image);
    this.storeAnnotations(anno, this.subscriptions, this.slide, this.slideService);
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
      widgets: [
        'COMMENT',
        {
          widget: 'TAG',
          vocabulary: ['Ciliata', 'Mucipara', 'Striata', 'Basale', 'Neutrofilo', 'Eosinofilo', 'Mastcellula', 'Linfocita']
        }
      ]
    };
    return config;
  }

  // Labels Annotorious Formatter
  Formatter = function(annotation: any) {
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

  // Initialize Annotorious Toolbar
  private setToolbar(anno: any): void {
    Selector(anno, {
      tools: ['circle', 'rect', 'ellipse']
    });
    anno.removeDrawingTool('polygon');
    Toolbar(anno, <HTMLDivElement>document.getElementById('toolbar'));
  }

  // Store Annotations on the Server
  storeAnnotations = function(anno: any, subscriptions: Subscription[], slide: Slide, slideService: SlideService) {
    anno.on('createAnnotation', function() {
      subscriptions.push(slideService.saveAnnotations(slide.id, anno.getAnnotations()).subscribe());
    })
    anno.on('updateAnnotation', function() {
      subscriptions.push(slideService.saveAnnotations(slide.id, anno.getAnnotations()).subscribe());
    })
    anno.on('deleteAnnotation', function() {
      subscriptions.push(slideService.saveAnnotations(slide.id, anno.getAnnotations()).subscribe());
    })
  }

  // See https://codelabs.developers.google.com/tensorflowjs-transfer-learning-teachable-machine
  smartTagging = async (anno: any, image: string) => {
    console.log('Loading MobileNet');
    console.time('MobileNet loaded');
    const mnet = await MobileNet.load();
    this.modelLoaded = true;
    console.timeEnd('MobileNet loaded');

    const classifier = KNNClassifier.create();

    // When the user creates a new selection, we'll classify the snippet
    anno.on('createSelection', async function(selection: any) {
      if (classifier.getNumClasses() > 1) {
        const snippet = await getImageSnippet(image, selection);
        const activation = mnet.infer(snippet, true);
        const result = await classifier.predictClass(activation);

        if (result) {
          // Inject into the current annotation
          selection.body = [
            {
              type: 'TextualBody',
              purpose: 'tagging',
              value: result.label
            },
            {
              type: 'TextualBody',
              purpose: 'commenting',
              value: 'At ' + Math.trunc(result.confidences[result.label]*100) + '% it is a ' + result.label
            }
          ];
          anno.updateSelected(selection);
        }
      }
    });

    // When the user hits 'Ok', we'll store the snippet as a new example
    anno.on('createAnnotation', async function(annotation: any) {
      const tag = annotation.body.find((b: { purpose: string; }) => b.purpose === 'tagging');
      if(tag) {
        const snippet = await getImageSnippet(image, annotation);
        const activation = mnet.infer(snippet, true);
        classifier.addExample(activation, tag.value);
      }
    });

    // When the user hits 'Ok', we'll store the snippet as a new example
    anno.on('updateAnnotation', async function(annotation: any) {
      const tag = annotation.body.find((b: { purpose: string; }) => b.purpose === 'tagging');
      if(tag) {
        const snippet = await getImageSnippet(image, annotation);
        const activation = mnet.infer(snippet, true);
        classifier.addExample(activation, tag.value);
      }
    });
  }

}

async function getImageSnippet(url: string, annotation: any): Promise<HTMLCanvasElement> {
  let image = await createImage(url);

  let { naturalWidth, naturalHeight } = image;
  let canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  let context = canvas.getContext('2d');
  if(context != null) context.drawImage(image, 0, 0, naturalWidth, naturalHeight);

  let { x, y, width, height } = annotation.target.selector.value;
  if(context != null) {
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowBlur = 3;
    context.shadowColor = 'rgba(255, 255, 255, 0.5)';
    context.strokeStyle = '#131313';
    context.lineWidth = 3;
    context.globalCompositeOperation = 'source-in';
    context.fillRect(x, y, width, height);
  }

  return canvas;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let img = new Image();
    img.src = url
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      img.height = img.naturalHeight;
      img.width = img.naturalWidth;
      resolve(img);
    }
  })
}
