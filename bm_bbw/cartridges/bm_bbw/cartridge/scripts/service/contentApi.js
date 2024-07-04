'use strict';

var Logger = require("dw/system/Logger");
var contentAssetAPI = require('*/cartridge/scripts/service/init/contentAssetAPI');
var URLUtils = require('dw/web/URLUtils');
var URLAction = require('dw/web/URLAction');
var URLParameter = require('dw/web/URLParameter');
var Site = require('dw/system/Site');

function contentApi(contentID) {
  var service = contentAssetAPI.contentAssetAPI;
  var serviceResult;
  var baseUrl = URLUtils.https(
    new URLAction('StaticContent-ContentBody', Site.current.ID), new URLParameter('cid', contentID)
  ).toString();
  service.setURL(baseUrl);
  service.setRequestMethod('GET');
  serviceResult = service.call();
  Logger.info("Before Service response");
  if (serviceResult.status === 'OK') {
    Logger.info(
      "Service response : serviceResult.status : " + serviceResult.status
    );
    return JSON.parse(serviceResult.object).contentAssetBody;
  }
  Logger.info(
    "Service response : serviceResult.status : " + serviceResult.status
  );
  return '';
}

// module.exports = {
//   contentApi: contentApi
// };


contentApi.public = true;
exports.contentApi = contentApi;
