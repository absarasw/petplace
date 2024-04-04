/* eslint-disable indent */
import { fetchPlaceholders } from '../../scripts/lib-franklin.js';
import endPoints from '../../variables/endpoints.js';
import { acquireToken, isLoggedIn } from '../../scripts/lib/msal/msal-authentication.js';
import { buildPetCard } from '../../scripts/adoption/buildPetCard.js';
import { setSaveSearch } from '../../scripts/adoption/saveSearch.js';
// fetch placeholders from the /adopt folder currently, but placeholders should |
// be moved into the root' folder eventually
const placeholders = await fetchPlaceholders('/pet-adoption');
const {
    petTypeLabel,
    petTypeValues,
    breedLabel,
    breedPlaceholder,
    zipLabel,
    zipPlaceholder,
    searchAlertText,
    genderOptions,
    sizeOptions,
    radiusOptions,
    ageOptions,
    filtersLabel,
    radiusLabel,
    genderLabel,
    sizeLabel,
    ageLabel,
    clearLabel,
    sortedLabel,
    applyFiltersLabel,
    filterCta,
    createSearchAlert,
    noResults,
    zipErrorMessage,
} = placeholders;

// console.log(placeholders);
let breedList = [];
let currentPage = 1;
const recordsPerPage = 16;
let animalArray = [];

 // Get filters
function getFilters() {
    const genderFilters = document.querySelectorAll('input[name="gender"]:checked');
    let genderFilterList = '';
    genderFilters?.forEach((gender) => {
        if (genderFilterList !== '') {
            genderFilterList += ',' + gender?.value;
        } else {
            genderFilterList += gender?.value;
        }
    });
    const ageFilters = document.querySelectorAll('input[name="age"]:checked');
    let ageFilterList = '';
    ageFilters?.forEach((age) => {
        if (ageFilterList !== '') {
            ageFilterList += ',' + age?.value;
        } else {
            ageFilterList += age?.value;
        }
    });

    const sizeFilters = document.querySelectorAll('input[name="size"]:checked');
    let sizeFilterList = '';
    sizeFilters?.forEach((size) => {
        if (sizeFilterList !== '') {
            sizeFilterList += ',' + size?.value;
        } else {
            sizeFilterList += size?.value;
        }
    });
    const filters = {
        milesRadius: document.getElementById('radius')?.value,
        filterGender: genderFilterList,
        filterAge: ageFilterList,
        filterAnimalType: document.getElementById('pet-type')?.value,
        filterBreed: document.getElementById('breed')?.value,
        zipPostal: document.getElementById('zip')?.value,
        // Add more filters as needed
    };

    // Only include the size filter in the request filter object when 'Cat' is not selected
    if (document.getElementById('pet-type')?.value !== 'Cat') {
        filters.filterSize = sizeFilterList;
    }

    return filters;
}

// Apply filters
function applyFilters() {
    const filters = getFilters();
    // Update the URL with the selected filters as query parameters
    const params = new URLSearchParams(filters);
    window.history.replaceState({}, '', `?${params.toString()}`);
}

