/* eslint-disable camelcase */

'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var dataHelpers = require('*/cartridge/scripts/helpers/dataHelpers');
var emarsysEnabled =
    Site.getCurrent().getCustomPreferenceValue('emarsysEnabled') || false;


/**
 * @param {object} res - current route response object
 * @returns {object} Object containing emarsys data corresponding to the controller.
 */
function getScarabQueueData(res) {
    var userEmail='';
    try {
        switch (res.action) {
            case 'Account-Login':
                userEmail =
                    'authenticatedCustomer' in res &&
                    'profile' in res.authenticatedCustomer
                        ? res.authenticatedCustomer.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    null    ,
                    null
                );
            case 'Search-Show':
                userEmail =
                    'CurrentUser' in res && 'profile' in res.CurrentUser
                        ? res.CurrentUser.profile.email
                        : '';
                var categories = '';
                for (var index = 0; index < res.breadcrumbs.length; index++) {
                    if (
                        index > 1 &&
                            res.breadcrumbs[index].htmlValue === 'Home'
                    ) {
                        break;
                    }
                    if (index !== 0) {
                        categories += '>';
                    }
                    categories += res.breadcrumbs[index].htmlValue;
                }
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    categories,
                    null
                );
            case 'Cart-Show':
                userEmail =
                    'CurrentUser' in res && 'profile' in res.CurrentUser && res.CurrentUser.profile
                        ? res.CurrentUser.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(userEmail, null, null);
            case 'Checkout-Begin':
                userEmail =
                    'CurrentUser' in res && 'profile' in res.CurrentUser
                        ? res.CurrentUser.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    'checkout-begin',
                    null
                );
            case 'CheckoutServices-SubmitPayment':
                userEmail =
                    'CurrentUser' in res && 'profile' in res.CurrentUser
                        ? res.CurrentUser.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    'checkout-payment',
                    null
                );
            case 'CheckoutShippingServices-SubmitShipping':
                userEmail =
                    'customer' in res && 'profile' in res.customer
                        ? res.customer.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    'checkout-shipment',
                    null
                );
            case 'Default-Start':
                userEmail =
                    'CurrentUser' in res && 'profile' in res.CurrentUser
                        ? res.CurrentUser.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    'homepage',
                    null
                );
            case 'Home-Show':
                userEmail =
                    'CurrentUser' in res && 'profile' in res.CurrentUser
                        ? res.CurrentUser.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    'homepage',
                    null
                );
            case 'Product-Show':
                userEmail =
                    'CurrentUser' in res && 'profile' in res.CurrentUser
                        ? res.CurrentUser.profile.email
                        : '';
                return dataHelpers.prepareEmrasysData(
                    userEmail,
                    null,
                    {detail:res.product.id}
                );
            case 'Order-Confirm':
                return dataHelpers.prepareEmrasysOrderData(res.order);
            default:
                return false;
        }
    } catch (error) {
        Logger.getLogger('Emarsys', 'Emarsys').error(
            'Error when triggering Emarsys event' + error
        );
        return {};
    }
}

module.exports = {
    isEnabled: emarsysEnabled,
    getScarabQueueData: getScarabQueueData,
};
