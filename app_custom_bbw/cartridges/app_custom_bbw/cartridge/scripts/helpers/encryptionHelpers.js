'use strict';

var Encoding = require('dw/crypto/Encoding');

var encryptionKey = 'm375xGRfHcPXUsNyX4UX4uQZg9rW4Oe2';
var transformation = 'AES/ECB/PKCS5Padding';

var saltVectorBytes = Encoding.fromHex('00000000000000000000000000000000');
var saltVector = Encoding.toBase64(saltVectorBytes);

/**
 * Decode ID
 * @param pin{string} : ID to be decoded
 * @return result{string} : decoded ID
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
 * Encode ID
 * @param pin{string} : ID to be encoded
 * @return result{string} : encoded ID
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