async function callAnimalList() {
    applyFilters();
    const petType = document.getElementById('pet-type')?.value;
    let animalType = null;
    if (petType !== 'null') {
        animalType = petType;
    }
    const breedType = document.getElementById('breed')?.value;
    const breeds = [];
    if (breedType !== '') {
        breeds.push(breedType);
    }
    let zip = document.getElementById('zip')?.value;
    if (!zip) {
        zip = null;
    }
    let radius = document.getElementById('radius')?.value;
    if (!radius || radius === 'null') {
        radius = 10;
    }
    const genderElements = document.querySelectorAll('input[name="gender"]:checked');
    let gender = "";
        if (genderElements.length === 1) {
            gender = genderElements[0]?.value;
        }
    const age = document.querySelectorAll('input[name="age"]:checked');
    let ageList = [];
    if (age && age?.length === 0) {
        ageList = null;
    } else {
        age?.forEach((item) => {
            ageList.push(item.value)
        })
    }
    const size = document.querySelectorAll('input[name="size"]:checked');
    let sizeList = [];
    if (size && size?.length === 0) {
        sizeList = null;
    } else {
        size?.forEach((item) => {
            sizeList.push(item.value);
        })
    }

    const response = await fetch(`${endPoints.apiUrl}/animal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            locationInformation: {
                clientId: null,
                zipPostal: zip,
                milesRadius: radius,
            },
            animalFilters: {
                startIndex: 0,
                filterAnimalType: animalType,
                filterBreed: breeds,
                filterGender: gender,
                filterAge: ageList,
                filterSize: sizeList,
            },
        }),
    });
    if (response.status === 204) {
        buildResultsContainer([]);
        let resultsContainer = document.querySelector('.default-content-wrapper.results');
        if (!resultsContainer) {
            resultsContainer = document.querySelector('.default-content-wrapper');
        }
        const paginationBlock = document.querySelector('.pagination');
        paginationBlock.classList.add('hide');
        resultsContainer.innerHTML = noResults;
    } else {
        const paginationBlock = document.querySelector('.pagination');
        paginationBlock?.classList.remove('hide');
    }
    return response.json();
}

async function callBreedList(petType) {
    const breedSelect = document.getElementById('breed');
    if (breedSelect && (petType === 'other' || petType === 'null')) {
        breedSelect.setAttribute('disabled', '');
    } else {
        if (breedSelect) {
            breedSelect.removeAttribute('disabled');
        }
        let endpoint = `${endPoints.apiUrl}/breed`;
        if (petType !== 'null') {
            endpoint = `${endpoint}/${petType}`;
        }
        const response = await fetch(endpoint, {
            method: 'GET',
        });
        return response.json();
    }
    return null;
}

async function updateBreedListSelect() {
    const breedSelect = document.getElementById('breed');
    let i = 0;
    const L = breedSelect.options.length - 1;
    for (i = L; i >= 0; i -= 1) {
        breedSelect.remove(i);
    }

    const breedOption = document.createElement('option');
    breedOption.innerText = breedPlaceholder;
    breedOption.value = '';
    breedSelect?.append(breedOption);
    breedList?.forEach((breed) => {
        const option = document.createElement('option');
        option.innerText = breed?.breedValue;
        option.value = breed?.breedKey;

        breedSelect?.append(option);
    });
}

function numPages() {
    return Math.ceil(animalArray?.length / recordsPerPage);
}

function getFavorites(response) {
    fetch(`${endPoints.apiUrl}/adopt/api/Favorite`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${response}`,
        }
    }).then(response => {
        //console.log('Success:', response.status);
        return response.json();
    }).then((data) => {
        // favorite Pet in the UI
        data.forEach((favorite) => {
            const favoriteButton = document.getElementById(favorite?.Animal.ReferenceNumber);
            favoriteButton?.classList.add('favorited');
            favoriteButton?.setAttribute('data-favorite-id', favorite?.Id);
        })
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function buildResultsList(animalList) {
    const tempResultsBlock = document.getElementById('results-block');
    if (tempResultsBlock.offsetHeight !== 0) {
        tempResultsBlock.style.height = `${tempResultsBlock.offsetHeight.toString()}px`;
    }
    tempResultsBlock.innerHTML = '';
    animalList.forEach((animal) => {
        const div = buildPetCard(animal);
        tempResultsBlock.append(div);
    });
    // check if user is logged in
    isLoggedIn().then(isLoggedIn => {
        if (isLoggedIn) {
            // if logged in set pet as favorite
            acquireToken()
            .then(response => {
                getFavorites(response);            
            })
            .catch((error) => {
                console.error('Error:', error);
            });;
        } else {
          // not logged in or token is expired without ability to silently refresh its validity
        }
      });
    setTimeout(() => {
        tempResultsBlock.style.removeProperty('height');
    }, '400');
}

function calculatePagination(page) {
    let tempPage = page;
    if (tempPage.currentTarget?.myParam) {
        tempPage = page.currentTarget?.myParam;
        currentPage = page.currentTarget?.myParam;
    }
    const filteredArray = [];
    // Validate page
    if (tempPage < 1) tempPage = 1;
    if (tempPage > numPages()) tempPage = numPages();
    for (
        let i = (tempPage - 1) * recordsPerPage;
        i < tempPage * recordsPerPage && i < animalArray?.length;
        i += 1
        ) {
        filteredArray.push(animalArray[i]);
        }
    const paginationNumbers = document.querySelector('.pagination-numbers');
    paginationNumbers.innerHTML = '';
    // add pagination numbers
    const maxPagesToShow = 2; // Adjust as needed
    for (let y = 1; y <= numPages(); y += 1) {
        if (
            y === 1
            || y === numPages()
            || (y >= currentPage - Math.floor(maxPagesToShow / 2)
            && y <= currentPage + Math.floor(maxPagesToShow / 2))
        ) {
            const button = document.createElement('button');
            if (y === currentPage) {
                button.className = 'active';
            }
            button.addEventListener('click', calculatePagination);
            button.myParam = y;
            button.innerHTML = y;
            paginationNumbers.append(button);
        } else if (
            y === currentPage - Math.floor(maxPagesToShow / 2) - 1
            || y === currentPage + Math.floor(maxPagesToShow / 2) + 1
            ) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            paginationNumbers.appendChild(ellipsis);
        }
    }
    buildResultsList(filteredArray);
}

function prevPage() {
    if (currentPage > 1) {
        currentPage -= 1;
        calculatePagination(currentPage);
    }
}

function nextPage() {
    if (currentPage < numPages()) {
        currentPage += 1;
        calculatePagination(currentPage);
    }
}

function clearFilters() {
    const radiusSelect = document.getElementById('radius');
    if (radiusSelect) {
        radiusSelect.selectedIndex = 0;
    };
    const radioButtons = document.querySelectorAll('input:checked');
    for (let i = 0; i < radioButtons.length; i += 1) {
        radioButtons[i].checked = false;
    }
    callAnimalList().then((data) => {
        buildResultsContainer(data);
    });
}

function openModal() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('show');
    const overlay = document.querySelector('.overlay');
    overlay.classList.add('show');
}
function closeModal() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('show');
    const overlay = document.querySelector('.overlay');
    overlay.classList.remove('show');
}

