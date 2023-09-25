import { createForm } from '../form/form.js';
import { setNewsletterSignedUp, captureError } from '../../scripts/scripts.js';

function showMessage(block, message, clazz = 'success') {
  const messageElement = block.querySelector('.newsletter-message');
  messageElement.innerText = message;
  messageElement.classList.remove('success', 'error');
  messageElement.classList.add(clazz);
}

function showError(block, fd) {
  showMessage(block, fd.Failure, 'error');
  block.querySelector('button').removeAttribute('disabled');
}

async function submitForm(block, fd) {
  const dognewsletter = document.getElementById('dogs').checked;
  const catnewsletter = document.getElementById('cats').checked;
  const email = String(document.getElementById('email').value).trim();
  const payload = {
    email,
    dataFields: {
      catnewsletter,
      dognewsletter,
    },
    mergeNestedObjects: true,
    createNewFields: true,
  };
  const fetchOpts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': '3e7a9624572b4827b156af44e72fceaa',
    },
    body: JSON.stringify(payload),
  };
  try {
    const res = await fetch('https://api.iterable.com/api/users/update', fetchOpts);
    if (!res.ok) {
      let text = 'no detail.';
      try {
        text = await res.text();
      } catch {
        // swallowing exception if there are issues reading response
      }
      captureError('newsletter-signup', new Error(`iterable API responded with ${res.status} status code: ${text}`));
      showError(block, fd);
    } else {
      setNewsletterSignedUp();
      showMessage(block, fd.Success);
    }
  } catch (e) {
    captureError('newsletter-signup', e);
    showError(block, fd);
  }
}

export default async function decorate(block) {
  const form = await createForm(
    '/newsletter.json',
    (fd) => submitForm(block, fd),
  );
  form.querySelector('label[for="email"]').classList.add('sr-only');
  form.querySelector('label[for="name"]').classList.add('sr-only');

  const messageContainer = document.createElement('div');
  messageContainer.classList.add('newsletter-message');
  form.append(messageContainer);

  const target = block.children[0].children[0];
  if (target.children.length > 1) {
    // insert form before terms and conditions
    target.insertBefore(form, target.children[target.children.length - 1]);
  } else {
    target.append(form);
  }

  block.querySelectorAll('a').forEach((link) => {
    link.setAttribute('target', '_blank');
  });
}
