'use strict';

var base = require('base/product/base');

/**
 * Retrieves the relevant pid value
 * @param {jQuery} $el - DOM container for a given add to cart button
 * @returns {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el)
            .closest('.modal-content')
            .find('.product-quickview')
            .data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else {
        pid =
            ($el && $el.data('pid')) || $('.product-detail:not(".bundle-item")').data('pid');
    }

    return pid;
}

/**
 * Retrieves url to use when adding a product to the cart
 * @returns {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl() {
    return $('.add-to-cart-url').val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 * @returns {object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.choice-of-bonus-product');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 * @param {object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString =
        '<!-- Modal -->' +
        '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">' +
        '<span class="enter-message sr-only" ></span>' +
        '<div class="modal-dialog choose-bonus-product-dialog" ' +
        'data-total-qty="' +
        data.maxBonusItems +
        '"' +
        'data-UUID="' +
        data.uuid +
        '"' +
        'data-pliUUID="' +
        data.pliUUID +
        '"' +
        'data-addToCartUrl="' +
        data.addToCartUrl +
        '"' +
        'data-pageStart="0"' +
        'data-pageSize="' +
        data.pageSize +
        '"' +
        'data-moreURL="' +
        data.showProductsUrlRuleBased +
        '"' +
        'data-bonusChoiceRuleBased="' +
        data.bonusChoiceRuleBased +
        '">' +
        '<!-- Modal content-->' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '    <span class="">' +
        data.labels.selectprods +
        '</span>' +
        '    <button type="button" class="close pull-right" data-dismiss="modal">' +
        '        <span aria-hidden="true">&times;</span>' +
        '        <span class="sr-only"> </span>' +
        '    </button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('body').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            var parsedHtml = parseHtml(response.renderedTemplate);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .enter-message').text(
                response.enterDialogMessage
            );
            $('#chooseBonusProductModal .modal-header .close .sr-only').text(
                response.closeButtonText
            );
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    if (
        response.newBonusDiscountLineItem &&
        Object.keys(response.newBonusDiscountLineItem).length !== 0
    ) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
    } else if (response.message) {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append('<div class="add-to-cart-messages"></div>');
        }

        $('.add-to-cart-messages').append(
            '<div class="alert ' +
                messageType +
                ' add-to-basket-alert text-left h-fw--semibold show" role="alert">' +
                response.message +
                '</div>'
        );
    }
    messageType = 'alert-success';
    if (response.removeMessage) {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append('<div class="add-to-cart-messages"></div>');
        }

        $('.add-to-basket-alert').remove();
        $('.add-to-cart-messages').append(
            '<div class="alert first-message ' +
                messageType +
                ' add-to-basket-alert text-left h-fw--semibold show" role="alert">' +
                response.removeMessage +
                '</div>'
        );
    }
    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

/**
 * Show error message
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartErrorTosteMessage(response) {
    if (response.error && response.message) {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append('<div class="add-to-cart-messages"></div>');
        }

        $('.add-to-basket-alert').remove();
        $('.add-to-cart-messages').append(
            '<div class="alert error alert-danger add-to-basket-alert text-left h-fw--semibold show" role="alert">' +
                response.message +
                '</div>'
        );
        setTimeout(function () {
            $('.add-to-basket-alert').remove();
        }, 5000);
    }
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 * @returns {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt(
                $(this).find('label.quantity').data('quantity'),
                10
            )
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 * @param {jQuery} $productContainer - DOM element for current product
 * @returns {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption
                .find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        })
        .toArray();

    return JSON.stringify(options);
}


/**
 * Updates DOM using post-option selection Ajax response
 * @param {object} optionsHtml - Ajax response optionsHtml from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */
function updateOptions(optionsHtml, $productContainer) {
    // Update options
    $productContainer.find('.product-options').empty().html(optionsHtml);
}


