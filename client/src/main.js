import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Icon from './components/Icon.vue'

// Initialize Back4App Parse
const initParse = () => {
  // Check if Parse is available globally (loaded via CDN)
  if (typeof window.Parse !== 'undefined') {
    window.Parse.initialize(
      '9ikj4nFe21EDN8oLqjjflaC4qqHYrjHMviM1amJn', // Application ID
      'GXx301IxbteGQ1tSaB2MKYWiW93Qm8Qp3RpX0oDr'  // JavaScript Key
    );
    window.Parse.serverURL = 'https://parseapi.back4app.com';
    console.log('Back4App Parse initialized successfully via CDN');
  } else {
    console.warn('Parse SDK not available, using fallback mode');
    // Fallback: create a mock Parse object for basic functionality
    window.Parse = {
      initialize: () => {},
      serverURL: '',
      User: {
        logIn: () => Promise.reject(new Error('Parse not available')),
        signUp: () => Promise.reject(new Error('Parse not available'))
      },
      Object: {
        extend: () => ({})
      },
      Query: function() {
        this.find = () => Promise.resolve([]);
        this.first = () => Promise.resolve(null);
        this.equalTo = () => this;
        this.descending = () => this;
      }
    };
  }
};

initParse();

const app = createApp(App);
app.component('Icon', Icon);
app.mount('#app')
