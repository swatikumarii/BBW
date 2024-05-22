'use strict';

/**
 * @class
 * @classdesc The stores model
 * @param {dw.catalog.Store} storeObject - a Store objects
 */
function store(storeObject) {
    if (storeObject) {
        this.ID = storeObject.ID;
        this.name = storeObject.name;
        this.address1 = storeObject.address1;
        this.address2 = storeObject.address2;
        this.city = storeObject.city;
        this.postalCode = storeObject.postalCode;
        this.latitude = storeObject.latitude;
        this.longitude = storeObject.longitude;

        if (storeObject.phone) {
            this.phone = storeObject.phone;
        }

        if (storeObject.stateCode) {
            this.stateCode = storeObject.stateCode;
        }

        if (storeObject.countryCode) {
            this.countryCode = storeObject.countryCode.value;
        }

        if (storeObject.stateCode) {
            this.stateCode = storeObject.stateCode;
        }

        if (storeObject.storeHours) {
            this.storeHours = storeObject.storeHours.markup;
        }
        var images = [];
        if (storeObject.image) {
            images.push(storeObject.image.httpsURL.toString());
        }
        if (storeObject.custom.image2) {
            images.push(storeObject.custom.image2.httpsURL.toString());
        }
        if (storeObject.custom.image3) {
            images.push(storeObject.custom.image3.httpsURL.toString());
        }
        if (storeObject.custom.image4) {
            images.push(storeObject.custom.image4.httpsURL.toString());
        }
        if (storeObject.custom.image5) {
            images.push(storeObject.custom.image5.httpsURL.toString());
        }
        this.imageUrl = images;
    }
}

module.exports = store;
