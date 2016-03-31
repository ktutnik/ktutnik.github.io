///#source 1 1 /script-global.js
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
///#source 1 1 /script-imageviewer.js
$(function () {
    $(document).on('click', '.galery-container a.photo, .galery-container a.full-photo', function (e) {
        e.preventDefault();
        var src = $(this).attr('href');
        var ww = $(window).width();
        $('.img-viewer').show()
            .addClass('loading-image')
            .unbind('click')
            .bind('click', function () {
                $('.img-viewer').hide();
            });
        var img = $('.img-viewer img');
        img.css('width', ww > 600 ? 600 : ww - 20)
            .unbind('load')
            .bind('load', function () {
                $('.img-viewer').removeClass('loading-image');
            })
            .attr('src', src);
        //re-fire load event if image loaded from cache
        if (img[0].complete) {
            img.trigger('load');
        }
        return false;
    });
});
///#source 1 1 /script-timeline.js
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

