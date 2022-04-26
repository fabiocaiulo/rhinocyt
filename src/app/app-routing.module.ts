import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SlidesComponent } from './components/slides/slides.component';
import { AnalyzeComponent } from './components/analyze/analyze.component';
import { UploadsComponent } from './components/uploads/uploads.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';

// Application Routes
const routes: Routes = [
  { path: '', redirectTo: 'slides', pathMatch: 'full'},
  { path: 'slides', component: SlidesComponent },
  { path: 'slides/analyze/:id', component: AnalyzeComponent},
  { path: 'uploads', component: UploadsComponent },
  { path: '**', pathMatch: 'full', component: PageNotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
