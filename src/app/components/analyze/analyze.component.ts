import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { FeedbackService } from '../../services/feedback/feedback.service';
import { SlideService } from '../../services/slide/slide.service';
import { Slide } from '../../interfaces/slide';

import OpenSeadragon from 'openseadragon';
import * as Annotorious from '@recogito/annotorious-openseadragon';
import * as Selector from '@recogito/annotorious-selector-pack';
import * as Polygon from '@recogito/annotorious-better-polygon';
import * as Toolbar from '@recogito/annotorious-toolbar';

import * as MobileNet from '@tensorflow-models/mobilenet';
import * as KNNClassifier from '@tensorflow-models/knn-classifier';
import * as Tensorflow from '@tensorflow/tfjs';

const CELLS = ['Ciliated', 'Mucipar', 'Striated', 'Basal', 'Neutrophil', 'Eosinophil', 'Lymphocyte', 'Mastcell'];

@Component({
  selector: 'app-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.css']
})
export class AnalyzeComponent implements OnInit, OnDestroy {

  modelLoaded: boolean;
  mobileNetLoaded: boolean;
  private slide: Slide;
  private classifier: any;
  private subscriptions: Subscription[];

  constructor(private route: ActivatedRoute, private slideService: SlideService, private feedbackService: FeedbackService) {
    this.slide = {} as Slide;
    this.classifier = KNNClassifier.create();
    this.modelLoaded = false;
    this.mobileNetLoaded = false;
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
      this.slideService.loadModel('KNNClassifier').subscribe(model => {
        if(model.dataset) {
          this.classifier.setClassifierDataset(
            Object.fromEntries(model.dataset.map(([label, data, shape]: any)=>[label, Tensorflow.tensor(data, shape)]))
          );
        }
        this.modelLoaded = true;
      })
    );
  }

  // Initialize Annotorious Plugin
  private setAnnotorious(url: string): void {
    const viewer = this.getViewer(url);
    const anno = Annotorious(viewer, this.getConfig());
    if(this.slide.annotations.length > 0) anno.setAnnotations(this.slide.annotations);
    this.setToolbar(anno);
    this.tagSuggestion(this.classifier, anno, viewer, this.subscriptions, this.slide, this.slideService, this.feedbackService);
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
        {
          widget: 'TAG',
          vocabulary: CELLS
        },
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

  // Initialize Annotorious Toolbar
  private setToolbar(anno: any): void {
    Selector(anno, {
      tools: ['circle', 'rect', 'ellipse']
    });
    Polygon(anno);
    Toolbar(anno, <HTMLDivElement>document.getElementById('toolbar'));
  }

  // Suggest Tag with a KNN Classifier
  tagSuggestion = async(classifier: any, anno: any, viewer: any, subscriptions: Subscription[], slide: Slide, slideService: SlideService, feedbackService: FeedbackService): Promise<void> => {

    const mobileNet = await MobileNet.load();
    this.mobileNetLoaded = true;

    // When the User Creates a new Selection, we'll Classify the Snippet
    anno.on('createSelection', async function(selection: any): Promise<void> {
      if (classifier.getNumClasses() > 1) {
        const snippet = getSnippet(viewer, selection);
        const activation = mobileNet.infer(snippet, true);
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

    // When the User Create an Annotation, we'll Store the Snippet as a new Example
    anno.on('createAnnotation', function(annotation: any): void {
      manageAnnotation(annotation);
    });

    // When the User Update an Annotation, we'll Store the Snippet as a new Example
    anno.on('updateAnnotation', function(annotation: any): void {
      manageAnnotation(annotation);
    });

    // Delete the Annotation from the Server
    anno.on('deleteAnnotation', function(): void {
      storeAnnotation();
    })

    // Manage Creating and Updating Annotation
    function manageAnnotation(annotation: any): void {
      const tag = annotation.body.find((b: { purpose: string; }) => b.purpose === 'tagging');
      if(tag) {
        tag.value = tag?.value.charAt(0).toUpperCase() + tag?.value.slice(1).toLowerCase();
      }
      if(checkTag(tag, annotation)) {
        transferLearning(annotation, tag);
        storeAnnotation();
      }
    }

    // Make the Transfer Learning process
    function transferLearning(annotation: any, tag: any): void {
      const snippet = getSnippet(viewer, annotation);
      const activation = mobileNet.infer(snippet, true);
      classifier.addExample(activation, tag.value);
      let dataset = JSON.stringify(Object.entries(classifier.getClassifierDataset()).map(([label, data]: any)=>[label, Array.from(data.dataSync()), data.shape]));
      subscriptions.push(slideService.saveModel('KNNClassifier', dataset).subscribe());
    }

    // Check Tag Validity
    function checkTag(tag: any, annotation: any): boolean {
      let valid = true;
      if(CELLS.indexOf(tag?.value) === -1) {
        valid = false;
        anno.removeAnnotation(annotation);
        let error = 'You have to add one of these tags: ';
        CELLS.forEach(cell => error += '"' + cell + '" ')
        feedbackService.showFeedback(error, 'GOT IT');
      }
      return valid;
    }

    // Save Annotation to the Server
    function storeAnnotation(): void {
      subscriptions.push(slideService.saveAnnotations(slide.id, anno.getAnnotations()).subscribe());
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
