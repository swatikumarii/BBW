'use strict';

var Logger = require("dw/system/Logger");
var contentAssetAPI = require('*/cartridge/scripts/service/init/contentAssetAPI');
var URLUtils = require('dw/web/URLUtils');
var URLAction = require('dw/web/URLAction');
var URLParameter = require('dw/web/URLParameter');
var Site = require('dw/system/Site');

function callAPI(url) {
  var service = contentAssetAPI.contentAssetAPI;
  var serviceResult;
  service.setURL(url);
  service.setRequestMethod("GET");
  serviceResult = service.call();
  Logger.info("Before Service response");
  if (serviceResult.status === "OK") {
    Logger.info(
      "Service response : serviceResult.status : " + serviceResult.status
    );
    return serviceResult.object;
  }
  Logger.info(
    "Service response : serviceResult.status : " + serviceResult.status
  );
  return "";
}

module.exports = {
  callAPI: callAPI
};
