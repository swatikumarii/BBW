'use strict';

/**
 * Function to check whether to add bundle to basket button
 */
function checkIfBundleReady() {
    var totalSelections = $('.selected-product').length;
    for (var i = totalSelections - 1; i >= 0; i--) {
        if ($('.selected-product').eq(i).attr('data-pid') !== '') {
            --totalSelections;
        }
    }
    if (totalSelections) {
        $('#main-cart-button').attr('disabled', true);
        $('.add-to-bundle-msg').css('display', 'block');
    } else {
        $('#main-cart-button').attr('disabled', false);
        $('.bundle-complete-spinner').text($('.bundle-complete-msg').val());
        $('.add-to-bundle-msg').css('display', 'none');
    }
}

$(document).ready(function () {
    var bundleName = $('.storepage').attr('class').replace('storepage ', '');
    // check if bundle is unavailable and return
    if ($('.bundle-unavailable').length) {
        $('.bundleRow').remove();
        return;
    }
    $('.productbundle-overlay#page-overlay').hide();
    // if fixed bundle this will enable button
    checkIfBundleReady();
    // Product Bundle - Click Event - Get data
    $('.bundle-product').on('click', function () {
        $('#productbundle-modal').css({ display: 'none' });
        $('.productbundle-overlay#page-overlay').show();
        $('#productbundle-modal .productDetail').empty();

        var productID = $(this).attr('data-pid');
        var requestURL = $(this).attr('data-url');
        $.ajax({
            url: requestURL,
            method: 'POST',
            data: { pid: productID },
            success: function (data) {
                // Load - HTML data - Modal
                $('#productbundle-modal .productDetail').html(data);
                // Show - Product Bundle Detail - Modal
                $('.productbundle-overlay#page-overlay').fadeOut(1000);
                setTimeout(function () {
                    $('#productbundle-modal').toggleClass('show');
                    $('#productbundle-modal').css({ display: 'block' });
                }, 1000);

                $('body').css('overflow', 'hidden');
                $('html').css('overflow', 'hidden');
            },
            error: function () {
                $.spinner().stop();
            }
        });

        $('#productbundle-modal .productDetail, #productbundle-modal .productbundle-dialog').toggleClass('show');
    });

    $('.multi-product-mobile-link').on('click', function () {
        // Show - Product Bundle Detail - Modal
        $(this).parents('.experience-product_bundle-multiProduct').find('#multiproductbundle-modal, #multiproductbundle-modal .productbundle-dialog').addClass('show');
    });

    $('#multiproductbundle-modal .close').on('click', function () {
        $('#multiproductbundle-modal .productbundle-dialog, #multiproductbundle-modal').removeClass('show');
    });

    // Product Bundle Detail - Modal - Close Event
    $('#productbundle-modal .close').on('click', function () {
        $('#productbundle-modal, #productbundle-modal .productbundle-dialog').removeClass('show');
        $('body').css('overflow', '');
        $('html').css('overflow', '');
        $('.carousel-indicators').hide();
    });

    // Collapse - Icon - Change
    $('.panel-collapse').on('shown.bs.collapse', function () {
        $('.multi-product-collapse').find('.fa-angle-right').removeClass('fa-angle-right').addClass('fa-angle-down');
    }).on('hidden.bs.collapse', function () {
        // eslint-disable-next-line newline-per-chained-call
        $('.multi-product-collapse').parent().find('.fa-angle-down').removeClass('fa-angle-down').addClass('fa-angle-right');
    });
    $(document).on('click', '.zoomImage-link, .zoomDesktop, .zoomIpad', function () {
        $('.zoomImage-sec').css('display', 'block');
        $('body').css('overflow-y', 'hidden');
        var deviceWidth = $(window).innerWidth();
        if (deviceWidth < 768) {
            $('body').css('overflow-y', '');
        }
    });
    $('.zoomImage-link').trigger('click');
    $(document).on('click', '.zoomOut-link', function () {
        $('.zoomImage-sec').css('display', 'none');
        $('body').css('overflow-y', 'visible');
    });


    $('.multi-product-collapse').click(function () {
        $('.panel-collapse.in').collapse('hide');
        $(this).find('.panel-collapse.in').collapse('show');
    });

    $('.add-to-bundle').on('click', function (e) {
        e.preventDefault();
        var button = $(this);
        var productID = $(this).data('pid');
        var parent = button.closest('.panel');
        var headerHeight = $('.header-fix').outerHeight();
        var successMsg = parent.find('.add-to-bundle.d-none').length > 0 ? $('.bundleRow').find('.updateMsgBundleProduct').val() : $('.bundleRow').find('.successMsgBundleProduct').val();
        $.ajax({
            beforeSend: function () {
                $('body').css('overflow', 'hidden');
                $('body').append('<div class= "bundle-spinner"><div><span class="bordered-spinner"></span><label>' + successMsg + '</label></div><label class="bundle-complete-spinner"></label></div>');
            },
            complete: function () {
                $('body').find('.bundle-spinner').remove();
                parent.find('.panel-collapse.in').collapse('hide');
                $('body').css('overflow', '');
                parent.find('#productbundle-modal .productDetail, #productbundle-modal .productbundle-dialog').toggleClass('show');
                parent.find('#multiproductbundle-modal').removeClass('show');
                $('html, body').animate({
                    scrollTop: parent.find('.multi-product-collapse').offset().top - (headerHeight + 20)
                }, 300);
            }
        });
        // $.spinner().start();
        parent.attr('data-pid', productID); // make this product selected
        var newImage = button.closest('.product_container').find('.thumbnail-container img').attr('src');
        parent.find('.panel-heading .thumbnail-container img').attr('src', newImage);
        parent.find('.added-to-bundle').addClass('d-none');
        parent.find('.add-to-bundle').removeClass('d-none');
        button.addClass('d-none');
        button.next().removeClass('d-none');
        $('body, html').removeClass('overflow-hidden');
        checkIfBundleReady();
        // $.spinner().stop();
    });


    $('#main-cart-button').on('click', function () {
        var addToCartUrl;
        var pid;
        var pidsObj;
        var setPids;

        $('#main-cart-button').spinner().start();

        if ($('.selected-product').length) {
            setPids = [];

            $('.selected-product').each(function () {
                setPids.push({
                    pid: $(this).attr('data-pid'),
                    qty: 1
                });
            });
            pidsObj = JSON.stringify(setPids);
        }

        addToCartUrl = $('#add-to-cart-url').val();
        var form = {
            pid: pid,
            pidsObj: pidsObj,
            quantity: 1,
            currentBundle: bundleName
        };
        $.ajax({
            url: addToCartUrl,
            method: 'POST',
            data: form,
            success: function (data) {
                if (data.error) {
                    $('.bundle-not-added .bundleMessage').empty().text(data.message);
                    $('.bundle-not-added').removeClass('d-none');
                    $('#main-cart-button').attr('disabled', true);
                    $('.add-to-bundle-msg').css('display', 'block');
                } else {
                    $('.bundle-added-overlay, .bundle-added').removeClass('d-none');
                    $('body').addClass('overflow-hidden');
                }
                $('#main-cart-button').spinner().stop();
            },
            error: function () {
                $('#main-cart-button').spinner().stop();
            }
        });
    });

    var bundleQtyInCart = $('.currentBundleinCart').val();
    var maxQty = $('#main-cart-button').attr('data-maxadds');
    if (bundleQtyInCart >= maxQty) {
        $('.add-to-bundle-msg').css('display', 'none');
        $('.add-to-bundle').attr('disabled', true);
        $('.maxLimitMessageBunlde').addClass('maxLimitMessageBunldeShow');
    }

    $('.bundle-carousel-slide').carousel();
});
$(document).on('click', '.bundle-carousel-inner .carousel-item.active, .zoomImage-link', function () {
    $('#productbundle-modal').addClass('overflow-hidden');
    var element = document.querySelector('.zoomImage-sec');
    element.scrollIntoView();
});
$(document).on('click', '.zoomOut-link', function () {
    $('#productbundle-modal').removeClass('overflow-hidden');
});

$(function () {
    var width = $(window).width();
    if (width < 768) {
        $(document).on('click', '.multi-product-mobile-link', function () {
            $('body, html').addClass('overflow-hidden');
        });
        $(document).on('click', '#multiproductbundle-modal .close', function () {
            $('body, html').removeClass('overflow-hidden');
        });
        // To remove sticky header multiproductbundle-modal popup
        $(document).on('click', '.experience-product_bundle-multiProduct .multi-product-mobile-link', function () {
            $('header .nav-head2, header .top-bar').addClass('d-none');
        });
        $(document).on('click', '#multiproductbundle-modal .close', function () {
            $('header .nav-head2, header .top-bar').removeClass('d-none');
        });
    }
});
// Scroll in to view opened accordion
$('.panel-collapse').on('shown.bs.collapse', function () {
    var $panel = $(this).closest('.panel');
    $('html,body').animate({
        scrollTop: $panel.offset().top - (127)
    }, 500);
});
