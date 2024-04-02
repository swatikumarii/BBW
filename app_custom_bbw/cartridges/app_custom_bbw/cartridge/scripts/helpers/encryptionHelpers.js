'use strict';

var Encoding = require('dw/crypto/Encoding');
var Site = require('dw/system/Site');

var encryptionKey = Site.current.getCustomPreferenceValue('encryptionKey');
var transformation = 'AES/ECB/PKCS5Padding';

var saltVectorBytes = Encoding.fromHex('00000000000000000000000000000000');
var saltVector = Encoding.toBase64(saltVectorBytes);

/**
 * Decode string for check ID
 * @param pin{string} : string to be decoded
 * @return result{string} : decodedCardPin
*/
function decryptPin(pin) {
    try {
        var Cipher = require('dw/crypto/Cipher');
        Cipher = new Cipher();
        var decryptedPin = Cipher.decrypt(pin, encryptionKey, transformation, saltVector, 0);
        return decryptedPin;
    } catch (e) {
        return false;
    }
}

/**
 * Encode string for send ID in the email
 * @param pin{string} :string to be encoded
 * @return encodedCardPin
*/
function encryptPin(pin) {
    try {
        var Cipher = require('dw/crypto/Cipher');
        Cipher = new Cipher();
        var encryptedPin = Cipher.encrypt(pin, encryptionKey, transformation, saltVector, 0);
        return encryptedPin;
    } catch (e) {
        return false;
    }
}

module.exports = {
    encryptPin: encryptPin,
    decryptPin: decryptPin
};
