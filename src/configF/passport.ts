// import passport from 'passport';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as AppleStrategy } from 'passport-apple';
// import { Strategy as LocalStrategy } from 'passport-local';
// // import { Strategy as WhatsAppStrategy } from 'passport-whatsapp';
// import { loginService } from '../services/admin/admin-service';
// import { config } from './config';

// export class PassportConfig {
//     private userService: loginService;

//     constructor() {
//         this.userService = new loginService();
//         this.initializePassport();
//     }

//     private initializePassport(): void {
//         passport.serializeUser((user: any, done) => {
//             done(null, user.identifier);
//         });

//         passport.deserializeUser(async (id: string, done) => {
//             try {
//                 const user = await this.userService.findById(id);
//                 done(null, user);
//             } catch (error) {
//                 done(error);
//             }
//         });

//         this.setupLocalStrategy();
//         this.setupFacebookStrategy();
//         this.setupGoogleStrategy();
//         this.setupAppleStrategy();
//         // this.setupWhatsAppStrategy();
//     }

//     private setupLocalStrategy(): void {
//         passport.use(new LocalStrategy({
//             usernameField: 'email',
//             passwordField: 'password'
//         }, this.userService.validateLocalUser));
//     }

//     private setupFacebookStrategy(): void {
//         passport.use(new FacebookStrategy({
//             clientID: config.facebook.clientId,
//             clientSecret: config.facebook.clientSecret,
//             callbackURL: config.facebook.callbackURL,
//             profileFields: ['id', 'emails', 'name']
//         }, this.userService.handleFacebookAuth));
//     }

//     private setupGoogleStrategy(): void {
//         passport.use(new GoogleStrategy({
//             clientID: config.google.clientId,
//             clientSecret: config.google.clientSecret,
//             callbackURL: config.google.callbackURL
//         }, this.userService.handleGoogleAuth));
//     }

//     private setupAppleStrategy(): void {
//         passport.use(new AppleStrategy({
//             clientID: config.apple.clientId,
//             teamID: config.apple.teamId,
//             callbackURL: config.apple.callbackURL,
//             keyID: config.apple.keyId,
//             privateKeyLocation: config.apple.privateKeyLocation,
//             passReqToCallback: false
//         }, this.userService.handleAppleAuth));
//     }

//     // private setupWhatsAppStrategy(): void {
//     //     passport.use(new WhatsAppStrategy({
//     //         clientID: config.whatsapp.clientId,
//     //         clientSecret: config.whatsapp.clientSecret,
//     //         callbackURL: config.whatsapp.callbackURL
//     //     }, this.userService.handleWhatsAppAuth));
//     // }
// }