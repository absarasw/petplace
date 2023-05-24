import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  getMetadata,
  toClassName,
  createOptimizedPicture,
} from './lib-franklin.js';

const LCP_BLOCKS = ['slideshow']; // add your LCP blocks to the list
let templateModule;
window.hlx.RUM_GENERATION = 'project-1'; // add your RUM generation information here

export function getId() {
  return Math.random().toString(32).substring(2);
}

export function isMobile() {
  return window.innerWidth < 1024;
}

let categoriesPromise = null;
async function loadCategories() {
  if (categoriesPromise) {
    return categoriesPromise;
  }
  if (!window.sessionStorage.getItem('categories')) {
    categoriesPromise = fetch('/categories.json')
      .then((res) => res.json())
      .then((json) => {
        window.sessionStorage.setItem('categories', JSON.stringify(json));
      })
      .catch((err) => {
        window.sessionStorage.setItem('categories', JSON.stringify({ data: [] }));
        // eslint-disable-next-line no-console
        console.error('Failed to fetch categories.', err);
      });
    return categoriesPromise;
  }
  return Promise.resolve();
}

export async function getCategories() {
  try {
    await loadCategories();
    return JSON.parse(window.sessionStorage.getItem('categories'));
  } catch (err) {
    return null;
  }
}

export async function getCategory(name) {
  const categories = await getCategories();
  if (!categories) {
    return null;
  }
  return categories.data.find((c) => c.Slug === name);
}

export async function getCategoryByName(categoryName) {
  const categories = await getCategories();
  if (!categories) {
    return null;
  }
  return categories.data.find((c) => c.Category === categoryName);
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
async function buildHeroBlock(main) {
  const excludedPages = ['home-page', 'breed-index'];
  const bodyClass = [...document.body.classList];
  // check the page's body class to see if it matched the list
  // of excluded page for auto-blocking the hero
  const pageIsExcluded = excludedPages.some((page) => bodyClass.includes(page));
  if (pageIsExcluded) {
    return;
  }
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const img = picture.querySelector('img');
    const optimized = createOptimizedPicture(img.src, img.alt, true, [
      { width: Math.ceil(window.innerWidth / 100) * 100 },
    ]);
    picture.replaceWith(optimized);
    const section = document.createElement('div');
    if (bodyClass.includes('breed-page') || bodyClass.includes('author-page')) {
      section.append(buildBlock('hero', { elems: [optimized] }));
    } else {
      section.append(buildBlock('hero', { elems: [optimized, h1] }));
    }
    main.prepend(section);
  }
}

function buildVideoEmbeds(container) {
  container.querySelectorAll('a[href*="youtube.com/embed"]').forEach((a) => {
    a.parentElement.innerHTML = `
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        frameborder="0"
        loading="lazy"
        height="360"
        width="640"
        src="${a.href}"></iframe>`;
  });
}

/**
 * Builds template block and adds to main as sections.
 * @param {Element} main The container element.
 * @returns {Promise} Resolves when the template block(s) have
 *  been loaded.
 */