function buildFilterSidebar(sidebar) {
    const filterLabel = document.createElement('h3');
    filterLabel.className = 'sidebar-label';
    filterLabel.innerHTML = filtersLabel;
    sidebar.append(filterLabel);

    // create mobile close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 19.5L19.5 4.5" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 4.5L19.5 19.5" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    closeButton.addEventListener('click', closeModal);
    sidebar.append(closeButton);

    // create clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'sidebar-clear';
    clearButton.innerHTML = clearLabel;
    clearButton.addEventListener('click', clearFilters);
    sidebar.append(clearButton);

    // create search radius select
    const radiusLabelElement = document.createElement('label');
    radiusLabelElement.for = 'radius';
    radiusLabelElement.className = 'sidebar-header';
    radiusLabelElement.innerText = radiusLabel;

    const radiusSelect = document.createElement('select');
    radiusSelect.name = 'radius';
    radiusSelect.id = 'radius';
    radiusSelect.className = 'filter-select';
    radiusSelect.addEventListener('change', () => {
        callAnimalList().then((data) => {
            buildResultsContainer(data);
        });
    });
    const radiusList = radiusOptions.split(',');
        radiusList.forEach((radius) => {
            const radiusListOption = document.createElement('option');
            radiusListOption.innerText = radius;
            radiusListOption.value = radius;

            radiusSelect.append(radiusListOption);
        });
    sidebar.append(radiusLabelElement);
    sidebar.append(radiusSelect);

    // create gender radio buttons
    const genderBlock = document.createElement('div');
    genderBlock.className = 'radio-block';
    const genderLabelElement = document.createElement('div');
    genderLabelElement.className = 'sidebar-header';
    genderLabelElement.innerText = genderLabel;
    genderBlock.append(genderLabelElement);
    sidebar.append(genderBlock);

    const genderList = genderOptions.split(',');
    genderList.forEach((gender) => {
        const genderListLabel = document.createElement('label');
        genderListLabel.for = gender;
        genderListLabel.className = 'radio-container';
        genderListLabel.innerHTML = gender;
        const genderRadio = document.createElement('input');
        genderRadio.type = 'checkbox';
        genderRadio.name = 'gender';
        genderRadio.id = gender;
        genderRadio.value = placeholders[gender.toLowerCase()];
        genderRadio.addEventListener('click', () => {
            callAnimalList().then((data) => {
                buildResultsContainer(data);
            });
        });
        genderListLabel.append(genderRadio);
        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        genderListLabel.append(checkmark);
        genderBlock.append(genderListLabel);
    });

    // create age radio buttons
    const ageBlock = document.createElement('div');
    ageBlock.className = 'radio-block';
    const ageLabelElement = document.createElement('div');
    ageLabelElement.className = 'sidebar-header';
    ageLabelElement.innerText = ageLabel;
    ageBlock.append(ageLabelElement);
    sidebar.append(ageBlock);

    const ageList = ageOptions.split(',');
    ageList.forEach((age) => {
        const ageListLabel = document.createElement('label');
        ageListLabel.for = age;
        ageListLabel.className = 'radio-container';
        ageListLabel.innerHTML = age;
        const ageRadio = document.createElement('input');
        ageRadio.type = 'checkbox';
        ageRadio.name = 'age';
        ageRadio.id = age;
        ageRadio.addEventListener('click', () => {
            callAnimalList().then((data) => {
                buildResultsContainer(data);
            });
        });
        const formattedAge = age[0].toLowerCase() + age.slice(1);
        ageRadio.value = placeholders[formattedAge?.replace(/\s+/g, '')?.replace(/\+/g, '')?.replace(/\//g, '')];
        ageListLabel.append(ageRadio);
        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        ageListLabel.append(checkmark);
        ageBlock.append(ageListLabel);
    });

    // create size radio buttons
    const sizeBlock = document.createElement('div');
    sizeBlock.className = 'radio-block radio-size';
    const sizeLabelElement = document.createElement('div');
    sizeLabelElement.className = 'sidebar-header';
    sizeLabelElement.innerText = sizeLabel;

    // check if size should be hidden
    const params = new URLSearchParams(window.location.search);
    if (params.get('filterAnimalType') === 'Cat' || params.get('filterAnimalType') === 'Other') {
        sizeBlock.classList.add('hidden');
    }

    sizeBlock.append(sizeLabelElement);
    sidebar.append(sizeBlock);

    const sizeList = sizeOptions.split(',');
    sizeList.forEach((size) => {
        const sizeListLabel = document.createElement('label');
        sizeListLabel.for = size;
        sizeListLabel.className = 'radio-container';
        sizeListLabel.innerHTML = size;
        const sizeRadio = document.createElement('input');
        sizeRadio.type = 'checkbox';
        sizeRadio.name = 'size';
        sizeRadio.id = size;
        sizeRadio.value = placeholders[size.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
            if (+match === 0) return '';
            return index === 0 ? match.toLowerCase() : match.toUpperCase();
        })];
        sizeRadio.addEventListener('click', () => {
            callAnimalList().then((data) => {
                buildResultsContainer(data);
            });
        });
        sizeListLabel.append(sizeRadio);
        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        sizeListLabel.append(checkmark);
        sizeBlock.append(sizeListLabel);
    });

    // create mobile filter buttons
    const mobileContainer = document.createElement('div');
    mobileContainer.className = 'mobile-button-container';

    // create clear button
    const clearMobileButton = document.createElement('button');
    clearMobileButton.className = 'sidebar-clear-mobile';
    clearMobileButton.innerHTML = clearLabel;
    clearMobileButton.addEventListener('click', clearFilters);
    mobileContainer.append(clearMobileButton);

    // create filter button
    const mobileFilterButton = document.createElement('button');
    mobileFilterButton.className = 'filter-mobile';
    mobileFilterButton.innerHTML = applyFiltersLabel;
    mobileFilterButton.addEventListener('click', closeModal);
    mobileContainer.append(mobileFilterButton);

    sidebar.append(mobileContainer);
}

