import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import { Class } from '../../interfaces/class';

import * as KNNClassifier from '@tensorflow-models/knn-classifier';
import * as Tensorflow from '@tensorflow/tfjs';

@Component({
  selector: 'app-informations',
  templateUrl: './informations.component.html',
  styleUrls: ['./informations.component.css']
})
export class InformationsComponent implements OnInit, OnDestroy {

  modelLoaded: boolean;
  columns: string[];
  classes: Class[];
  examples: number;
  @ViewChild('table', { static: false }) private table: MatTable<Class>;
  private subscriptions: Subscription[];

  constructor(private slideService: SlideService) {
    this.modelLoaded = false;
    this.columns = ['cell', 'examples'];
    this.classes = [];
    this.examples = 0;
    this.table = {} as MatTable<Class>;
    this.subscriptions = [];
  }

  ngOnInit(): void {
    this.getModelInformations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe);
  }

  // Retrieve the Model Informations from the Server
  private getModelInformations(): any {
    this.subscriptions.push(
      this.slideService.loadModel('KNNClassifier').subscribe(model => {
        const classifier = KNNClassifier.create();
        if(model.dataset) {
          classifier.setClassifierDataset(
            Object.fromEntries(model.dataset.map(([label, data, shape]: any)=>[label, Tensorflow.tensor(data, shape)]))
          );
        }
        this.setClassesInformations(classifier.getClassExampleCount());
        this.modelLoaded = true;
        this.table.renderRows();
      })
    );
  }

  // Set Classes Informations
  private setClassesInformations(informations: any): void {
    this.classes.push({ cell: 'Ciliated', examples: informations.Ciliated ? informations.Ciliated : 0 })
    this.classes.push({ cell: 'Mucipar', examples: informations.Mucipar ? informations.Mucipar : 0 })
    this.classes.push({ cell: 'Striated', examples: informations.Striated ? informations.Striated : 0 })
    this.classes.push({ cell: 'Basal', examples: informations.Basal ? informations.Basal : 0 })
    this.classes.push({ cell: 'Neutrophil', examples: informations.Neutrophil ? informations.Neutrophil : 0 })
    this.classes.push({ cell: 'Eosinophil', examples: informations.Eosinophil ? informations.Eosinophil : 0 })
    this.classes.push({ cell: 'Lymphocyte', examples: informations.Lymphocyte ? informations.Lymphocyte : 0 })
    this.classes.push({ cell: 'Mastcell', examples: informations.Mastcell ? informations.Mastcell : 0 })
    this.classes.forEach(c => this.examples += c.examples);
  }

}