/**
 * Retrieve contextual quantity selector
 * @param {jQuery} $el - DOM container for the relevant quantity
 * @returns {jQuery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
    var quantitySelected;
    if ($el && $('.set-items').length) {
        quantitySelected = $($el).closest('.product-detail').find('.quantity-select');
    } else if ($el && $('.product-bundle').length) {
        var quantitySelectedModal = $($el).closest('.modal-footer').find('.quantity-select');
        var quantitySelectedPDP = $($el).closest('.bundle-footer').find('.quantity-select');
        if (quantitySelectedModal.val() === undefined) {
            quantitySelected = quantitySelectedPDP;
        } else {
            quantitySelected = quantitySelectedModal;
        }
    } else {
        quantitySelected = $('.quantity-select');
    }
    return quantitySelected;
}

/**
 * Updates the quantity DOM elements post Ajax call
 * @param {Array} quantities -
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function updateQuantities(quantities, $productContainer) {
    if ($productContainer.parent('.bonus-product-item').length <= 0) {
        var optionsHtml = quantities.map(function (quantity) {
            var selected = quantity.selected ? ' selected ' : '';
            return '<option value="' + quantity.value + '"  data-url="' + quantity.url + '"'
                + selected + '>' + quantity.value + '</option>';
        }).join('');
        getQuantitySelector($productContainer).empty().html(optionsHtml);
    }
}


/**
 * Generates html for product attributes section
 * @param {Array} attributes - list of attributes
 * @returns {string} - Compiled HTML
 */
function getAttributesHtml(attributes) {
    if (!attributes) {
        return '';
    }

    var html = '';

    attributes.forEach(function (attributeGroup) {
        if (attributeGroup.ID === 'mainAttributes') {
            attributeGroup.attributes.forEach(function (attribute) {
                html += '<div class="attribute-values">' + attribute.label + ': '
                    + attribute.value + '</div>';
            });
        }
    });

    return html;
}


/**
 * Updates the availability status in the Product Detail Page
 * @param {object} response - Ajax response object after an attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAvailability(response, $productContainer) {
    var availabilityValue = '';
    var availabilityMessages = response.product.availability.messages;
    if (!response.product.readyToOrder) {
        availabilityValue = '<li><div>' + response.resources.info_selectforstock + '</div></li>';
    } else {
        availabilityMessages.forEach(function (message) {
            availabilityValue += '<li><div>' + message + '</div></li>';
        });
    }

    $($productContainer).trigger('product:updateAvailability', {
        product: response.product,
        $productContainer: $productContainer,
        message: availabilityValue,
        resources: response.resources
    });
}


/**
 * Dynamically creates Bootstrap carousel from response containing images
 * @param {object[]} imgs - Array of large product images,along with related information
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function createCarousel(imgs, $productContainer) {
    var carousel = $productContainer.find('.carousel');
    $(carousel).carousel('dispose');
    var carouselId = $(carousel).attr('id');
    $(carousel).empty().append('<ol class="carousel-indicators"></ol><div class="carousel-inner" role="listbox"></div><a class="carousel-control-prev" href="#' + carouselId + '" role="button" data-slide="prev"><span class="fa icon-prev" aria-hidden="true"></span><span class="sr-only">' + $(carousel).data('prev') + '</span></a><a class="carousel-control-next" href="#' + carouselId + '" role="button" data-slide="next"><span class="fa icon-next" aria-hidden="true"></span><span class="sr-only">' + $(carousel).data('next') + '</span></a>');
    for (var i = 0; i < imgs.length; i++) {
        $('<div class="carousel-item"><img src="' + imgs[i].url + '" class="d-block img-fluid" alt="' + imgs[i].alt + ' image number ' + parseInt(imgs[i].index, 10) + '" title="' + imgs[i].title + '" itemprop="image" /></div>').appendTo($(carousel).find('.carousel-inner'));
        $('<li data-target="#' + carouselId + '" data-slide-to="' + i + '" class=""></li>').appendTo($(carousel).find('.carousel-indicators'));
    }
    $($(carousel).find('.carousel-item')).first().addClass('active');
    $($(carousel).find('.carousel-indicators > li')).first().addClass('active');
    if (imgs.length === 1) {
        $($(carousel).find('.carousel-indicators, a[class^="carousel-control-"]')).detach();
    }
    $(carousel).carousel();
    $($(carousel).find('.carousel-indicators')).attr('aria-hidden', true);
}


/**
 * Process the attribute values for an attribute that has image swatches
 * @param {object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 * @param {object} msgs - object containing resource messages
 */