function buildResultsContainer(data) {
    // clear any previous results
    const block = document.querySelector('.adopt-search-results.block');
    const resultsContainer = document.querySelector('.default-content-wrapper.results');
    const sidebarElement = document.querySelector('.sidebar');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }

    // show pagination
    const pagination = document.querySelector('.pagination.hidden');
    pagination?.classList.remove('hidden');

    // temporarily inserting results into empty section on page
    let tempResultsContainer = document.getElementById('results-container');
    if (!tempResultsContainer) {
        tempResultsContainer = block.closest('.section').nextElementSibling;
        tempResultsContainer.id = 'results-container';
    }

    tempResultsContainer.classList.add('adopt-search-results');
    tempResultsContainer.classList.add('list');
    let tempResultsBlock = document.getElementById('results-block');
    if (!tempResultsBlock) {
        tempResultsBlock = tempResultsContainer.firstElementChild;
    }
    tempResultsBlock.classList.add('results');
    tempResultsBlock.innerHTML = '';
    tempResultsBlock.id = 'results-block';
    animalArray = data.animal;

    // adding filter sidebar

    if (!sidebarElement) {
        const sidebar = document.createElement('div');
        sidebar.classList.add('sidebar');
        buildFilterSidebar(sidebar);
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        tempResultsContainer.prepend(overlay);
        tempResultsContainer.prepend(sidebar);
    }

    // add sorted label
    const sortLabel = document.querySelector('.sorted-label');
    if (!sortLabel) {
        const label = document.createElement('span');
        label.className = 'sorted-label';
        label.innerHTML = sortedLabel;
        tempResultsContainer.append(label);
    }

    // add mobile filter buttton
    const filterToggle = document.querySelector('.filter-button');
    if (!filterToggle) {
        const filterButton = document.createElement('button');
        filterButton.className = 'filter-button';
        filterButton.innerHTML = `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_1990_3857)"><path d="M5.83008 12.4711H2.01074" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23.4883 12.4711H10.7559" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14.7441 20.5883H2.01074" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23.4883 20.5883H19.6699" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14.7441 4.49451H2.01074" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23.4883 4.49451H19.6699" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5.83008 12.4731C5.83008 12.7965 5.89379 13.1168 6.01756 13.4156C6.14134 13.7144 6.32276 13.986 6.55147 14.2147C6.78018 14.4434 7.0517 14.6248 7.35053 14.7486C7.64935 14.8724 7.96963 14.9361 8.29308 14.9361C8.61652 14.9361 8.9368 14.8724 9.23563 14.7486C9.53445 14.6248 9.80597 14.4434 10.0347 14.2147C10.2634 13.986 10.4448 13.7144 10.5686 13.4156C10.6924 13.1168 10.7561 12.7965 10.7561 12.4731C10.7561 12.1496 10.6924 11.8293 10.5686 11.5305C10.4448 11.2317 10.2634 10.9602 10.0347 10.7315C9.80597 10.5028 9.53445 10.3213 9.23563 10.1976C8.9368 10.0738 8.61652 10.0101 8.29308 10.0101C7.96963 10.0101 7.64935 10.0738 7.35053 10.1976C7.0517 10.3213 6.78018 10.5028 6.55147 10.7315C6.32276 10.9602 6.14134 11.2317 6.01756 11.5305C5.89379 11.8293 5.83008 12.1496 5.83008 12.4731Z" stroke="#09090D" stroke-width="1.5"/>
        <path d="M14.7439 20.5901C14.7439 21.2433 15.0034 21.8698 15.4653 22.3317C15.9272 22.7936 16.5537 23.0531 17.2069 23.0531C17.8601 23.0531 18.4866 22.7936 18.9485 22.3317C19.4104 21.8698 19.6699 21.2433 19.6699 20.5901C19.6699 19.9368 19.4104 19.3104 18.9485 18.8485C18.4866 18.3866 17.8601 18.1271 17.2069 18.1271C16.5537 18.1271 15.9272 18.3866 15.4653 18.8485C15.0034 19.3104 14.7439 19.9368 14.7439 20.5901Z" stroke="#09090D" stroke-width="1.5"/>
        <path d="M14.7439 4.35607C14.7439 5.00929 15.0034 5.63577 15.4653 6.09767C15.9272 6.55957 16.5537 6.81907 17.2069 6.81907C17.8601 6.81907 18.4866 6.55957 18.9485 6.09767C19.4104 5.63577 19.6699 5.00929 19.6699 4.35607C19.6699 3.70284 19.4104 3.07636 18.9485 2.61446C18.4866 2.15256 17.8601 1.89307 17.2069 1.89307C16.5537 1.89307 15.9272 2.15256 15.4653 2.61446C15.0034 3.07636 14.7439 3.70284 14.7439 4.35607Z" stroke="#09090D" stroke-width="1.5"/>
        </g><defs><clipPath id="clip0_1990_3857"><rect width="24" height="24" fill="white" transform="translate(0.75 0.471069)"/></clipPath></defs></svg>${filterCta}`;
        filterButton.addEventListener('click', openModal);
        tempResultsContainer.append(filterButton);
    }

    currentPage = 1;
    calculatePagination(1);
}