async function decorateTemplate(main) {
  const template = toClassName(getMetadata('template'));
  if (!template) {
    return;
  }

  try {
    const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/templates/${template}/${template}.css`);
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          templateModule = await import(`../templates/${template}/${template}.js`);
          if (templateModule?.loadEager) {
            await templateModule.loadEager(main);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load template for ${template}`, error);
        }
        resolve();
      })();
    });
    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load template ${template}`, error);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
async function buildAutoBlocks(main) {
  try {
    await buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export async function decorateMain(main) {
  loadCategories(main);
  // hopefully forward compatible button decoration
  decorateButtons(main);
  await decorateIcons(main);
  await buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    await decorateTemplate(main);
    await decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  if (templateModule?.loadLazy) {
    templateModule.loadLazy(doc);
  }
  const main = doc.querySelector('main');
  if (document.body.classList.contains('article-page')) {
    buildVideoEmbeds(main);
  }
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  await loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  await loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  addFavIcon(`${window.hlx.codeBasePath}/styles/favicon.svg`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed(doc) {
  // eslint-disable-next-line import/no-cycle
  // load anything that can be postponed to the latest here
  window.setTimeout(() => {
    if (templateModule?.loadDelayed) {
      templateModule.loadDelayed(doc);
    }
    return import('./delayed.js');
  }, 3000);
}

function createResponsiveImage(pictures, breakpoint) {
  pictures.sort((p1, p2) => {
    const img1 = p1.querySelector('img');
    const img2 = p2.querySelector('img');
    return img1.width - img2.width;
  });

  const responsivePicture = document.createElement('picture');
  const defaultImage = pictures[0].querySelector('img');
  responsivePicture.append(defaultImage);
  pictures.forEach((picture, index) => {
    let srcElem;
    if (index === 0) {
      srcElem = picture.querySelector('source:not([media])');
    } else {
      srcElem = picture.querySelector('source[media]');
    }
    const srcElemBackup = srcElem.cloneNode();
    srcElemBackup.srcset = srcElemBackup.srcset.replace('format=webply', 'format=png');
    srcElemBackup.type = 'img/png';

    if (index > 0) {
      srcElem.setAttribute('media', `(min-width: ${breakpoint[index - 1]}px)`);
      srcElemBackup.setAttribute('media', `(min-width: ${breakpoint[index - 1]}px)`);
    }
    responsivePicture.prepend(srcElemBackup);
    responsivePicture.prepend(srcElem);
  });

  return responsivePicture;
}

/**
 *
 * @param container - HTML parent element that contains the multiple <picture>
 *     tags to be used in building responsive image
 * @param breakpoints - Array of numbers to be used to define the breakpoints for the pictures.
 */
export function decorateResponsiveImages(container, breakpoints = [440, 768]) {
  const responsiveImage = createResponsiveImage([...container.querySelectorAll('picture')], breakpoints);
  container.innerHTML = '';
  container.append(responsiveImage);
}

function getActiveSlide(block) {
  return {
    index: [...block.children].findIndex((child) => child.getAttribute('active') === 'true'),
    element: block.querySelector('[active="true"]'),
    totalSlides: [...block.children].length,
  };
}

export function slide(slideDirection, block, slideWrapper) {
  const currentActive = getActiveSlide(block);
  currentActive.element.removeAttribute('active');
  let newIndex;
  if (slideDirection === 'next') {
    if (currentActive.index === currentActive.totalSlides - 1) {
      newIndex = 0;
    } else {
      newIndex = currentActive.index + 1;
    }
  } else if (currentActive.index === 0) {
    newIndex = currentActive.totalSlides - 1;
  } else {
    newIndex = currentActive.index - 1;
  }
  block.children[newIndex].setAttribute('active', true);

  slideWrapper.setAttribute('style', `transform:translateX(-${newIndex}00vw)`);
}

export function initializeTouch(block, slideWrapper) {
  const slideContainer = block.closest('[class*="-container"]');
  let startX;
  let currentX;
  let diffX = 0;

  slideContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX;
  });

  slideContainer.addEventListener('touchmove', (e) => {
    currentX = e.touches[0].pageX;
    diffX = currentX - startX;

    const { index } = getActiveSlide(block);
    slideWrapper.style.transform = `translateX(calc(-${index}00vw + ${diffX}px))`;
  });

  slideContainer.addEventListener('touchend', () => {
    if (diffX > 50) {
      slide('prev', block, slideWrapper);
    } else if (diffX < -50) {
      slide('next', block, slideWrapper);
    } else {
      const { index } = getActiveSlide(block);
      slideWrapper.setAttribute('style', `transform:translateX(-${index}00vw)`);
    }
  });
}

/**
 * @typedef CrumbData
 * @property {string} url Full URL to which clicking the crumb will redirect.
 * @property {string} path Name of the crumb as it will appear on its label.
 * @property {string} color Name of the color in which the breadcrumb should
 *  be rendered.
 */

/**
 * Creates an element that contains the structure for a given list of crumb information.
 * @param {Array<CrumbData>} crumbData Information about the crumbs to add.
 * @returns {Promise<Element>} Resolves with the crumb element.
 */
export async function createBreadCrumbs(crumbData) {
  const breadcrumbContainer = document.createElement('div');
  // Use the last item in the list's color
  const { color } = crumbData[crumbData.length - 1];

  const homeLink = document.createElement('a');
  homeLink.classList.add('home');
  homeLink.href = '/';
  homeLink.innerHTML = '<span class="icon icon-home"></span>';
  breadcrumbContainer.append(homeLink);

  crumbData.forEach((crumb, i) => {
    if (i > 0) {
      const chevron = document.createElement('span');
      chevron.innerHTML = '<span class="icon icon-chevron"></span>';
      breadcrumbContainer.append(chevron);
    }
    const linkButton = document.createElement('a');
    linkButton.href = crumb.url;
    linkButton.innerText = crumb.path;
    linkButton.classList.add('category-link-btn');
    if (i === crumbData.length - 1) {
      // linkButton.classList.add(`${color}`);
      linkButton.style.setProperty('--bg-color', `var(--color-${color})`);
      linkButton.style.setProperty('--border-color', `var(--color-${color})`);
      linkButton.style.setProperty('--text-color', 'inherit');
    } else {
      // linkButton.classList.add(`${color}-border`, `${color}-color`);
      linkButton.style.setProperty('--bg-color', 'inherit');
      linkButton.style.setProperty('--border-color', `var(--color-${color})`);
      linkButton.style.setProperty('--text-color', `var(--color-${color})`);
    }

    breadcrumbContainer.append(linkButton);
  });

  await decorateIcons(breadcrumbContainer);
  return breadcrumbContainer;
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed(document);
}

loadPage();
