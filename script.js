/*
 * @Author: Gavin
 * @Date:   2021-01-07 14:40:56
 * @Last Modified by:   Gavin
 * @Last Modified time: 2021-01-08 03:15:02
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

// LOAD COUNTRIES WHEN LOADING SITE
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
document.querySelector('.searchbar').addEventListener('keyup', function() {
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

// GETTING DATA FOR POPUP FROM COVID19 API
document.querySelector('.content__countries').addEventListener('click', async function(e) {
    try {
        if (!e.target.closest('.content__countries-card-flag')) return;
        // FIGURE OUT WHICH COUNTRY THE USER CLICKED
        const parentEl = e.target.closest('.content__countries-card-flag').parentElement;
        const iso = parentEl.dataset.iso;
        document.querySelector('.overlay').classList.toggle('hidden');

        // LOAD SPINNER
        document.querySelector('.overlay__content').insertAdjacentHTML('afterbegin', `<div class="spinner">
                    <img src="images/loading.svg" alt="Loader">
                </div>`);

        // LOAD DATA FROM COVID19 API
        const res = await Promise.race([fetch(`https://api.covid19api.com/total/country/${iso}`), timeout(TIMEOUT_SEC)]);
        if (!res.ok) {
            document.querySelector('.spinner').remove();
            throw new Error(res.status);
        }
        const data = await res.json();
        if (data.length == 0) {
            document.querySelector('.spinner').remove();
            throw new Error('No info was found');
        }
        document.querySelector('.spinner').remove();
        // GETTING INFO FROM MOST RECENT DATE
        const lastData = data[data.length - 1];
        const countryName = lastData.Country;
        const confirmed = lastData.Confirmed;
        const deaths = lastData.Deaths;
        const recovered = lastData.Recovered;
        const active = lastData.Active;
        const caseFatality = ((deaths / confirmed) * 100).toFixed(2);

        // INFO FOR THE CHART
        const firstDayMonths = data.filter(element => element.Date.includes('-01T'));
        const listOfDates = firstDayMonths.map(element => element.Date).map(date => date.slice(0, date.indexOf('T')));
        const listOfActive = firstDayMonths.map(element => element.Active);
        let updatedDate = new Date(lastData.Date);
        updatedDate = updatedDate.toString().split(' ');
        document.querySelector('.overlay__content').insertAdjacentHTML('afterbegin', `
    		<div class="overlay__content-left">
                <p class="overlay__content-left-info">
                    <span class="boldest">${countryName}</span>
                    <span class="bold">Confirmed: <span class="light">${confirmed}</span></span>
                    <span class="bold">Deaths: <span class="light">${deaths}</span></span>
                    <span class="bold">Recovered: <span class="light">${recovered}</span></span>
                    <span class="bold">Active: <span class="light">${active}</span></span>
                    <span class="bold">Case-fatality: <span class="light">${caseFatality} %</span></span>
                    <span class="bold">Date updated: <span class="light">${updatedDate[1]}, ${updatedDate[2]}, ${updatedDate[3]}</span></span>
                </p>
            </div>
            <div class="overlay__content-right">
                <figure class="highcharts-figure">
                    <div id="container"></div>
                </figure>
            </div>    	
        	`);

        // SETTING UP HIGHCHARTS
        Highcharts.chart('container', {
            chart: {
                type: 'line'
            },
            title: {
                text: 'COVID19 Active Cases'
            },
            xAxis: {
                categories: listOfDates
            },
            yAxis: {
                title: {
                    text: 'Active Cases'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: true
                }
            },
            series: [{
                name: countryName,
                data: listOfActive
            }]
        });


    } catch (err) {
        document.querySelector('.overlay__content').insertAdjacentHTML('afterbegin', `<h1 class="error">${err}. Please try again.</h1>`);
    }
});


// Close the overlay and clear out info in the overlay
document.querySelector('.overlay').addEventListener('click', function(e) {
    if (e.target === document.querySelector('.overlay') || e.target === document.querySelector('.overlay__close')) {
        document.querySelector('.overlay').classList.toggle('hidden');
        while (document.querySelector('.overlay__content').childNodes.length > 2) {
            document.querySelector('.overlay__content').removeChild(document.querySelector('.overlay__content').firstChild);
        }
    }
});