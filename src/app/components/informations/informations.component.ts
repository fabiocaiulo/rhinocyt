import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ModelService } from 'src/app/services/model/model.service';

import * as KNNClassifier from '@tensorflow-models/knn-classifier';
import * as Tensorflow from '@tensorflow/tfjs';

interface Class {
  cell: string;
  examples: number;
}

@Component({
  selector: 'app-informations',
  templateUrl: './informations.component.html',
  styleUrls: ['./informations.component.css']
})
export class InformationsComponent implements OnInit, OnDestroy {

  columns: string[];
  classes: Class[];
  examples: number;
  private subscriptions: Subscription[];

  constructor(private modelService: ModelService) {
    this.columns = ['cell', 'examples'];
    this.classes = [];
    this.examples = 0;
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
      this.modelService.loadModel('KNNClassifier').subscribe(model => {
        if(model.dataset) {
          const classifier = KNNClassifier.create();
          classifier.setClassifierDataset(
            Object.fromEntries(model.dataset.map(([label, data, shape]: any)=>[label, Tensorflow.tensor(data, shape)]))
          );
          this.setClassesInformations(classifier.getClassExampleCount());
        }
      })
    );
  }

  // Set Classes Informations
  private setClassesInformations(informations: any): void {
    this.classes.push({ cell: 'Ciliata', examples: informations.Ciliata ? informations.Ciliata : 0 })
    this.classes.push({ cell: 'Mucipara', examples: informations.Mucipara ? informations.Mucipara : 0 })
    this.classes.push({ cell: 'Striata', examples: informations.Striata ? informations.Striata : 0 })
    this.classes.push({ cell: 'Basale', examples: informations.Basale ? informations.Basale : 0 })
    this.classes.push({ cell: 'Neutrofilo', examples: informations.Neutrofilo ? informations.Neutrofilo : 0 })
    this.classes.push({ cell: 'Eosinofilo', examples: informations.Eosinofilo ? informations.Eosinofilo : 0 })
    this.classes.push({ cell: 'Mastcellula', examples: informations.Mastcellula ? informations.Mastcellula : 0 })
    this.classes.push({ cell: 'Linfocita', examples: informations.Linfocita ? informations.Linfocita : 0 })
    this.classes.forEach(c => this.examples += c.examples);
  }

}