function processSwatchValues(attr, $productContainer, msgs) {
    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="'
            + attrValue.value + '"]');
        var $swatchButton = $attrValue.parent();

        if (attrValue.selected) {
            $attrValue.addClass('selected');
            $attrValue.siblings('.selected-assistive-text').text(msgs.assistiveSelectedText);
        } else {
            $attrValue.removeClass('selected');
            $attrValue.siblings('.selected-assistive-text').empty();
        }

        if (attrValue.url) {
            $swatchButton.attr('data-url', attrValue.url);
        } else {
            $swatchButton.removeAttr('data-url');
        }

        // Disable if not selectable
        $attrValue.removeClass('selectable unselectable');

        $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
    });
}

/**
 * Process attribute values associated with an attribute that does not have image swatches
 * @param {object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processNonSwatchValues(attr, $productContainer) {
    var $attr = '[data-attr="' + attr.id + '"]';
    var $defaultOption = $productContainer.find($attr + ' .select-' + attr.id + ' option:first');
    $defaultOption.attr('value', attr.resetUrl);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer
            .find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url)
            .removeAttr('disabled');

        if (!attrValue.selectable) {
            $attrValue.attr('disabled', true);
        }
    });
}


/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 * @param {object} attrs - Attribute
 * @param {jQuery} $productContainer - DOM element for a given product
 * @param {object} msgs - object containing resource messages
 */
function updateAttrs(attrs, $productContainer, msgs) {
    // Currently, the only attribute type that has image swatches is Color.
    var attrsWithSwatches = ['color'];

    attrs.forEach(function (attr) {
        if (attrsWithSwatches.indexOf(attr.id) > -1) {
            processSwatchValues(attr, $productContainer, msgs);
        } else {
            processNonSwatchValues(attr, $productContainer);
        }
    });
}

/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {object} response - response from Ajax call
 * @param {object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {object[]} response.product.variationAttributes - Product attributes
 * @param {object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */
function handleVariantResponse(response, $productContainer) {
    var isChoiceOfBonusProducts = $productContainer.parents('.choose-bonus-product-dialog').length > 0;
    var isVaraint;
    if (response.product.variationAttributes) {
        updateAttrs(response.product.variationAttributes, $productContainer, response.resources);
        isVaraint = response.product.productType === 'variant';
        if (isChoiceOfBonusProducts && isVaraint) {
            $productContainer.parent('.bonus-product-item')
                .data('pid', response.product.id);

            $productContainer.parent('.bonus-product-item')
                .data('ready-to-order', response.product.readyToOrder);
        }
    }

    // Update primary images
    var primaryImageUrls = window.devicePixelRatio >= 2 ? response.product.images.extraLarge_2x : response.product.images.extraLarge;
    createCarousel(primaryImageUrls, $productContainer);
    if (primaryImageUrls && primaryImageUrls.length > 0) {
        $('.gc-container .product-image').attr('src', primaryImageUrls[0].absURL);
    }

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length
            ? $('.prices .price', $productContainer)
            : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $productContainer.find('.promotions').empty().html(response.product.promotionsHtml);

    updateAvailability(response, $productContainer);

    if (isChoiceOfBonusProducts) {
        var $selectButton = $productContainer.find('.select-bonus-product');
        $selectButton.trigger('bonusproduct:updateSelectButton', {
            product: response.product, $productContainer: $productContainer
        });
    } else {
        // Enable "Add to Cart" button if all required attributes have been selected
        $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
            product: response.product, $productContainer: $productContainer
        }).trigger('product:statusUpdate', response.product);
    }

    // Update attributes
    $productContainer.find('.main-attributes').empty()
        .html(getAttributesHtml(response.product.attributes));
}


