var map;
var geoJSON;
var request;
var gettingData = false;
var openWeatherMapKey = "73c3d994dd080efa8f6beab2a4662696";

var x = document.getElementById("demo");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
};
getLocation();

let orgAddress;
function showPosition(position) {
    x.innerHTML = "Latitude: " + position.coords.latitude +
        "<br>Longitude: " + position.coords.longitude;
    var relocate = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    map.setCenter(relocate);
    $.ajax({
        url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
        method: 'GET'
    }).then(function (response) {
        let currentAddress = response.results[0].formatted_address;
        orgAddress = currentAddress
        x.innerHTML = "Current Address: " + currentAddress;
        // +
        //"<br>Longitude: " + position.coords.longitude;
        console.log(response.results[0].formatted_address);
    });
};

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            x.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            x.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML = "An unknown error occurred."
            break;
    }
};

function initialize() {
    var mapOptions = {
        zoom: 6,
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    console.log(google.maps);
    // Add interaction listeners to make weather requests
    google.maps.event.addListener(map, 'idle', checkIfDataRequested);
    // Sets up and populates the info window with details
    map.data.addListener('click', function (event) {
        infowindow.setContent(
            "<img src=" + event.feature.getProperty("icon") + ">"
            + "<br /><strong>" + event.feature.getProperty("city") + "</strong>"
            + "<br />" + event.feature.getProperty("temperature") + "&deg;F"
            + "<br />" + event.feature.getProperty("weather")
        );
        infowindow.setOptions({
            position: {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            },
            pixelOffset: {
                width: 0,
                height: -15
            }
        });
        infowindow.open(map);
    });
};

var checkIfDataRequested = function () {
    // Stop extra requests being sent
    while (gettingData === true) {
        request.abort();
        gettingData = false;
    }
    getCoords();
};

// Get the coordinates from the Map bounds
var getCoords = function () {
    var bounds = map.getBounds();
    var NE = bounds.getNorthEast();
    var SW = bounds.getSouthWest();
    getWeather(NE.lat(), NE.lng(), SW.lat(), SW.lng());
};
// Make the weather request
var getWeather = function (northLat, eastLng, southLat, westLng) {
    gettingData = true;
    var requestString = "http://api.openweathermap.org/data/2.5/box/city?bbox="
        + westLng + "," + northLat + "," //left top
        + eastLng + "," + southLat + "," //right bottom
        + map.getZoom() + "&units=imperial"
        + "&cluster=yes&format=json"
        + "&APPID=" + openWeatherMapKey;
    request = new XMLHttpRequest();
    request.onload = proccessResults;
    request.open("get", requestString, true);
    request.send();
    console.log(requestString);
};

// Take the JSON results and proccess them
var proccessResults = function () {
    console.log(this);
    var results = JSON.parse(this.responseText);
    if (results.list.length > 0) {
        resetData();
        for (var i = 0; i < results.list.length; i++) {
            geoJSON.features.push(jsonToGeoJson(results.list[i]));
        }
        drawIcons(geoJSON);
    }
};
var infowindow = new google.maps.InfoWindow();
// For each result that comes back, convert the data to geoJSON
var jsonToGeoJson = function (weatherItem) {
    var feature = {
        type: "Feature",
        properties: {
            city: weatherItem.name,
            weather: weatherItem.weather[0].main,
            temperature: weatherItem.main.temp,
            min: weatherItem.main.temp_min,
            max: weatherItem.main.temp_max,
            humidity: weatherItem.main.humidity,
            pressure: weatherItem.main.pressure,
            windSpeed: weatherItem.wind.speed,
            windDegrees: weatherItem.wind.deg,
            windGust: weatherItem.wind.gust,
            icon: "http://openweathermap.org/img/w/"
                + weatherItem.weather[0].icon + ".png",
            coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
        },
        geometry: {
            type: "Point",
            coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
        }
    };
    // Set the custom marker icon
    map.data.setStyle(function (feature) {
        return {
            icon: {
                url: feature.getProperty('icon'),
                anchor: new google.maps.Point(25, 25)
            }
        };
    });
    // returns object
    return feature;
};
// Add the markers to the map
var drawIcons = function (weather) {
    map.data.addGeoJson(geoJSON);
    // Set the flag to finished
    gettingData = false;
};
// Clear data layer and geoJSON
var resetData = function () {
    geoJSON = {
        type: "FeatureCollection",
        features: []
    };
    map.data.forEach(function (feature) {
        map.data.remove(feature);
    });
};
google.maps.event.addDomListener(window, 'load', initialize);
/*
var autocomplete = new google.maps.places.Autocomplete($("#srcinput"));

autocomplete.bindTo('bounds', map);
autocomplete.setFields(['address_components', 'geometry', 'icon', 'name']);


var infowindow = new google.maps.InfoWindow();
var infowindowContent = document.getElementById('map-canvas');
infowindow.setContent(infowindowContent);
//var marker = new google.maps.Marker({
//  map: map,
//anchorPoint: new google.maps.Point(0, -29)
//});

var address = '';
if (place.address_components) {
    address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
    ].join(' ');
}


infowindowContent.children['place-address'].textContent = address;




autocomplete.addListener('place_changed', function () {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place.name + "'");
        return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
    } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);  // Why 17? Because it looks good.
    }
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    var address = '';
    if (place.address_components) {
        address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
    }

    infowindowContent.children['place-icon'].src = place.icon;
    infowindowContent.children['place-name'].textContent = place.name;
    infowindowContent.children['place-address'].textContent = address;
    infowindow.open(map, marker);
});

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
function setupClickListener(id, types) {
    var radioButton = document.getElementById(id);
    radioButton.addEventListener('click', function () {
        autocomplete.setTypes(types);
    });
}

setupClickListener('changetype-all', []);
setupClickListener('changetype-address', ['address']);
setupClickListener('changetype-establishment', ['establishment']);
setupClickListener('changetype-geocode', ['geocode']);

document.getElementById('use-strict-bounds')
    .addEventListener('click', function () {
        console.log('Checkbox clicked! New state=' + this.checked);
        autocomplete.setOptions({ strictBounds: this.checked });
    });*/













$('#btnSubmit').on('click', function (event) {
    event.preventDefault();
    var destAddress = $('#srcinpt').val();
    console.log(destAddress);
    $.ajax({

        url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?address=${destAddress}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
        //url: `https://maps.googleapis.com/maps/api/geocode/json?address=${destAddress}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
        method: 'GET'
    }).then(function (response) {
        $('#btnSubmit').keypress(function () {

            $.ajax({

                url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${destAddress}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
                method: 'GET'

            }).then(function (response) {

            });
        });
        console.log(response.results[0].geometry.location);
        moveToLocation(response.results[0].geometry.location.lat, response.results[0].geometry.location.lng);
        $('#srcinpt').val('');
        console.log(response.results[0].geometry.location);
        moveToLocation(response.results[0].geometry.location.lat, response.results[0].geometry.location.lng);
        $('#srcinpt').val('');
    });
    let disMatrixURL = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${orgAddress}&destinations=${destAddress}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`
    console.log(orgAddress);
    $.ajax({
        url: disMatrixURL,
        method: 'GET'
    }).then(function (response) {
        console.log(response);
    });

    var key = "73c3d994dd080efa8f6beab2a4662696";
    var url = "https://api.openweathermap.org/data/2.5/forecast";
    var cityCountry = $('#srcinpt').val();

    $.ajax({
        url: url, //API Call
        dataType: "json",
        type: "GET",
        data: {
            q: cityCountry,
            appid: key,
            units: "imperial",
            cnt: "5"
        },
        success: function (data) {
            console.log('Received data:', data) // For testing
            var wf = "";
            wf += "<div class='card ctycrd'> <div class='card-body'>" + data.city.name + "</div></div>"; // City (displays once)
            $.each(data.list, function (index, val) {
                wf += "<div class='card col-2'><div class='card-body'>" // Opening paragraph tag
                wf += "<b>Day " + (index + 1) + "</b>: " // Day
                wf += val.main.temp + "&degF" // Temperature
                wf += "<span> | " + val.weather[0].description + "</span>"; // Description
                wf += "<img src='https://openweathermap.org/img/w/" + val.weather[0].icon + ".png'>" // Icon
                wf += "</div></div>" // Closing paragraph tag
            });
            $("#weather-forecast").html(wf);
            console.log('#weather-forecast')

        }

    });
});

function moveToLocation(lat, lng) {
    var center = new google.maps.LatLng(lat, lng);
    map.panTo(center);
};

/*   Leave this in for now, just in case we need to do an ajax call to reverse GeoCode
$.ajax({
    
    url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
    method: 'GET'

}).then(function (response){

    console.log(response.results[0].formatted_address);

});
var cityCountry = $('#srcinpt').val();
  console.log(cityCountry);
  let zipURL = `http://api.openweathermap.org/data/2.5/forecast?zip=${cityCountry}&appid=${openWeatherMapKey}`
  let qURL= `http://api.openweathermap.org/data/2.5/forecast?q=${cityCountry}&appid=${openWeatherMapKey}`
  $.ajax({
    url: parseInt(cityCountry) ? zipURL:qURL,
    method: 'GET'
  }).then(function(response){
    console.log(response);
    moveToLocation(response.city.coord.lat, response.city.coord.lon);
    $('#srcinpt').val('');
  });*/
