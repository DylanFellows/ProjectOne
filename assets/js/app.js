$('#btnSubmit').on('click', function(event){
  event.preventDefault();
  var cityCountry = $('#srcinpt').val();
  console.log(cityCountry);
  $.ajax({
    url: `http://api.openweathermap.org/data/2.5/forecast?q=${cityCountry}&appid=${openWeatherMapKey}`,
    method: 'GET'
  }).then(function(response){
    console.log(response);
    moveToLocation(response.city.coord.lat, response.city.coord.lon);
    $('#srcinpt').val('');
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
  success: function(data) {
    console.log('Received data:', data) // For testing
    var wf = "";
    wf += "<div class='card ctycrd'> <div class='card-body'>" + data.city.name + "</div></div>"; // City (displays once)
    $.each(data.list, function(index, val) {
      wf += "<div class='card col-2'><div class='card-body'>" // Opening paragraph tag
      wf += "<b>Day " + (index+1) + "</b>: " // Day
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

function moveToLocation(lat, lng){
  var center = new google.maps.LatLng(lat, lng);
  map.panTo(center);
};  

