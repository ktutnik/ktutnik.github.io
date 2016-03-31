$(function () {
    var pages = 2;
    var isloading = false;

    /*lazy load timeline*/
    $(window).scroll(function () {
        var timeline = $('.gl-container');
        var h = timeline.outerHeight() + timeline.offset().top;
        var btmscr = $(window).height() + $(window).scrollTop();

        //saat batas bawah layar mendekati bagian terakhir timeline
        if (btmscr + 300 >= h) {
            var more = $('.gl-container .more');
            var pos = parseInt(more.data('page')) + 1;
            if (isloading || pos >= (pages + 1) || !timeline.data('loaded')) {
                return;
            }
            isloading = true;
            more.show();
            $.get('timeline' + pad(pos) + '.min.html', function (data) {
                more.hide();
                $('.gl-container .galery-container').append(data);
                more.data('page', pos);
                isloading = false;
            });
        }
    });
});

function pad(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}