window.onload = callBreedList('null').then((data) => {
    breedList = data;
    updateBreedListSelect();
    const tempResultsContainer = document.querySelector('.section.adopt-search-results-container').closest('.section').nextElementSibling;
    const div = document.createElement('div');
    div.className = 'pagination hidden';

    // add pagination
    const previousButton = document.createElement('button');
    previousButton.id = ('btn_prev');
    previousButton.addEventListener('click', prevPage);
    previousButton.innerText = '<';
    const nextButton = document.createElement('button');
    nextButton.id = ('btn_next');
    nextButton.addEventListener('click', nextPage);
    nextButton.innerText = '>';
    div.append(previousButton);
    const paginationNumbers = document.createElement('div');
    paginationNumbers.className = 'pagination-numbers';
    div.append(paginationNumbers);
    div.append(nextButton);
    tempResultsContainer.append(div);

    // When the page loads, check if there are any query parameters in the URL
    const params = new URLSearchParams(window.location.search);

    // If there are, select the corresponding filters - Top filters first
    if (params.has('zipPostal')) {
        const petZip = document.getElementById('zip');
        petZip.value = params.get('zipPostal');
        const petType = document.getElementById('pet-type');
        const petTypes = petType.options;
        for (let i = 0; i < petTypes.length; i += 1) {
            if (petTypes[i].value === params.get('filterAnimalType')) {
                petType.selectedIndex = i;
            }
        }

        const petBreed = document.getElementById('breed');
        const petBreeds = petBreed.options;
        for (let i = 0; i < petBreeds.length; i += 1) {
            if (petBreeds[i].value === params.get('filterBreed')) {
                petBreed.selectedIndex = i;
            }
        }

        if (petType?.value === 'Other' || petType?.value === 'null') {
            petBreed.setAttribute('disabled', '');
        } else {
            callBreedList(petType?.value).then((data) => {
                breedList = data;
                updateBreedListSelect().then(() => {
                for (let i = 0; i < petBreeds.length; i += 1) {
                    if (petBreeds[i].value === params.get('filterBreed')) {
                        petBreed.selectedIndex = i;
                    }
                }
                });
            })
        }
        callAnimalList().then((response) => {
            buildResultsContainer(response);
            // Populate Sidebar filters
            const petRadius = document.getElementById('radius');
            const petRadiusOptions = petRadius.options;
            for (let i = 0; i < petRadiusOptions.length; i += 1) {
                if (petRadiusOptions[i].value === params.get('milesRadius')) {
                    petRadius.selectedIndex = i;
                }
            }
            const genderRadios = document.querySelectorAll('input[name="gender"]');
            for (let i = 0; i < genderRadios.length; i += 1) {
                const genderArray = params.get('filterGender')?.split(',');
                genderArray?.forEach((gender) => {
                    if (genderRadios[i].value === gender) {
                        genderRadios[i].checked = true;
                    }
                })
            }
            const ageRadios = document.querySelectorAll('input[name="age"]');
            for (let i = 0; i < ageRadios.length; i += 1) {
                const ageArray = params.get('filterAge')?.split(',');
                ageArray?.forEach((age) => {
                    if (ageRadios[i].value === age) {
                        ageRadios[i].checked = true;
                    }
                })
            }
            const sizeRadios = document.querySelectorAll('input[name="size"]');
            for (let i = 0; i < sizeRadios.length; i += 1) {
                const sizeArray = params.get('filterSize')?.split(',');
                sizeArray?.forEach((size) => {
                    if (sizeRadios[i].value === size) {
                        sizeRadios[i].checked = true;
                    }
                })
            }
            callAnimalList().then((data) => {
                buildResultsContainer(data);
            });
        });
    }
});

