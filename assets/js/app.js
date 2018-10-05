var map;
var geoJSON;
var request;
var gettingData = false;
var openWeatherMapKey = "73c3d994dd080efa8f6beab2a4662696";
var directionsService;
var directionsDisplay;
var destAddress;
var map;
var drawingManager;
var placeIdArray = [];
var polylines = [];
var snappedCoordinates = [];

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

map.controls[google.maps.ControlPosition.RIGHT_TOP].push(
  document.getElementById('bar'));
var autocomplete = new google.maps.places.Autocomplete(
  document.getElementById('autoc'));
autocomplete.bindTo('bounds', map);
autocomplete.addListener('place_changed', function() {
var place = autocomplete.getPlace();
if (place.geometry.viewport) {
  map.fitBounds(place.geometry.viewport);
} else {
  map.setCenter(place.geometry.location);
  map.setZoom(17);
}
});

// Enables the polyline drawing control. Click on the map to start drawing a
// polyline. Each click will add a new vertice. Double-click to stop drawing.
drawingManager = new google.maps.drawing.DrawingManager({
drawingMode: google.maps.drawing.OverlayType.POLYLINE,
drawingControl: true,
drawingControlOptions: {
  position: google.maps.ControlPosition.TOP_CENTER,
  drawingModes: [
    google.maps.drawing.OverlayType.POLYLINE
  ]
},
polylineOptions: {
  strokeColor: '#696969',
  strokeWeight: 2
}
});
drawingManager.setMap(map);

// Snap-to-road when the polyline is completed.
drawingManager.addListener('polylinecomplete', function(poly) {
var path = poly.getPath();
polylines.push(poly);
placeIdArray = [];
runSnapToRoad(path);
});

// Clear button. Click to remove all polylines.
$('#clear').click(function(ev) {
for (var i = 0; i < polylines.length; ++i) {
  polylines[i].setMap(null);
}
polylines = [];
ev.preventDefault();
return false;
});

// Snap a user-created polyline to roads and draw the snapped path
function runSnapToRoad(path) {
var pathValues = [];
for (var i = 0; i < path.getLength(); i++) {
pathValues.push(path.getAt(i).toUrlValue());
}

$.get('https://roads.googleapis.com/v1/snapToRoads', {
interpolate: true,
key: 'AIzaSyD2tX38tR0PVZxcCq_jSiPvpTcG-JrV1qk',
path: pathValues.join('|')
}, function(data) {
processSnapToRoadResponse(data);
drawSnappedPolyline();
getAndDrawSpeedLimits();
});
}

// Store snapped polyline returned by the snap-to-road service.
function processSnapToRoadResponse(data) {
snappedCoordinates = [];
placeIdArray = [];
for (var i = 0; i < data.snappedPoints.length; i++) {
var latlng = new google.maps.LatLng(
    data.snappedPoints[i].location.latitude,
    data.snappedPoints[i].location.longitude);
snappedCoordinates.push(latlng);
placeIdArray.push(data.snappedPoints[i].placeId);
}
}

// Draws the snapped polyline (after processing snap-to-road response).
function drawSnappedPolyline() {
var snappedPolyline = new google.maps.Polyline({
path: snappedCoordinates,
strokeColor: 'black',
strokeWeight: 3
});

snappedPolyline.setMap(map);
polylines.push(snappedPolyline);
}

// Gets speed limits (for 100 segments at a time) and draws a polyline
// color-coded by speed limit. Must be called after processing snap-to-road
// response.
function getAndDrawSpeedLimits() {
for (var i = 0; i <= placeIdArray.length / 100; i++) {
// Ensure that no query exceeds the max 100 placeID limit.
var start = i * 100;
var end = Math.min((i + 1) * 100 - 1, placeIdArray.length);

drawSpeedLimits(start, end);
}
}

// Gets speed limits for a 100-segment path and draws a polyline color-coded by
// speed limit. Must be called after processing snap-to-road response.
function drawSpeedLimits(start, end) {
var placeIdQuery = '';
for (var i = start; i < end; i++) {
  placeIdQuery += '&placeId=' + placeIdArray[i];
}

$.get('https://roads.googleapis.com/v1/speedLimits',
    'key=' + apiKey + placeIdQuery,
    function(speedData) {
      processSpeedLimitResponse(speedData, start);
    }
);
}

// Draw a polyline segment (up to 100 road segments) color-coded by speed limit.
function processSpeedLimitResponse(speedData, start) {
var end = start + speedData.speedLimits.length;
for (var i = 0; i < speedData.speedLimits.length - 1; i++) {
var speedLimit = speedData.speedLimits[i].speedLimit;
var color = getColorForSpeed(speedLimit);

// Take two points for a single-segment polyline.
var coords = snappedCoordinates.slice(start + i, start + i + 2);

var snappedPolyline = new google.maps.Polyline({
  path: coords,
  strokeColor: color,
  strokeWeight: 6
});
snappedPolyline.setMap(map);
polylines.push(snappedPolyline);
}
}

function getColorForSpeed(speed_kph) {
if (speed_kph <= 40) {
return 'purple';
}
if (speed_kph <= 50) {
return 'blue';
}
if (speed_kph <= 60) {
return 'green';
}
if (speed_kph <= 80) {
return 'yellow';
}
if (speed_kph <= 100) {
return 'orange';
}
return 'red';
}

//$(window).load(initialize);

google.maps.event.addDomListener(window, 'load', initialize);

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
};

   Leave this in for now, just in case we need to do an ajax call to reverse GeoCode
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