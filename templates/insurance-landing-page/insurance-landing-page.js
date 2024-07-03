function removeAllErrorMessage(searchContainers) {
  [...searchContainers].forEach((el) => {
    const searchDiv = el.querySelector('.search-box-wrapper');
    const errorMsg = el.querySelector('.find-useful-wrapper');
    const searchInput = el.querySelector('.search-input');

    errorMsg.style.display = 'none';
    searchInput.classList.remove('error-state');
    searchDiv.classList.remove('error-spacing');
    searchInput.value = '';
  });
}

function isValidZipcode(code) {
  const regex = /^[0-9]{5}(?:-[0-9]{4})?$/;

  return regex.test(code);
}

function createSpanBlock(main) {
  const searchContainers = main.getElementsByClassName('search-container');

  [...searchContainers].forEach((el) => {
    const searchDiv = el.querySelector('.search-box-wrapper');
    const errorMsg = el.querySelector('.find-useful-wrapper');

    searchDiv.removeAttribute('action');
    const searchInput = searchDiv.querySelector('.search-input');
    const searchButton = searchDiv.querySelector('.search-button');

    // Eventlistener to redirect user to aggregator site.
    searchButton.addEventListener('click', (ev) => {
      ev.preventDefault();
      const code = searchInput.value;
      if (isValidZipcode(code)) {
        removeAllErrorMessage(searchContainers);
        let pageUrl = `https://quote.petplace.com/questionnaire?zipCode=${code}`;
        if (
          document.body.classList.contains(
            'experiment-aggregator-split-testing',
          )
        ) {
          if (document.body.classList.contains('variant-control')) {
            pageUrl = `https://quote.petplace.com/?zipCode=${code}&source=OldSite&campaign=TestA`;
          } else if (document.body.classList.contains('variant-challenger-1')) {
            pageUrl = `https://quote.petpremium.com/petplace?zipCode=${code}&source=NewSite&campaign=Test_widget`;
          }
        }
        window.open(pageUrl);
      } else {
        errorMsg.style.display = 'block';
        searchInput.classList.add('error-state');
        searchDiv.classList.add('error-spacing');
        searchInput.value = '';
      }
    });
  });
}

export function loadLazy() {
  const main = document.querySelector('#main');
  createSpanBlock(main);
}