export default async function decorate(block) {
    const form = document.createElement('form');
    form.setAttribute('role', 'search');
    form.className = 'adopt-search-results-box-wrapper';
    form.action = ' ';
    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        const zipInput = document.getElementById('zip');
        const errorSpan = document.getElementById('zip-error');
        const isValidZip = /^(\d{5}|[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d)$/.test(zipInput.value);
        if (isValidZip) {
        zipInput.classList.remove('error');
        errorSpan.classList.remove('active');
        zipInput.setAttribute('aria-describedby', '');
        zipInput.ariaInvalid = 'false';
            callAnimalList().then((data) => {
                buildResultsContainer(data);
            });
        } else {
        zipInput.classList.add('error');
        errorSpan.classList.add('active');
        zipInput.setAttribute('aria-describedby', 'zip-error');
        zipInput.ariaInvalid = 'true';
        }
    });

    // Building Pet Type select element
    const petTypeContainer = document.createElement('div');
    const petTypeLabelElement = document.createElement('label');
    petTypeLabelElement.for = 'pet-type';
    petTypeLabelElement.innerText = petTypeLabel;

    const petTypeSelect = document.createElement('select');
    petTypeSelect.name = 'pet-type';
    petTypeSelect.id = 'pet-type';
    petTypeSelect.className = 'form-select-wrapper';
    const petOption = document.createElement('option');
    petOption.innerText = 'Any';
    petOption.value = null;

    petTypeSelect.append(petOption);
    const petTypes = petTypeValues.split(',');
        petTypes.forEach((petType) => {
            const petTypeOption = document.createElement('option');
            petTypeOption.innerText = petType;
            petTypeOption.value = petType;
            petTypeSelect.append(petTypeOption);
        });
    petTypeContainer.append(petTypeLabelElement);
    petTypeContainer.append(petTypeSelect);
    petTypeSelect.addEventListener('change', () => {
        clearFilters();
        callBreedList(petTypeSelect.value.toLowerCase()).then((data) => {
            breedList = data;
            const radioSize = document.querySelector('.radio-size');
            if (petTypeSelect.value.toLowerCase() === 'cat' || petTypeSelect.value.toLowerCase() === 'other') {
                radioSize?.classList.add('hidden');
            } else {
                radioSize?.classList.remove('hidden');
            }
            updateBreedListSelect();
        });
    });

    // Building Breed List select element
    const breedContainer = document.createElement('div');
    const breedLabelElement = document.createElement('label');
    breedLabelElement.for = 'breed';
    breedLabelElement.innerText = breedLabel;

    const breedSelect = document.createElement('select');
    breedSelect.name = 'breed';
    breedSelect.id = 'breed';
    breedSelect.className = 'form-select-wrapper';
    const option = document.createElement('option');
    option.innerText = breedPlaceholder;
    option.value = '';
    breedSelect.addEventListener('change', () => {
        clearFilters();
    });

    breedSelect.append(option);

    breedContainer.append(breedLabelElement);
    breedContainer.append(breedSelect);

    const zipContainer = document.createElement('div');
    const zipLabelElem = document.createElement('label');
    zipLabelElem.setAttribute('for', 'zipCode');
    zipLabelElem.innerText = zipLabel;

    const zipInput = document.createElement('input');
    zipInput.setAttribute('aria-label', zipPlaceholder);
    zipInput.className = 'zipCode';
    zipInput.type = 'text';
    zipInput.name = 'zipPostal';
    zipInput.id = 'zip';
    zipInput.title = zipErrorMessage;
    zipInput.placeholder = zipPlaceholder;
    zipInput.addEventListener('blur', () => {
        const isValidZip = /^(\d{5}|[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d)$/.test(zipInput.value);
        if (isValidZip) {
        zipInput.classList.remove('error');
        errorSpan.classList.remove('active');
        zipInput.setAttribute('aria-describedby', '');
        zipInput.ariaInvalid = 'false';
            callAnimalList().then((data) => {
                buildResultsContainer(data);
            });
        } else {
        zipInput.classList.add('error');
        errorSpan.classList.add('active');
        zipInput.setAttribute('aria-describedby', 'zip-error');
        zipInput.ariaInvalid = 'true';
        }
    });

    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.id = 'zip-error';
    errorSpan.textContent = zipErrorMessage;

    zipContainer.append(zipLabelElem);
    zipContainer.append(zipInput);
    zipContainer.append(errorSpan);

    const clearButton = document.createElement('button');
    clearButton.setAttribute('id', 'clearButton');
    clearButton.setAttribute('type', 'button');
    clearButton.innerHTML = '&#10005;';

    zipInput.addEventListener('input', () => {
        if (zipInput.value.trim() !== '') {
            clearButton.classList.add('show');
        } else {
            clearButton.classList.remove('show');
        }
    });

    zipInput.addEventListener('focus', () => {
        if (zipInput.value.trim() !== '') {
            clearButton.classList.add('show');
        }
    });
    zipInput.addEventListener('focusout', () => {
        clearButton.classList.remove('show');
    });

    clearButton.addEventListener('click', () => {
        zipInput.value = '';
        zipInput.focus();
        clearButton.classList.remove('show');
    });
    zipContainer.append(clearButton);
    //   form.append(clearButton);

    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'adopt-search-button';
    button.textContent = searchAlertText;

    const saveButton = document.createElement('button');
    saveButton.className = 'adopt-save-search-button';
    saveButton.innerHTML = `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_1997_2586)"><path d="M10 22.221C10.127 22.6537 10.3908 23.0336 10.7518 23.3039C11.1127 23.5741 11.5516 23.7202 12.0025 23.7202C12.4534 23.7202 12.8923 23.5741 13.2532 23.3039C13.6142 23.0336 13.878 22.6537 14.005 22.221" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3.47104V1.22104" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3.47104C13.9891 3.47104 15.8968 4.26122 17.3033 5.66774C18.7098 7.07426 19.5 8.98192 19.5 10.971C19.5 18.017 21 19.221 21 19.221H3C3 19.221 4.5 17.305 4.5 10.971C4.5 8.98192 5.29018 7.07426 6.6967 5.66774C8.10322 4.26122 10.0109 3.47104 12 3.47104Z" stroke="#09090D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g><defs>
        <clipPath id="clip0_1997_2586"><rect width="24" height="24" fill="white" transform="translate(0 0.471039)"/></clipPath></defs></svg>
        ${createSearchAlert}`;
    saveButton.addEventListener('click', (event) => {
        setSaveSearch(event);
    })
    form.append(petTypeContainer);

    form.append(breedContainer);

    form.append(zipContainer);
    form.append(button);
    form.append(saveButton);

    const heroContainer = document.querySelector('.columns.hero');

    if (heroContainer?.firstElementChild?.lastElementChild != null) {
        const formWrapper = document.createElement('div');
        formWrapper.className = 'adopt-search-results-wrapper';
        formWrapper.append(form);
        block.innerHTML = '';

        heroContainer.firstElementChild.lastElementChild.append(formWrapper);
    } else {
        block.innerHTML = '';
        block.append(form);
    }

    //   const usp = new URLSearchParams(window.location.search);
    //   block.querySelector('.search-input').value = usp.get('q') || '';
}