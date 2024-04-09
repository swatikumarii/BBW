'use strict';

/**
 * getMarketingTiles function is responsible to fetch the marketing tiles data
 * @param  {Array} productIds productIds
 * @param  {object} category category
 * @param  {number} start start
 * @returns  {Array} promotionTilesArr promotionTilesArr
 */
function getMarketingTiles(productIds, category, start) {
    var randomLen = productIds ? productIds.length : 0;
    var promotionTilesArr = [];
    var tilesLength = 12;
    var tempStart = 1;
    var randomArr = [];
    var tmp;
    var randomStart = 0;
    var randomIndex = 0;
    var mobileIndex = 0;
    var desktopIndex = 0;
    var customIndex = 0;
    var promoTileObj = {};
    var startPosition = start || 0;

    if (
        'promotionTileIncrementalDesktopRange' in category.custom &&
        'promotionTileIncrementalMobileRange' in category.custom &&
        parseInt(category.custom.promotionTileIncrementalDesktopRange, 10) >
            0 &&
        parseInt(category.custom.promotionTileIncrementalMobileRange, 10) > 0
    ) {
        while (tempStart <= tilesLength) {
            customIndex = 0;
            if (
                category.custom &&
                'promotionTileContent' + tempStart in category.custom
            ) {
                mobileIndex =
                    mobileIndex === 0
                        ? mobileIndex +
                          parseInt(
                              category.custom
                                  .promotionTileIncrementalMobileRange,
                              10
                          )
                        : mobileIndex -
                          1 +
                          parseInt(
                              category.custom
                                  .promotionTileIncrementalMobileRange,
                              10
                          );
                desktopIndex =
                    desktopIndex === 0
                        ? desktopIndex +
                          parseInt(
                              category.custom
                                  .promotionTileIncrementalDesktopRange,
                              10
                          )
                        : desktopIndex -
                          1 +
                          parseInt(
                              category.custom
                                  .promotionTileIncrementalDesktopRange,
                              10
                          );

                if (
                    'promotionLeadingTileIndex' in category.custom &&
                    category.custom.promotionLeadingTileIndex === tempStart &&
                    category.custom['promotionTileContent' + tempStart]
                ) {
                    customIndex = 1;
                }

                if (
                    'promotionEndingTileIndex' in category.custom &&
                    category.custom.promotionEndingTileIndex === tempStart &&
                    category.custom['promotionTileContent' + tempStart]
                ) {
                    customIndex = randomLen ? randomLen + 1 : 999;
                }

                promoTileObj = {
                    content: category.custom['promotionTileContent' + tempStart]
                };

                if (!customIndex && desktopIndex <= randomLen) {
                    promoTileObj.desktopIndex =
                        (customIndex || desktopIndex) - startPosition;
                }
                if (!customIndex && mobileIndex <= randomLen) {
                    promoTileObj.mobileIndex =
                        (customIndex || mobileIndex) - startPosition;
                }
                promotionTilesArr.push(promoTileObj);
            }
            tempStart++;
        }
    } else {
        if (randomLen > 0) {
            for (var i = 0; i < randomLen; i++) {
                tmp = Math.floor(Math.random() * randomLen) + 1;
                if (randomArr.indexOf(tmp) > -1) {
                    i -= 1;
                } else if (tmp > randomLen === false) {
                    randomArr.push(parseInt(tmp, 10));
                }
            }
        }

        while (tempStart <= tilesLength) {
            customIndex = 0;
            if (
                category.custom &&
                'promotionTileContent' + tempStart in category.custom &&
                (category.custom['promotionTilePositionMobile' + tempStart] ||
                    category.custom['promotionTileRandom' + tempStart] ||
                    category.custom.promotionLeadingTileIndex ||
                    category.custom.promotionEndingTileIndex)
            ) {
                if (randomStart < randomArr.length - 1) {
                    randomIndex = randomArr[randomStart];
                    randomStart++;
                } else {
                    randomStart = 0;
                    randomIndex = randomArr[randomStart];
                    randomStart++;
                }
                mobileIndex = category.custom[
                    'promotionTilePositionMobile' + tempStart
                ]
                    ? category.custom['promotionTilePositionMobile' + tempStart]
                    : randomIndex;
                desktopIndex = category.custom[
                    'promotionTilePositionDesktop' + tempStart
                ]
                    ? category.custom[
                        'promotionTilePositionDesktop' + tempStart
                    ]
                    : randomIndex;

                if (
                    'promotionLeadingTileIndex' in category.custom &&
                    category.custom.promotionLeadingTileIndex === tempStart &&
                    category.custom['promotionTileContent' + tempStart]
                ) {
                    customIndex = 1;
                }

                if (
                    'promotionEndingTileIndex' in category.custom &&
                    category.custom.promotionEndingTileIndex === tempStart &&
                    category.custom['promotionTileContent' + tempStart]
                ) {
                    customIndex = randomLen ? randomLen + 1 : 999;
                }

                promotionTilesArr.push({
                    content:
                        category.custom['promotionTileContent' + tempStart],
                    desktopIndex: (customIndex || desktopIndex) - startPosition,
                    mobileIndex: (customIndex || mobileIndex) - startPosition
                });
            }
            tempStart++;
        }
    }

    return promotionTilesArr;
}

/**
 * append marketing tiles to the viewData
 * @param {object} req - The request object for the current controller request
 * @param {object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function appendMarketingTiles(req, res, next) {
    var viewData = res.getViewData();
    if (viewData.apiProductSearch && viewData.apiProductSearch.category) {
        viewData.productSearch.customTile = getMarketingTiles(
            viewData.productSearch.productIds,
            viewData.apiProductSearch.category,
            req.querystring.start
        );
        res.setViewData(viewData);
    }
    next();
}

module.exports = {
    appendMarketingTiles: appendMarketingTiles
};
