var homePos = new google.maps.LatLng(-8.524363, 115.299170);
var marks = [
    { title: 'Lokasi Upacara', position: homePos },
    { title: 'Goa Gajah', position: new google.maps.LatLng(-8.523255, 115.287214) },
    { title: 'Pura Samuan Tiga', position: new google.maps.LatLng(-8.523786, 115.295208) },
    { title: 'Pertigaan Semebaung', position: new google.maps.LatLng(-8.533172, 115.302678), street: 'https://goo.gl/maps/yLbUV' },
    { title: 'Stadion Kapten Dipta', position: new google.maps.LatLng(-8.548749, 115.306266) },
    { title: 'Taman Kota Gianyar', position: new google.maps.LatLng(-8.540797, 115.322628) },
    { title: 'Patung Bayi Sakah', position: new google.maps.LatLng(-8.563668, 115.273945) }
];
var map = {};
var dirDisplay = {};
var dirService = new google.maps.DirectionsService();

google.maps.event.addDomListener(window, 'load', function () {
    dirDisplay = new google.maps.DirectionsRenderer();
    var mapOptions = {
        center: { lat: -8.524363, lng: 115.299170 },
        zoom: 15,
        backgroundColor: '#fff',

    };
    map = new google.maps.Map($('.maps-container .maps')[0],
        mapOptions);

    //set lokasi upacara
    var marker = new google.maps.Marker({
        position: homePos,
        map: map,
        title: 'Lokasi Upacara'
    });
    var infowindow = new google.maps.InfoWindow({
        content: $('#lokasi-upacara').html().toString()
    });
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });
    infowindow.open(map, marker);
    dirDisplay.setMap(map);
});

function resizeMap() {
    $('.maps-container .maps')
        .height($(window).height() - $('.content .title').outerHeight() -
        $('.maps-container a').outerHeight());
    google.maps.event.trigger(map, 'resize');
}

$(function () {

    //generate loaksi acuan
    var tempInfo = new google.maps.InfoWindow();
    $.each(marks, function (i, e) {
        $('<li data-id="' + i + '">' + e.title + '</li>')
            .prependTo('.landmark')
            .click(function () {
                $('.landmark').removeClass('expand');
                var i = parseInt($(this).data('id'));
                if (i > 0) {
                    tempInfo.setContent(marks[i].title);
                    tempInfo.setPosition(marks[i].position);
                    tempInfo.open(map);
                }
                if (i == 0) {
                    map.setZoom(15);
                    map.panTo(marks[i].position);
                }
                else {
                    dirService.route({
                        origin: marks[i].position,
                        destination: homePos,
                        travelMode: google.maps.TravelMode.DRIVING
                    }, function (resp, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            dirDisplay.setDirections(resp);
                        }
                    });
                }

            });
    });

    $('.landmark .head').click(function () {
        $('.landmark').toggleClass('expand');
    });
});