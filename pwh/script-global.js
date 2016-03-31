$(function () {
    $('.burger').click(function () {
        $(this).closest('ul').toggleClass('open');
    });

    /*Menu width*/
    $(window).resize(function () {
        setMenuWidth();
    });
    setMenuWidth();

    /*active menu selector when scroll*/
    $(window).scroll(function () {
        var topscr = $(window).scrollTop();
        var menu = $('.content .title ul');
        menu.find('li').removeClass('active');
        menu.show();
        if (topscr >= $('.page[data-id="#timeline"]').offset().top) {
            menu.find('a[href="#timeline"]').closest('li').addClass('active');
        }
        else if (topscr >= $('.page[data-id="#comment"]').offset().top) {
            menu.find('a[href="#comment"]').closest('li').addClass('active');
        }
        else if (topscr >= $('.page[data-id="#peta"]').offset().top) {
            menu.find('a[href="#peta"]').closest('li').addClass('active');
        }
        else {
            menu.find('a[href="#undangan"]').closest('li').addClass('active');
            menu.hide();
        }
    });

    $('.content .title ul a').click(function (e) {
        var el = $(this);
        el.closest('ul').removeClass('open')
            .find('li').removeClass('active');
        el.closest('li').addClass('active');
        var pos = $('.page[data-id="' + el.attr('href') + '"]').offset().top;
        $(window).scrollTop(pos + 1);
    });

    /*lazy load page*/
    $(window).scroll(function () {
        var timeline = $('.gl-container');
        var h = timeline.outerHeight() + timeline.offset().top;
        var btmscr = $(window).height() + $(window).scrollTop();
        //saat batas bawah layar mendekati bagian terakhir timeline
        if (btmscr + 300 >= h) {
            var loading = $('.gl-container .loading-page');
            if (loading.length > 0) {
                loading.remove();
                $.get('timeline.min.html', function (data) {
                    timeline.append(data);
                    timeline.data('loaded', true);
                });
            }
        }
    });
});

function setMenuWidth() {
    if (matchMedia('(max-width: 600px)').matches) {
        var ww = $(window).width();
        $('.content .title ul').width(ww);
    }
    else {
        $('.content .title ul').width(600);
    }
}