/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(selectedValueUrl, $productContainer) {
    if (selectedValueUrl) {
        $('body').trigger(
            'product:beforeAttributeSelect',
            { url: selectedValueUrl, container: $productContainer }
        );

        $.ajax({
            url: selectedValueUrl,
            method: 'GET',
            success: function (data) {
                $('#delete-line-item-modal .delete-lineitem-confirmation-btn').attr(
                    'data-pid',
                    data.product.id
                );
                $('button.add-to-cart, button.add-to-cart-global').data('pid', data.product.id).trigger('change');
                handleVariantResponse(data, $productContainer);
                updateOptions(data.product.optionsHtml, $productContainer);
                updateQuantities(data.product.quantities, $productContainer);
                $('body').trigger(
                    'product:afterAttributeSelect',
                    { data: data, container: $productContainer }
                );
                if (data.product && data.product !== null && 'variantURL' in data.product) {
                    window.history.pushState({}, '', data.product.variantURL);
                }
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
}
/**
 * uploadVideo to upload video to s
 * @param {string} videoUrl - video upload url
 * @param {string} videoForm - video form
 * @returns {string} uploaded link
 */
async function uploadVideo (videoUrl, videoForm) {
    return new Promise(function(resolve, reject) {
        var eGiftVideoLink;
        $('#video-progress').show();
        $.ajax({
            method: 'post',
            url: videoUrl,
            timeout: 0,
            processData: false,
            mimeType: 'multipart/form-data',
            contentType: false,
            data: videoForm,
            success: function (response) {
                eGiftVideoLink = JSON.parse(response).Location;
                $('#video-progress').hide();
                resolve(eGiftVideoLink);
            },
            error: function(xhr, status, error) {
                reject(error); // Reject the promise if there's an error
            },
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = (evt.loaded / evt.total) * 100;
                        $('#video-progress').attr('value', percentComplete);
                        $('#progress').empty().html('Uploading video... ' + Math.round(percentComplete) + '%');
                    }
                }, false);
                return xhr;
            }
        });
    });
}

base.selectAttribute = function () {
    $(document).on(
        'change',
        'select[class*="select-"], .options-select',
        function (e) {
            var $productContainer = $(this).closest('.set-item');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }
            attributeSelect(e.currentTarget.value, $productContainer);
        }
    );
};

base.colorAttribute = function () {
    $(document).on('click', '[data-attr="style"] button', function (e) {
        e.preventDefault();

        if ($(this).attr('disabled') || $(this).hasClass('selected')) {
            return;
        }

        var $productContainer = $(this).closest('.set-item');
        if (!$productContainer.length) {
            $productContainer = $(this).closest('.product-detail');
        }

        attributeSelect($(this).attr('data-url'), $productContainer);
        $(this).parents('.style').find('button.selected').removeClass('selected');
        $(this).addClass('selected');
    });
};

