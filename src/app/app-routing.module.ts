import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SlidesComponent } from './slides/slides.component';
import { UploadsComponent } from './uploads/uploads.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

// Application Routes
const routes: Routes = [
  { path: '', redirectTo: 'slides', pathMatch: 'full'},
  { path: 'slides', component: SlidesComponent },
  { path: 'uploads', component: UploadsComponent },
  { path: '**', pathMatch: 'full', component: PageNotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
