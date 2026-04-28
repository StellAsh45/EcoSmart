import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { PublicGuard } from './guards/public.guard';
import { RecoveryGuard } from './guards/recovery.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'ingreso',
    canActivate: [PublicGuard],
    loadComponent: () => import('./ingreso/ingreso.page').then(m => m.IngresoPage)
  },
  {
    path: 'registro',
    canActivate: [PublicGuard],
    loadComponent: () => import('./registro/registro.page').then(m => m.RegistroPage)
  },
  {
    path: 'recuperacion',
    canActivate: [PublicGuard],
    loadComponent: () => import('./recuperacion/recuperacion.page').then(m => m.RecuperacionPage)
  },
  {
    path: 'dashboard-estudiante',
    canActivate: [AuthGuard],
    loadComponent: () => import('./dashboard-estudiante/dashboard-estudiante.page').then(m => m.DashboardEstudiantePage)
  },
  {
    path: 'dashboard-admin',
    canActivate: [AdminGuard],
    loadComponent: () => import('./dashboard-admin/dashboard-admin.page').then(m => m.DashboardAdminPage)
  },
  {
    path: 'constructor-curso/:id',
    canActivate: [AdminGuard],
    loadComponent: () => import('./constructor-curso/constructor-curso.page').then(m => m.ConstructorCursoPage)
  },
  {
    path: 'terminos',
    canActivate: [PublicGuard],
    loadComponent: () => import('./terminos/terminos.page').then(m => m.TerminosPage)
  },
  {
    path: 'politica',
    canActivate: [PublicGuard],
    loadComponent: () => import('./politica/politica.page').then(m => m.PoliticaPage)
  },
  {
    path: 'catalogo',
    canActivate: [AuthGuard],
    loadComponent: () => import('./catalogo/catalogo.page').then((m) => m.CatalogoPage),
  },
  {
    path: 'perfil',
    canActivate: [AuthGuard],
    loadComponent: () => import('./perfil/perfil.page').then((m) => m.PerfilPage),
  },
  {
    path: 'restablecer-contrasena',
    canActivate: [RecoveryGuard],
    loadComponent: () => import('./restablecer-contrasena/restablecer-contrasena.page').then(m => m.RestablecerContrasenaPage)
  },
  {
    path: 'curso/:id',
    canActivate: [AuthGuard],
    loadComponent: () => import('./curso/curso.page').then(m => m.CursoPage)
  },
  {
    path: 'certificados',
    canActivate: [AuthGuard],
    loadComponent: () => import('./certificados/certificados.page').then(m => m.CertificadosPage)
  },
  {
    path: 'clicker',
    canActivate: [AuthGuard],
    loadComponent: () => import('./clicker/clicker.page').then(m => m.ClickerPage)
  }


];
