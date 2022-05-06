import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import { Slide } from '../../interfaces/slide';
import Model from '../../../../files/KNNClassifier.json';

import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import * as Selector from '@recogito/annotorious-selector-pack';
import * as Polygon from '@recogito/annotorious-better-polygon';
import * as Toolbar from '@recogito/annotorious-toolbar';

import * as MobileNet from '@tensorflow-models/mobilenet';
import * as KNNClassifier from '@tensorflow-models/knn-classifier';
import * as Tensorflow from '@tensorflow/tfjs';

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit, OnDestroy {

  modelLoaded: boolean;
  private slide: Slide;
  private classifier: any;
  private subscriptions: Subscription[];

  constructor(private route: ActivatedRoute, private slideService: SlideService) {
    this.slide = {} as Slide;
    this.classifier = KNNClassifier.create();
    this.modelLoaded = false;
    this.subscriptions = [];
  }

  ngOnInit(): void {
    this.getSlide();
    this.setModel();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe);
    this.classifier.dispose();
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

  // Retrieve the Model from the Server
  private setModel(): void {
    this.subscriptions.push(
      this.slideService.loadModel('KNNClassifier').subscribe(res => {
        if(res.msg.toLowerCase() !== 'error') {
          this.classifier.setClassifierDataset(
            Object.fromEntries(Model.map(([label, data, shape]: any)=>[label, Tensorflow.tensor(data, shape)]))
          );
        }
      })
    );
  }

  // Initialize Annotorious Plugin
  private setAnnotorious(url: string): void {
    const viewer = this.getViewer(url);
    const anno = Annotorious(viewer, this.getConfig());
    if(this.slide.annotations.length > 0) anno.setAnnotations(this.slide.annotations);
    this.setToolbar(anno);
    this.tagSuggestion(this.classifier, anno, viewer, this.subscriptions, this.slideService);
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
    Polygon(anno);
    Toolbar(anno, <HTMLDivElement>document.getElementById('toolbar'));
  }

  // Store Annotations on the Server
  storeAnnotations = function(anno: any, subscriptions: Subscription[], slide: Slide, slideService: SlideService) {

    anno.on('createAnnotation', function() {
      store();
    })

    anno.on('updateAnnotation', function() {
      store();
    })

    anno.on('deleteAnnotation', function() {
      store();
    })

    function store() {
      subscriptions.push(slideService.saveAnnotations(slide.id, anno.getAnnotations()).subscribe());
    }

  }

  // Suggest Tag with a KNN Classifier
  tagSuggestion = async (classifier: any, anno: any, viewer: any, subscriptions: Subscription[], slideService: SlideService) => {

    const mnet = await MobileNet.load();
    this.modelLoaded = true;

    // When the User Creates a new Selection, we'll Classify the Snippet
    anno.on('createSelection', async function(selection: any) {
      if (classifier.getNumClasses() > 1) {
        const snippet = getSnippet(viewer, selection);
        const activation = mnet.infer(snippet, true);
        const result = await classifier.predictClass(activation);
        // Inject into the Current Annotation
        if (result) {
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

    // When the User hits 'Ok', we'll Store the Snippet as a new Example
    anno.on('createAnnotation', function(annotation: any) {
      transferLearning(annotation);
    });

    // When the User hits 'Ok', we'll Store the Snippet as a new Example
    anno.on('updateAnnotation', function(annotation: any) {
      transferLearning(annotation);
    });

    // Make the Transfer Learning process
    function transferLearning(annotation: any): void {
      const tag = annotation.body.find((b: { purpose: string; }) => b.purpose === 'tagging');
      if(tag) {
        const snippet = getSnippet(viewer, annotation);
        const activation = mnet.infer(snippet, true);
        classifier.addExample(activation, tag.value);
        let dataset = JSON.stringify(Object.entries(classifier.getClassifierDataset()).map(([label, data]: any)=>[label, Array.from(data.dataSync()), data.shape]));
        subscriptions.push(slideService.saveModel('KNNClassifier', dataset).subscribe());
      }
    }

    // Returns Rect Canvas from Annotation
    function getSnippet(viewer: any, annotation: any): HTMLCanvasElement {
      const outerBounds = getElement(annotation).getBoundingClientRect();

      // Scale Factor for OSD Canvas Element (Physical vs Logical Resolution)
      const { canvas } = viewer.drawer;
      const canvasBounds = canvas.getBoundingClientRect();
      const kx = canvas.width / canvasBounds.width;
      const ky = canvas.height / canvasBounds.height;

      const x = outerBounds.x - canvasBounds.x;
      const y = outerBounds.y - canvasBounds.y;
      const { width, height } = outerBounds;

      // Cut Out the Image Snippet as in-memory Canvas Element
      const snippet = document.createElement('canvas');
      const ctx = snippet.getContext('2d');
      snippet.width = width;
      snippet.height = height;
      ctx?.drawImage(canvas, x * kx, y * ky, width * kx, height * ky, 0, 0, width, height);

      return snippet;
    }

    // Returns DOM Element from Annotation
    function getElement(annotation: any): Element {
      let element;
      if(annotation.id !== undefined) {
        element = document.querySelector('[data-id="' + annotation.id + '"]');
      } else {
        if(annotation.target.selector.value.slice(6, 13) !== 'polygon') {
          element = document.querySelector('[class="a9s-annotation editable selected"]');
        } else {
          element = document.querySelector('[class="a9s-annotation editable selected improved-polygon"]');
        }
      }
      return element != null ? element : {} as Element;
    }

  }

}
