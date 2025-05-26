import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EditComponent } from './edit/edit.component';
import { NewComponent } from './new/new.component';
import { authGuard } from '../guards/auth.guard';
import { roleGuard } from '../guards/role.guard';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard]
  },
  {
    path: 'edit',
    component: EditComponent,
    canActivate: [authGuard]
  },
  {
    path: 'new',
    component: NewComponent,
    canActivate: [authGuard, roleGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrivateRoutingModule { }