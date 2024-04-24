'use strict';

/**
 * creates a plain object of the jobs.
 * @param {Object} careers all the jobs collections
 * @returns {Object} a plain object containing the job contents.
 */
function getCareers(careers) {
    var jobs = [];
    var city = [];
    while (careers.hasNext()) {
        var item = careers.next();
        var vacancy = {};
        var indexNumber;
        var countryExists = jobs.some(function (refinement, index) {
            indexNumber = index;
            return refinement.country === item.custom.country;
        });
        if (countryExists) {
            if (!city.includes(item.custom.city)) {
                city.push(item.custom.city);
                jobs[indexNumber].data[item.custom.city] = [];
                jobs[indexNumber].data.cities.push(item.custom.city);
            }
            jobs[indexNumber].data[item.custom.city].push({
                id: item.custom.jobId,
                jobName: item.custom.job,
                jobDescription: item.custom.jobDescription,
                emailId: item.custom.emailId,
                ccEmail: item.custom.ccEmail
            });
        } else {
            vacancy['country'] = item.custom.country;
            city.push(item.custom.city);
            vacancy['data'] = {};
            vacancy.data[item.custom.city] = [];
            vacancy.data.cities = [];
            vacancy.data.cities.push(item.custom.city);
            vacancy.data[item.custom.city].push({
                id: item.custom.jobId,
                jobName: item.custom.job,
                jobDescription: item.custom.jobDescription || '',
                emailId: item.custom.emailId,
                ccEmail: item.custom.ccEmail
            });
            jobs.push(vacancy);
        }
    }
    return jobs;
}

/**
 * Read a file to a String (encoded in IS0-8859-1)
 *
 * @param {Object} jobId id of the selected job
 * @return {string} - The job description
 */
function getJobDescription(jobId) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var selectedJob = CustomObjectMgr.getCustomObject('careers',jobId);
    var selectedJob9 = CustomObjectMgr.queryCustomObject('careers', 'custom.jobId = {0}', jobId, 'creationDate asc');
    if (selectedJob) {
        var job = {};
        job.description = selectedJob.custom.jobDescription || '';
        job.email = selectedJob.custom.emailId || null;
        job.ccEmail = selectedJob.custom.ccEmail || null;
        return job;
    }
    return '';
}

/**
 * Read a file to a String (encoded in IS0-8859-1)
 *
 * @param {string} filePath - The file path to read
 *
 * @return {string} - The file content
 */
function readPDFFile(filePath) {
    var File = require('dw/io/File');
    var FileReader = require('dw/io/FileReader');

    var testPDF = new File(filePath);
    var pdfReader = new FileReader(testPDF, 'ISO-8859-1');

    var pdfContent = '';
    var line = '';

    /**
     * Warning: You can reach the maximum string length with this code!
     */
    do {
        line = pdfReader.readN(1000);
        pdfContent += line;
    } while (line != null);

    return pdfContent;
}

/**
 * Encodes a string into a base64 string with an email-safe line width
 *
 * @param {string} str String the string to encode
 * @param {string} characterEncoding String the character encoding (i.e. 'ISO-8859-1')
 *
 * @return {string} The encoded string
 */
function encodeBase64ForEmail(str, characterEncoding) {
    var StringUtils = require('dw/util/StringUtils');
    var StringWriter = require('dw/io/StringWriter');
    var strBase64 = StringUtils.encodeBase64(str, characterEncoding);
    var strBase64LB = '';
    var stringWriter = new StringWriter();

    var offset = 0;
    var length = 76;

    while (offset < strBase64.length) {
        var maxOffset = offset + length;

        if (strBase64.length >= maxOffset) {
            stringWriter.write(strBase64, offset, length);
            stringWriter.write('\n');
        } else {
            stringWriter.write(strBase64, offset, length - (maxOffset - strBase64.length));
        }
        offset += length;
    }

    stringWriter.flush();
    strBase64LB = stringWriter.toString();
    stringWriter.close();

    return strBase64LB;
}

/**
 * Add files to the attributes to render the mail template.
 *
 * @param {dw.util.Map} mailAttributes - The mail attributes
 * @param {dw.util.Map} resume - The file attributes
 */
function addFilesToMailAttributes(mailAttributes, resume) {
    var Map = require('dw/util/HashMap');
    var pdfContent = readPDFFile(resume[0].fullPath);
    var files = new Map();

    files.put(resume[0].name, encodeBase64ForEmail(pdfContent, 'ISO-8859-1'));

    mailAttributes.put('Base64FileMap', files);
}

module.exports = exports = {
    getCareers: getCareers,
    addFilesToMailAttributes: addFilesToMailAttributes,
    readPDFFile: readPDFFile,
    getJobDescription: getJobDescription
};
