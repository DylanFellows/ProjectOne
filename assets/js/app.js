var map;
var geoJSON;
var request;
var gettingData = false;
var openWeatherMapKey = "73c3d994dd080efa8f6beab2a4662696";
var directionsService;
var directionsDisplay;
var destAddress;
var x = document.getElementById("demo");

var lat, lon, api_url;

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
        navigator.geolocation.getCurrentPosition(gotLocation);

        function gotLocation(position) {
            lat = position.coords.latitude;
            lon = position.coords.longitude;

            api_url = 'http://api.openweathermap.org/data/2.5/weather?lat=' +
                lat + '&lon=' +
                lon + '&units=imperial&appid=73c3d994dd080efa8f6beab2a4662696';
            // http://api.openweathermap.org/data/2.5/weather?q=London,uk&callback=test&appid=b1b15e88fa79722

            $.ajax({
                url: api_url,
                method: 'GET',
                success: function (data) {



                    var tempr = data.main.temp;
                    var location = data.name;
                    var desc = data.weather.description;


                    $('#temp').text(tempr + '°' + "   |   " + location);

                }
            });
        }

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

// this re-centers the map to your current location.
function showPosition(position) {
    x.innerHTML = "Latitude: " + position.coords.latitude +
        "<br>Longitude: " + position.coords.longitude;
    var relocate = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    //console.log(google.maps);
    map.setCenter(relocate);

    $.ajax({
        url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
        method: 'GET'
    }).then(function (response) {
        let currentAddress = response.results[0].formatted_address;
        orgAddress = currentAddress
        x.innerHTML = "Current Address: " + currentAddress;
        console.log(response.results[0].formatted_address);
    });
};

function initialize() {
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    var mapOptions = {
        zoom: 6,
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    console.log(google.maps);
    // Add interaction listeners to make weather requests
    google.maps.event.addListener(map, 'idle', checkIfDataRequested);
    directionsDisplay.setMap(map);

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


// Create the search box and link it to the UI element.
var input = document.getElementById('srcinpt');

var searchBox = new google.maps.places.SearchBox(input);
//map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
// Bias the SearchBox results towards current map's viewport.

//map.addListener('bounds_changed', function () {
//    searchBox.setBounds(map.getBounds());
//});
var markers = [];
// Listen for the event fired when the user selects a prediction and retrieve
// more details for that place.


searchBox.addListener('places_changed', function () {

    var places = searchBox.getPlaces();

    console.log(places);

    if (places.length == 0) {
        return;
    }

    // Clear out the old markers.
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function (place) {
        if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
        }
        var icon = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };

        // Create a marker for each place.
        markers.push(new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location
        }));

        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    });
    map.fitBounds(bounds);

    var key = "73c3d994dd080efa8f6beab2a4662696";
    var url = "https://api.openweathermap.org/data/2.5/forecast";

    $.ajax({
        url: url, //API Call
        dataType: "json",
        type: "GET",
        data: {
            q: places[0].vicinity,
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
            console.log('#weather-forecast');

        }

    });

});

let disMatrixURL = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${orgAddress}&destinations=${destAddress}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`
console.log(orgAddress);
$.ajax({
    url: disMatrixURL,
    method: 'GET'
}).then(function (response) {
    console.log(response);
});


$('#btnSubmit').on('click', function (event) {

    event.preventDefault();
    destAddress = $('#srcinpt').val();
    console.log(destAddress);

    $.ajax({
        url: `https://maps.googleapis.com/maps/api/geocode/json?address=${destAddress}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
        method: 'GET'
    }).then(function (response) {
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

    let directURL = `https://maps.googleapis.com/maps/api/directions/json?origin=${orgAddress}&destination=${destAddress}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`
    $.ajax({
        url: directURL,
        method: 'GET'
    }).then(function (response) {
        console.log(response);
    });


    function moveToLocation(lat, lng) {
        var center = new google.maps.LatLng(lat, lng);
        map.panTo(center);
    };

});

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    directionsService.route({
        origin: orgAddress,
        destination: destAddress,
        optimizeWaypoints: true,
        travelMode: 'DRIVING'
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
            var route = response.routes[0];
            var summaryPanel = document.getElementById('directions-panel');
            summaryPanel.innerHTML = '';
            // For each route, display summary information.
            for (var i = 0; i < route.legs.length; i++) {
                var routeSegment = i + 1;
                summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
                    '</b><br>';
                summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
                summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
                summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
            };
        } else {
            window.alert('Directions request failed due to ' + status);
        };
    });
};
document.getElementById('btnSubmit').addEventListener('click', function () {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
});

/*function moveToLocation(lat, lng) {
    var center = new google.maps.LatLng(lat, lng);
    map.panTo(center);
};*/

//Leave this in for now, just in case we need to do an ajax call to reverse GeoCode
/*$.ajax({

    url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk`,
    method: 'GET'

}).then(function (response) {

    console.log(response.results[0].formatted_address);

});*/

var cityCountry = $('#srcinpt').val();
console.log(cityCountry);
let zipURL = `http://api.openweathermap.org/data/2.5/forecast?zip=${cityCountry}&appid=${openWeatherMapKey}`
let qURL = `http://api.openweathermap.org/data/2.5/forecast?q=${cityCountry}&appid=${openWeatherMapKey}`
$.ajax({
    url: parseInt(cityCountry) ? zipURL : qURL,
    method: 'GET'
}).then(function (response) {
    console.log(response);
    moveToLocation(response.city.coord.lat, response.city.coord.lon);
    $('#srcinpt').val('');
});