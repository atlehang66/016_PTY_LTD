/* ---------------------------------------------------------------
   EmailJS wiring for the Shipyard contact form.
   No backend required — this posts straight from the browser
   to EmailJS, which sends the email to your inbox.

   SETUP (one-time, ~5 min):
   1. Create a free account at https://www.emailjs.com
   2. Email Services -> Add New Service -> connect Gmail (or any
      inbox you want the form to land in). Copy the Service ID.
   3. Email Templates -> Create New Template. Use these variables
      in the template body, matching the form field "name" attrs:
        {{from_name}}   {{reply_to}}   {{company}}   {{message}}
      Set the template's "To email" to your own address, and
      "Reply To" to {{reply_to}} so you can hit reply directly.
      Copy the Template ID.
   4. Account -> General -> copy your Public Key.
   5. Paste all three values below.
--------------------------------------------------------------- */

const EMAILJS_PUBLIC_KEY  = "w_cdN3HoZhrkROpid";
const EMAILJS_SERVICE_ID  = "service_stx9n6a";
const EMAILJS_TEMPLATE_ID = "template_elvlcgv";

(function initEmailJS(){
  if (window.emailjs && !EMAILJS_PUBLIC_KEY.startsWith("YOUR_")) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
})();

const contactForm = document.getElementById('contact-form');
const statusEl    = document.getElementById('cf-status');
const submitBtn   = document.getElementById('cf-submit');
let successGlowTimer = null;

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const notConfigured =
      !window.emailjs ||
      EMAILJS_PUBLIC_KEY.startsWith("YOUR_") ||
      EMAILJS_SERVICE_ID.startsWith("YOUR_") ||
      EMAILJS_TEMPLATE_ID.startsWith("YOUR_");

    if (notConfigured) {
      if (successGlowTimer) clearTimeout(successGlowTimer);
      contactForm.classList.remove('is-success');
      statusEl.textContent = "Form isn't wired up yet — email hello@yourdomain.com directly.";
      statusEl.classList.add('is-error');
      return;
    }

    if (successGlowTimer) clearTimeout(successGlowTimer);
    contactForm.classList.remove('is-success');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    statusEl.textContent = '';
    statusEl.classList.remove('is-error');

    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, contactForm)
      .then(function () {
        contactForm.reset();
        submitBtn.textContent = 'Send it over';
        submitBtn.disabled = false;
        statusEl.textContent = 'Cleared — message sent. We’ll reply soon.';
        statusEl.classList.remove('is-error');
        contactForm.classList.add('is-success');
        successGlowTimer = window.setTimeout(() => {
          contactForm.classList.remove('is-success');
        }, 3000);
      })
      .catch(function (err) {
        console.error('EmailJS error:', err);
        if (successGlowTimer) clearTimeout(successGlowTimer);
        contactForm.classList.remove('is-success');
        submitBtn.textContent = 'Send it over';
        submitBtn.disabled = false;
        statusEl.textContent = "That didn't go through — email hello@yourdomain.com directly.";
        statusEl.classList.add('is-error');
      });
  });
}