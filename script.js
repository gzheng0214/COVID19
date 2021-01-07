/*
 * @Author: Gavin
 * @Date:   2021-01-07 14:40:56
 * @Last Modified by:   Gavin
 * @Last Modified time: 2021-01-07 16:06:19
 */

window.addEventListener('load', async function() {
    document.querySelector('.content__countries').insertAdjacentHTML('afterbegin', `<div class="spinner">
                    <img src="images/loading.svg" alt="Loader">
                </div>`);


    // GETTING LIST OF COUNTRIES FROM COVID19 API
    const listOfCountriesRes = await fetch('https://api.covid19api.com/countries');
    const listOfCountriesData = await listOfCountriesRes.json();
    const listOfCountriesISO2 = listOfCountriesData.map(country => country.ISO2);

    // GETTING DATA FROM REST COUNTRIES API
    const url = `https://restcountries.eu/rest/v2/alpha?codes=${listOfCountriesISO2.join(';')}`;
    const listOfCountriesRes1 = await fetch(url);
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
    document.querySelector('.content__countries').innerHTML = '';

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
});