/**
 * Checks if the email value entered is correct format
 * @param {string} email - email string to check if valid
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

module.exports = $.extend({}, base, {
    addToCart: function () {
        $(document).on(
            'click',
            'button.add-to-cart, button.add-to-cart-global',
            async function () {
                $(this).prop('disabled', true);
                var $button = $(this);
                var addToCartUrl;
                var pid;
                var pidsObj;
                var setPids;

                var currentAction = $(this);
                $('body').trigger('product:beforeAddToCart', this);
                currentAction.parents('.product-tile').spinner().start();

                if (
                    $('.set-items').length &&
                    $(this).hasClass('add-to-cart-global')
                ) {
                    setPids = [];

                    $('.product-detail').each(function () {
                        if (!$(this).hasClass('product-set-detail')) {
                            setPids.push({
                                pid: $(this).find('.product-id').text(),
                                qty: $(this).find('.quantity-select').val(),
                                options: getOptions($(this))
                            });
                        }
                    });
                    pidsObj = JSON.stringify(setPids);
                }

                pid = getPidValue($(this));
                var egiftCardDetailsObj;

                if ($('.gift-card-form').length > 0) {
                    var senderName = $('.gift-card-form')
                        .find('input#recipients-form-from')
                        .val();
                    var recipientName = $('.gift-card-form')
                        .find('input#recipients-form-to')
                        .val();
                    var recipientEmail = $('.gift-card-form')
                        .find('input#recipient-email')
                        .val();
                    var eGiftMessage = $('.gift-card-form')
                        .find('#egift-message')
                        .val();
                    var eGiftScheduleDate = $('.gift-card-form')
                        .find('#schedule-days-list')
                        .val();
                    var eGiftScheduleMonth = $('.gift-card-form')
                        .find('#schedule-months-list')
                        .val();
                    var eGiftVideoLink = '';

                    if (
                        senderName === '' ||
                        senderName === null ||
                        recipientName === '' ||
                        recipientName === null ||
                        recipientEmail === '' ||
                        recipientEmail === null ||
                        !validateEmail(recipientEmail)
                    ) {
                        $(this)
                            .parents('.gc-container')
                            .find('.gift-card-form input')
                            .each(function () {
                                if ($(this).val().length === '') {
                                    $(this).addClass('is-invalid');
                                    $(this)
                                        .siblings('.invalid-feedback')
                                        .addClass('animate')
                                        .show()
                                        .text(
                                            $(this).attr('data-missing-error')
                                        );
                                    $(this)
                                        .siblings('.form-control-label')
                                        .hide();
                                }
                            });
                        $(this).prop('disabled', false);
                        return false;
                    }
                    var eGiftVideo = document.getElementById('giftCard-video');

                    if (eGiftVideo.files.length > 0 && (eGiftVideo.files[0].type || '').indexOf('video/') === -1) {
                        $('.giftcard-video').parent().find('.invalid-feedback').text($('#giftCard-video').data('error-type'));
                        $(this).prop('disabled', false);
                        return false;
                    }

                    if (eGiftVideo.files.length > 0 && eGiftVideo.files[0].size > 15728640) {
                        $('.giftcard-video').parent().find('.invalid-feedback').text($('#giftCard-video').data('error-size'));
                        $(this).prop('disabled', false);
                        return false;
                    }

                    if (eGiftVideo.files.length > 0) {
                        $.spinner().start();
                        var videoForm = new FormData();
                        videoForm.append('video', eGiftVideo.files[0], eGiftVideo.files[0].name);
                        var videoUrl = $('input[name=s3Url]').val() + '/upload-video';
                        eGiftVideoLink = await uploadVideo(videoUrl, videoForm);
                        $.spinner().stop();
                    }

                    var egiftCardDetails = {
                        senderName: senderName,
                        recipientName: recipientName,
                        recipientEmail: recipientEmail,
                        eGiftMessage: eGiftMessage,
                        eGiftScheduleDate: eGiftScheduleDate,
                        eGiftScheduleMonth: eGiftScheduleMonth,
                        eGiftVideoLink: eGiftVideoLink
                    };
                    egiftCardDetailsObj = JSON.stringify(egiftCardDetails);
                }

                var $productContainer = $(this).closest('.product-detail');
                if (!$productContainer.length) {
                    $productContainer = $(this)
                        .closest('.quick-view-dialog')
                        .find('.product-detail');
                }

                addToCartUrl = getAddToCartUrl();

                var form = {
                    pid: pid,
                    pidsObj: pidsObj,
                    childProducts: getChildProducts(),
                    quantity: parseInt(base.getQuantitySelected($(this)), 10) || 1,
                    egiftCardDetails: egiftCardDetailsObj
                };

                if (!$('.bundle-item').length) {
                    form.options = getOptions($productContainer);
                }

                $(this).trigger('updateAddToCartFormData', form);
                if (addToCartUrl) {
                    $.ajax({
                        url: addToCartUrl,
                        method: 'POST',
                        data: form,
                        success: function (data) {
                            if (data.error) {
                                if (data.errorCode === 'ZERO-PRICE-PRODUCT') {
                                    if (currentAction.siblings('.add-to-cart-error').length) {
                                        currentAction
                                            .siblings('.add-to-cart-error')
                                            .text(data.errorMessage);
                                    } else if ($('.add-to-cart-error-pdp').length) {
                                        $('.add-to-cart-error-pdp').text(
                                            data.errorMessage
                                        );
                                    }
                                } else if ($('.reserve-stock').length > 0) {
                                    $('.reserve-stock p').text(
                                        data.message
                                    );
                                    $('.reserve-stock').removeClass('d-none');
                                } else {
                                    handlePostCartErrorTosteMessage(data);
                                }
                                $.spinner().stop();
                                return true;
                            }
                            if ($('input[name="maxOrderQty"]').length) {
                                if (!data.error && 'maxOrderQty' in data && data.maxOrderQty >= 0) {
                                    $('input[name="maxOrderQty"]').val(data.maxOrderQty);
                                    if ($('.reserve-stock').length) {
                                        $('.reserve-stock p').empty().append(data.maxOrderQtyMessage);
                                    }
                                }
                            }
                            // refresh page when add to bag from cart page.
                            if($('.cart-page-add-to-bag').length > 0){
                                window.location.reload();
                            }
                            if (data.isProductLineItemsExist) {
                                $('#delete-line-item-modal').modal('show');
                                $.spinner().stop();
                                return true;
                            }
                            if (data.isGiftCardLineItemExist) {
                                $(
                                    '#delete-gift-certificate-line-item-modal'
                                ).modal('show');
                                $('.delete-egiftitem-confirmation-btn').attr('data-pid', data.pid);
                                $.spinner().stop();
                                $button.prop('disabled', false);
                                return true;
                            }
                            handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);


                            if (data.pdpPromotions) {
                                currentAction.parents('.product-detail-wrapper').find('.promotions-wrap').empty().append(data.pdpPromotions);
                            }

                            if ($('.gift-card-form').length > 0) {
                                $('.gift-card-form')[0].reset();
                                $('#video-preview').attr('src', '');
                                $('.gift-card-video video').addClass('d-none');
                                $('.gift-card-video .remove-video').addClass('d-none');
                                $('.egift-video-label').removeClass('d-none');
                                $('#progress').empty();
                            }
                            $button.prop('disabled', false );
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                            if ($('#quickViewModal')) {
                                $('#quickViewModal').modal('hide');
                            }
                            if ($('#product-search-results')) {
                                $button.hide();
                                $button.siblings('.plp-simple-quantity').show();
                                $button.siblings('.plp-simple-quantity').find('.quantity-select').attr('data-pid',pid);
                                $button.siblings('.plp-simple-quantity').find('.quantity-select').val(1);
                            }
                            return true;
                        },
                        error: function (err) {
                            if (
                                currentAction.siblings('.add-to-cart-error')
                                    .length
                            ) {
                                currentAction
                                    .siblings('.add-to-cart-error')
                                    .text(err.responseJSON.errorMessage);
                            } else {
                                $('.add-to-cart-error-pdp').text(
                                    err.responseJSON.errorMessage
                                );
                            }
                            $.spinner().stop();
                        }
                    });
                }
                return true;
            }
        );
    },
    removeEGiftCard: function () {
        $('.delete-egiftitem-confirmation-btn').on('click', function () {
            var productID = $(this).data('pid');
            var removeGiftPliUrl = $(this).data('action');
            var addToCartUrl = $(this).data('addtocarturl');
            var updateShippingMethodURL = $(this).data('update-shipping');
            var form = {
                pid: productID,
                quantity: 1
            };
            $.ajax({
                type: 'GET',
                url: removeGiftPliUrl,
                success: function (res) {
                    handlePostCartAdd(res);
                    $.ajax({
                        type: 'POST',
                        url: addToCartUrl,
                        data: form,
                        success: function (data) {
                            $.get(updateShippingMethodURL);
                            handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                            $('button.add-to-cart').prop('disabled', false);
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            });
        });
    },
    removeLineItem: function () {
        $('.delete-lineitem-confirmation-btn').on('click', function () {
            var productID = $(this).data('pid');
            var removeGiftPliUrl = $(this).data('action');
            var addToCartUrl = $(this).data('addtocarturl');
            var updateShippingMethodURL = $(this).data('update-shipping');
            var egiftCardDetailsObj;
            var egiftCardDetails = {
                senderName: $('.gift-card-form').find('input:text[name=\'sender-name\']').val(),
                recipientEmail: $('.gift-card-form').find('input#recipient-email').val(),
                recipientName: $('.gift-card-form').find('input:text[name=\'recipient-name\']').val(),
                eGiftMessage:  $('.gift-card-form').find('#egift-message').val(),
                eGiftScheduleDate: $('.gift-card-form').find('#schedule-days-list').val(),
                eGiftScheduleMonth: $('.gift-card-form').find('#schedule-months-list').val()
            };
            egiftCardDetailsObj = JSON.stringify(egiftCardDetails);
            var form = {
                pid: productID,
                quantity: 1,
                egiftCardDetails: egiftCardDetailsObj
            };
            $.ajax({
                type: 'GET',
                url: removeGiftPliUrl,
                success: function () {
                    $.ajax({
                        type: 'POST',
                        url: addToCartUrl,
                        data: form,
                        success: function (data) {
                            $.get(updateShippingMethodURL);
                            handlePostCartAdd(data);
                            if ($('.gift-card-form').length > 0) {
                                $('.gift-card-form')[0].reset();
                                $('#video-preview').attr('src', '');
                                $('.gift-card-video video').addClass('d-none');
                                $('.gift-card-video .remove-video').addClass('d-none');
                                $('.egift-video-label').removeClass('d-none');
                                $('#progress').empty();
                            }
                            $('button.add-to-cart').prop('disabled', false);
                            $('body').trigger('product:afterAddToCart', data);
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            });
        });
    },
    denyDeleteItems: function () {
        $('button.delete-lineitem-deny-btn').on('click', function () {
            $('button.add-to-cart').prop('disabled', false);
        });
    }
});
