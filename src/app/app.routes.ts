import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { SignInComponent } from './login/sign-in/sign-in.component';
import { ForgetPasswordComponent } from './login/forget-password/forget-password.component';
import { SignUpComponent } from './login/sign-up/sign-up.component';

export const routes: Routes = [
    { path: '', component: LoginComponent, children: [
        { path: '', component: SignInComponent},
        { path: 'forget', component: ForgetPasswordComponent},
        { path: 'signUp', component: SignUpComponent},
    ]},
    { path: 'board', component: MainComponent},
    
];
