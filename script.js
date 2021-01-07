/*
 * @Author: Gavin
 * @Date:   2021-01-07 14:40:56
 * @Last Modified by:   Gavin
 * @Last Modified time: 2021-01-07 18:11:43
 */

// TIMEOUT WHEN THE REQUEST TAKES TOO LONG
const TIMEOUT_SEC = 10;

const timeout = function(s) {
    return new Promise(function(_, reject) {
        setTimeout(function() {
            reject(new Error(`Request took too long! Timeout after ${s} seconds`));
        }, s * 1000);
    });
};

// LOAD COUNTRIES WHEN LOADS THE WINDOW
window.addEventListener('load', async function() {
    try {
        document.querySelector('.content__countries').insertAdjacentHTML('afterbegin', `<div class="spinner">
                    <img src="images/loading.svg" alt="Loader">
                </div>`);


        // GETTING LIST OF COUNTRIES FROM COVID19 API
        const listOfCountriesRes = await Promise.race([fetch('https://api.covid19api.com/countries'), timeout(TIMEOUT_SEC)]);
        if (!listOfCountriesRes.ok) {
            throw new Error(listOfCountriesRes.status);
        }
        const listOfCountriesData = await listOfCountriesRes.json();
        const listOfCountriesISO2 = listOfCountriesData.map(country => country.ISO2);

        // GETTING DATA FROM REST COUNTRIES API
        const url = `https://restcountries.eu/rest/v2/alpha?codes=${listOfCountriesISO2.join(';')}`;
        const listOfCountriesRes1 = await Promise.race([fetch(url), timeout(TIMEOUT_SEC)]);
        if (!listOfCountriesRes.ok) {
            throw new Error(listOfCountriesRes.status);
        }
        const listOfCountriesData1 = await listOfCountriesRes1.json();

        // SORT COUNTRIES BY ALPHABETICAL ORDER
        const listOfCountries = listOfCountriesData1.filter(country => country != null);
        listOfCountries.sort(function(a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase()) //sort string ascending
                return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase())
                return 1;
            return 0; //default return value (no sorting)
        });

        // CLEAR SPINNER AFTER ALL THE DATA IS RETURNED


        // GETTING COUNTRY FLAG/NAME/REGION/ISO FROM REST COUNTRIES API
        const listOfCountriesFlag = listOfCountries.map(country => country.flag);
        const listOfCountriesName = listOfCountries.map(country => country.name);
        const listOfCountriesISO = listOfCountries.map(country => country.alpha2Code);
        const listOfCountriesRegion = listOfCountries.map(country => {
            if (country.region)
                return country.region;
            else
                return "None";
        });

        // CREATING CARDS FOR EACH COUNTRY
        let markup = '';
        for (let i = 0; i < listOfCountriesFlag.length; i++) {
            markup += `
    		<div class="content__countries-card" data-iso=${listOfCountriesISO[i]}>
                <img class="content__countries-card-flag" src="${listOfCountriesFlag[i]}" alt="${listOfCountriesName[i]}">
                <p class="content__countries-card-info">
                    <span class="content__countries-card-info--boldest">${listOfCountriesName[i]}</span>
                    <span class="content__countries-card-info--bold">Region: <span class="content__countries-card-info--light">${listOfCountriesRegion[i]}</span></span>
                </p>
            </div>
    	`;
        }
        document.querySelector('.content__countries').innerHTML = markup;
    } catch (err) {
        document.querySelector('.content__countries').innerHTML = `<h1 class="error">${err}. Please reload the page.</h1>`;
    }
});

// SEARCH BAR FILTER
document.querySelector('.searchbar').addEventListener('keyup', function(){
	const input = document.querySelector('.searchbar');
	const filter = input.value.toUpperCase();
	const container = document.querySelector(".content__countries");
    const countryCards = container.querySelectorAll('.content__countries-card');
    for (let i = 0; i < countryCards.length; i++) {
    	const info = countryCards[i].getElementsByTagName('p')[0];
    	const countryName = info.querySelector('.content__countries-card-info--boldest');
    	const txtValue = countryName.textContent;
        if (txtValue.toUpperCase().startsWith(filter)) {
            countryCards[i].classList.remove("hidden");
        } else {
            countryCards[i].classList.add("hidden");
        }
    }

    if (Array.from(countryCards).every(card => card.classList.contains('hidden')) && !document.querySelector('.error')) {
    	if (!document.querySelector('.noResult')) {
    		document.querySelector('.content__countries').insertAdjacentHTML('afterbegin', `<h1 class="noResult">No results found.</h1>`);
    	}
    } else {
    	if (document.querySelector('.noResult')) {
    		document.querySelector('.noResult').remove();
    	}
    }
});

document.querySelector('.content__countries').addEventListener('click', async function(e){
	console.log(e.target.closest('.content__countries-card'));
});

