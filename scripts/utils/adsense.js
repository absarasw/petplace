window.googletag ||= { cmd: [] };

const mappingHelper = (adLoc) => {
  const mappingSide = window.googletag
    .sizeMapping()
    .addSize([0, 0], [])
    .addSize(
      [980, 200],
      [
        [160, 600],
        [300, 600],
      ],
    )
    .build();

  const mappingTopHero = window.googletag
    .sizeMapping()
    .addSize(
      [0, 0],
      [
        [320, 50],
        [320, 100],
      ],
    )
    .addSize(
      [980, 200],
      [
        [728, 90],
        [970, 90],
      ],
    )
    .build();

  const mappingLeaderboard = window.googletag
    .sizeMapping()
    .addSize(
      [0, 0],
      [
        [320, 50],
        [320, 100],
        [300, 250],
        [336, 280],
      ],
    )
    .addSize(
      [980, 200],
      [
        [728, 90],
        [970, 90],
        [970, 250],
      ],
    )
    .build();

  if (adLoc.includes('side')) return mappingSide;
  if (adLoc.includes('top')) return mappingTopHero;
  if (adLoc.includes('middle') || adLoc.includes('bottom')) {
    return mappingLeaderboard;
  }

  return null;
};

const sizingArr = (adLoc) => {
  const sizeSide = [[160, 600]];
  const sizeTopMid = [[320, 50]];
  const sizeLeader = [[728, 90]];

  if (adLoc.includes('article')) {
    if (adLoc.includes('top') || adLoc.includes('middle')) {
      return sizeTopMid;
    }
    if (adLoc.includes('side')) return sizeSide;
    if (adLoc.includes('bottom')) return sizeLeader;
  }

  return sizeLeader;
};

export const adsDivCreator = (adLoc) => {
  const mainDiv = document.createElement('div');
  mainDiv.className = 'publi-container bg-white';

  const subDiv = document.createElement('div');
  subDiv.className = 'sub-container';
  mainDiv.appendChild(subDiv);

  const adDiv = document.createElement('div');
  adDiv.className = 'publi-wrapper publi-wrapper-bg';
  subDiv.appendChild(adDiv);

  const idLoc = document.createElement('div');
  idLoc.id = adLoc;
  adDiv.appendChild(idLoc);

  if (adLoc.includes('top')) {
    const hero = document.querySelector('.hero');
    hero.after(mainDiv);
  }

  if (adLoc.includes('bottom')) {
    const footer = document.querySelector('footer');
    footer.before(mainDiv);
  }

  // SIDE COMES LATER (only article)
  // MIDDLE COMES LATER (only article)
};

// script for display (loop)
const gtagDisplay = (argsArr) => {
  window.googletag.cmd.push(() => {
    argsArr.forEach((arg) => {
      window.googletag.display(arg);
    });
  });
};

// google tag for adsense
export const adsDefineSlot = (...args) => {
  let anchorSlot;
  const REFRESH_KEY = 'refresh';
  const REFRESH_VALUE = 'true';
  const lastItemIndex = args.length - 1;

  window.googletag.cmd.push(() => {
    // var dataLayer = document.DataLayer
    // var articleValue;
    // TRY CAPTURING THIS VALUE FROM DATALAYER BEFORE ASSIGN VARIABLE

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < lastItemIndex; i++) {
      window.googletag
        .defineSlot(
          `/1004510/petplace_web/${args[i]}`,
          sizingArr(args[i]),
          args[i],
        )
        .defineSizeMapping(mappingHelper(args[i]))
        .setTargeting(REFRESH_KEY, REFRESH_VALUE)
        .setTargeting('refreshed_slot', 'false')
        .addService(window.googletag.pubads());
    }

    anchorSlot = window.googletag.defineOutOfPageSlot(
      `/1004510/petplace_web/${args[lastItemIndex]}`,
      window.googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR,
    );

    if (anchorSlot) {
      anchorSlot
        .setTargeting(REFRESH_KEY, REFRESH_VALUE)
        .setTargeting('refreshed_slot', 'false')
        .addService(window.googletag.pubads());
    } else console.log('Anchor not loaded');

    // Refresh subroutine
    const SECONDS_TO_WAIT_AFTER_VIEWABILITY = 30;
    window.googletag
      .pubads()
      .addEventListener('impressionViewable', (event) => {
        const { slot } = event;
        if (slot.getTargeting(REFRESH_KEY).indexOf(REFRESH_VALUE) > -1) {
          slot.setTargeting('refreshed_slot', 'true');
          setTimeout(() => {
            window.googletag.pubads().refresh([slot]);
          }, SECONDS_TO_WAIT_AFTER_VIEWABILITY * 1000);
        }
      });

    // Lazy loading subroutine
    window.googletag.pubads().enableLazyLoad({
      fetchMarginPercent: 100,
      renderMarginPercent: 100,
      mobileScaling: 2.0,
    });

    window.googletag.pubads().set('page_url', 'https://www.petplace.com');
    // window.googletag.pubads().setTargeting('article', articleValue);
    window.googletag.pubads().setCentering(true);
    window.googletag.enableServices();
  });

  // after the definitions
  const newArgs = args.filter((arg) => !arg.includes('anchor'));
  newArgs.push(anchorSlot);
  gtagDisplay(newArgs);
};