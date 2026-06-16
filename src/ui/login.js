// ============================================================================
// login.js — wires the sign-in form to auth.signIn().
// ----------------------------------------------------------------------------
// THE key fix lives here: the form's submit listener calls preventDefault(), so
// the browser never performs its native GET submission. Without this, a form
// with text inputs and no JS handler reloads the page with the field values
// appended to the URL as a query string (?identifier=…&password=…) — leaking the
// credentials into the address bar, history, and server logs, and never signing
// anyone in. Here we intercept submit, POST the credentials over HTTPS via the
// Authorization header (see auth.js), and switch views on success.
// ============================================================================

import { signIn } from '../auth.js';

/**
 * Attach the sign-in behaviour to #login-form.
 * @param {() => void} onSuccess  called once a valid session token is stored.
 */
export function initLogin(onSuccess) {
  const form = document.getElementById('login-form');
  const identifierInput = document.getElementById('identifier');
  const passwordInput = document.getElementById('password');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  if (!form || !identifierInput || !passwordInput) return;

  const showError = (message) => {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    // restart the shake animation even on repeated failures
    form.classList.remove('shake');
    void form.offsetWidth; // force reflow
    form.classList.add('shake');
  };

  const clearError = () => {
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    form.classList.remove('shake');
  };

  const setLoading = (isLoading) => {
    submitBtn?.classList.toggle('is-loading', isLoading);
    if (submitBtn) submitBtn.disabled = isLoading;
    identifierInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
  };

  form.addEventListener('submit', async (event) => {
    // Stop the browser's default GET submission — this is what was dumping the
    // username and password into the URL.
    event.preventDefault();
    clearError();

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    if (!identifier || !password) {
      showError('Enter your username (or email) and password.');
      (identifier ? passwordInput : identifierInput).focus();
      return;
    }

    setLoading(true);
    try {
      await signIn(identifier, password);
      // Never keep the secret hanging around in the field after success.
      passwordInput.value = '';
      clearError();
      onSuccess();
    } catch (err) {
      // auth.signIn throws Errors with specific, user-facing messages
      // (bad credentials, rate-limited, network down, …).
      showError(err?.message || 'Sign-in failed. Please try again.');
      passwordInput.select?.();
    } finally {
      setLoading(false);
    }
  });

  // Clear the error stamp as soon as the user starts correcting their input.
  for (const input of [identifierInput, passwordInput]) {
    input.addEventListener('input', () => {
      if (errorEl && !errorEl.hidden) clearError();
    });
  }
}
