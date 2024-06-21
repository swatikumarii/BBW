/* eslint-disable vars-on-top */

'use strict';

/**
* Gets order list
*
*- @input ItemType: String
*- @input Category: String
*
* @output OrderList: Array
*
*/

// API Includes
var OrderMgr = require('dw/order/OrderMgr');
var ArrayList = require('dw/util/ArrayList');

/**
 * Get orders
 * @param {Object} input - input parameters
 * @returns {Object} orders data
 * */
function getOrders(input) {
  var pageSize = input.pageSize;
  var pageNumber = input.pageNumber;
  var orderNumber = input.orderNumber;
  var result = new ArrayList();
  var totalOrderCount;
  var startRow;
  var endRow;
  var orders;
  var order;
  var rowCount;
  var pageCount;

  totalOrderCount = 0;
  startRow = 0;
  endRow = 0;
  rowCount = 0;
  pageCount = 0;

  if (orderNumber) { // searching for an order ID
    order = OrderMgr.searchOrder('orderNo = {0}', orderNumber);

    if (order) {
      result.push(order);
      totalOrderCount = 1;
      startRow = 1;
      endRow = 1;
    }
  }
  var pages = [];
  for (var index = 1; index <= pageCount; index += 1) {
    pages.push(index.toString());
  }
  return {
    orders: result,
    totalOrderCount: totalOrderCount,
    startRow: startRow,
    endRow: endRow,
    pageSize: pageSize,
    pageNumber: pageNumber,
    pageCount: pageCount,
    pages: pages,
    orderNumber: orderNumber
  };
}

module.exports = {
  output: function (input) {
    return getOrders(input);
  }
};
