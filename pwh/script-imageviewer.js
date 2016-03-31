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