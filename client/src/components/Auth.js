import { authAPI } from '../services/api.js';
import config from '../config.js';

export class Auth {
  constructor() {
    this.container = document.getElementById('auth-section');
    this.navContainer = document.getElementById('nav-auth');
    this.isLoginMode = true;
    this.render();
  }

  render() {
    const token = localStorage.getItem('token');

    if (token) {
      this.container.classList.add('hidden');
      this.navContainer.innerHTML = `
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">Welcome back!</span>
          <button id="logout-btn" 
            class="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      `;
      this.attachLogoutListener();
      return;
    }

    this.container.classList.remove('hidden');
    this.container.innerHTML = `
      <div class="min-h-[80vh] flex items-center justify-center">
        <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <!-- Logo/Brand -->
          <div class="text-center">
            <h2 class="text-3xl font-extrabold text-gray-900 mb-2">
              ${this.isLoginMode ? 'Welcome back!' : 'Create your account'}
            </h2>
            <p class="text-sm text-gray-600">
              ${this.isLoginMode
        ? 'Enter your credentials to access your account'
        : 'Start tracking your website analytics'}
            </p>
          </div>

          <!-- Form -->
          <form id="auth-form" class="mt-8 space-y-6">
            <!-- Email Input -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div class="mt-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  id="email" 
                  required 
                  class="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                >
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div class="mt-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  id="password" 
                  required 
                  class="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                >
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <button 
                type="submit" 
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </span>
                ${this.isLoginMode ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>

          <!-- Mode Toggle -->
          <div class="text-center">
            <p class="text-sm text-gray-600">
              ${this.isLoginMode ? "Don't have an account?" : "Already have an account?"}
              <button 
                id="mode-toggle"
                class="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
              >
                ${this.isLoginMode ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>

          <!-- Error Message -->
          <div id="auth-error" class="hidden">
            <div class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800" id="error-message"></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachAuthListeners();
  }

  attachAuthListeners() {
    const form = document.getElementById('auth-form');
    const modeToggle = document.getElementById('mode-toggle');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // disable submit button and show loading state
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${this.isLoginMode ? 'Signing in...' : 'Creating account...'}
      `;

      const email = form.email.value;
      const password = form.password.value;

      try {
        const response = await fetch(`${config.API_URL}/auth/${this.isLoginMode ? 'login' : 'register'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          window.dispatchEvent(new Event('auth-changed'));
          this.render();
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('Auth error:', error);
        this.showError(error.message);

        // reset submit button
        submitButton.disabled = false;
        submitButton.innerHTML = `
          <span class="absolute left-0 inset-y-0 flex items-center pl-3">
            <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </span>
          ${this.isLoginMode ? 'Sign in' : 'Create account'}
        `;
      }
    });

    modeToggle.addEventListener('click', () => {
      this.isLoginMode = !this.isLoginMode;
      this.render();
    });
  }

  showError(message) {
    const errorDiv = document.getElementById('auth-error');
    const errorMessage = document.getElementById('error-message');

    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('animate-fade-in');
    errorMessage.textContent = message;

    setTimeout(() => {
      errorDiv.classList.add('animate-fade-out');
      setTimeout(() => {
        errorDiv.classList.add('hidden');
        errorDiv.classList.remove('animate-fade-in', 'animate-fade-out');
      }, 300);
    }, 5000);
  }

  attachLogoutListener() {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-changed'));
      this.render();
    });
  }
}