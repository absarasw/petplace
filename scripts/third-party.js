import { loadScript } from './lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { isMobile } from './scripts.js';

function loadMSClarity() {
  ((c, l, a, r, i, t, y) => {
    c[a] = c[a] || ((...args) => { (c[a].q = c[a].q || []).push(args); });
    // eslint-disable-next-line no-param-reassign
    t = l.createElement(r);
    t.async = 1;
    t.src = `https://www.clarity.ms/tag/${i}?ref=gtm2`;
    // eslint-disable-next-line no-param-reassign
    [y] = l.getElementsByTagName(r);
    y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'hz6a0je2i3');
}

export async function loadLazy() {
  // Load ads early on desktop since the impact is minimal there and
  // this helps reduce CLS and loading animation duration
  if (
    (window.location.pathname === `${window.hlx.contentBasePath}/`
    || window.location.pathname.includes('tags')
    || window.location.pathname.includes('article')
    || window.location.pathname.includes('category'))
    && !isMobile()
  ) {
    loadScript('https://securepubads.g.doubleclick.net/tag/js/gpt.js', {
      async: '',
    });
  }
}

export function loadDelayed() {
  loadMSClarity();
}
let shopifyReadyPromise;
export async function loadShopifyBuy(id, node, accessToken) {
  const scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';

  if (!shopifyReadyPromise) {
    shopifyReadyPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptURL;
      document.head.append(script);
      script.onload = () => {
        // eslint-disable-next-line no-undef
        const client = ShopifyBuy.buildClient({
          domain: 'bytetag.myshopify.com',
          storefrontAccessToken: accessToken,
        });
        // eslint-disable-next-line no-undef
        ShopifyBuy.UI.onReady(client).then(resolve);
      };
    });
  }
  shopifyReadyPromise.then((ui) => ui.createComponent('product', {
    id,
    node,
    moneyFormat: '%24%7B%7Bamount%7D%7D',
    options: {
      product: {
        styles: {
          product: {
            '@media (min-width: 601px)': {
              'max-width': 'calc(25% - 20px)',
              'margin-left': '20px',
              'margin-bottom': '50px',
            },
            'carousel-button': {
              display: 'none',
            },
          },
          title: {
            'font-family': 'Source Sans Pro, sans-serif',
            color: '#323f48',
          },
          button: {
            ':hover': {
              'background-color': '#b3452a',
            },
            'background-color': '#c74d2f',
            ':focus': {
              'background-color': '#b3452a',
            },
            'border-radius': '10px',
          },
          price: {
            'font-family': 'Source Sans Pro, sans-serif',
            'font-weight': 'bold',
            color: '#323f48',
          },
          compareAt: {
            'font-family': 'Source Sans Pro, sans-serif',
            'font-weight': 'bold',
            color: '#323f48',
          },
          unitPrice: {
            'font-family': 'Source Sans Pro, sans-serif',
            'font-weight': 'bold',
            color: '#323f48',
          },
        },
        contents: {
          img: false,
          imgWithCarousel: true,
          button: false,
          buttonWithQuantity: true,
        },
        text: {
          button: 'Add to cart',
        },
        googleFonts: ['Source Sans Pro'],
      },
      productSet: {
        styles: {
          products: {
            '@media (min-width: 601px)': {
              'margin-left': '-20px',
            },
          },
        },
      },
      modalProduct: {
        contents: {
          img: false,
          imgWithCarousel: true,
          button: false,
          buttonWithQuantity: true,
        },
        styles: {
          product: {
            '@media (min-width: 601px)': {
              'max-width': '100%',
              'margin-left': '0px',
              'margin-bottom': '0px',
            },
          },
          button: {
            ':hover': {
              'background-color': '#b3452a',
            },
            'background-color': '#c74d2f',
            ':focus': {
              'background-color': '#b3452a',
            },
            'border-radius': '10px',
          },
          title: {
            'font-family': 'Helvetica Neue, sans-serif',
            'font-weight': 'bold',
            'font-size': '26px',
            color: '#4c4c4c',
          },
          price: {
            'font-family': 'Helvetica Neue, sans-serif',
            'font-weight': 'normal',
            'font-size': '18px',
            color: '#4c4c4c',
          },
          compareAt: {
            'font-family': 'Helvetica Neue, sans-serif',
            'font-weight': 'normal',
            'font-size': '15.299999999999999px',
            color: '#4c4c4c',
          },
          unitPrice: {
            'font-family': 'Helvetica Neue, sans-serif',
            'font-weight': 'normal',
            'font-size': '15.299999999999999px',
            color: '#4c4c4c',
          },
        },
        text: {
          button: 'Add to cart',
        },
      },
      option: {
        styles: {
          label: {
            'font-family': 'Source Sans Pro, sans-serif',
            color: '#323f48',
          },
          select: {
            'font-family': 'Source Sans Pro, sans-serif',
          },
        },
        googleFonts: ['Source Sans Pro'],
      },
      cart: {
        styles: {
          button: {
            ':hover': {
              'background-color': '#b3452a',
            },
            'background-color': '#c74d2f',
            ':focus': {
              'background-color': '#b3452a',
            },
            'border-radius': '10px',
          },
          title: {
            color: '#323f48',
          },
          header: {
            color: '#323f48',
          },
          lineItems: {
            color: '#323f48',
          },
          subtotalText: {
            color: '#323f48',
          },
          subtotal: {
            color: '#323f48',
          },
          notice: {
            color: '#323f48',
          },
          currency: {
            color: '#323f48',
          },
          close: {
            color: '#323f48',
            ':hover': {
              color: '#323f48',
            },
          },
          empty: {
            color: '#323f48',
          },
          noteDescription: {
            color: '#323f48',
          },
          discountText: {
            color: '#323f48',
          },
          discountIcon: {
            fill: '#323f48',
          },
          discountAmount: {
            color: '#323f48',
          },
        },
        text: {
          total: 'Subtotal',
          button: 'Checkout',
        },
        popup: false,
      },
      toggle: {
        styles: {
          toggle: {
            'background-color': '#c74d2f',
            ':hover': {
              'background-color': '#b3452a',
            },
            ':focus': {
              'background-color': '#b3452a',
            },
          },
        },
      },
      lineItem: {
        styles: {
          variantTitle: {
            color: '#323f48',
          },
          title: {
            color: '#323f48',
          },
          price: {
            color: '#323f48',
          },
          fullPrice: {
            color: '#323f48',
          },
          discount: {
            color: '#323f48',
          },
          discountIcon: {
            fill: '#323f48',
          },
          quantity: {
            color: '#323f48',
          },
          quantityIncrement: {
            color: '#323f48',
            'border-color': '#323f48',
          },
          quantityDecrement: {
            color: '#323f48',
            'border-color': '#323f48',
          },
          quantityInput: {
            color: '#323f48',
            'border-color': '#323f48',
          },
        },
      },
    },
  }));
}
