import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { SlideService } from '../../services/slide/slide.service';
import Model from '../../../../files/KNNClassifier.json';

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

  @ViewChild('table', { static: false }) private table: MatTable<Class>;
  columns: string[];
  classes: Class[];
  examples: number;
  private subscriptions: Subscription[];

  constructor(private slideService: SlideService) {
    this.table = {} as MatTable<Class>;
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
      this.slideService.loadModel('KNNClassifier').subscribe(res => {
        if(res.msg.toLowerCase() !== 'error') {
          const classifier = KNNClassifier.create();
          classifier.setClassifierDataset(
            Object.fromEntries(Model.map(([label, data, shape]: any)=>[label, Tensorflow.tensor(data, shape)]))
          );
          this.setClassesInformations(classifier.getClassExampleCount());
          this.table.renderRows();
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
