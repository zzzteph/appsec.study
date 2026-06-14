// Importing @angular/compiler ships the JIT compiler so runtime-compiled
// templates work — this is what makes the CSTI demo (csti-preview) possible.
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((err) => console.error(err));
