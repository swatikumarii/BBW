'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Careers-Show : The Careers-Show endpoint shows the magazine page's data.
 * @name Careers-Show
 * @function
 * @memberof Careers
 */
server.get('Show', function (req, res, next) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var careersHelpers = require('*/cartridge/scripts/helpers/careersHelpers');
    var careers = CustomObjectMgr.getAllCustomObjects('careers');
    careers = careersHelpers.getCareers(careers);
    res.render('careers/careers', {
        careers: careers
    });
    next();
}, pageMetaData.computedPageMetaData);

/**
 * Careers-ApplyForJob : The Careers-ApplyForJob endpoint shows the job vacancy form.
 * @name Careers-ApplyForJob
 * @function
 * @memberof Careers
 */
server.get('ApplyForJob',
    function (req, res, next) {
        var careersHelpers = require('*/cartridge/scripts/helpers/careersHelpers');
        var Site = require('dw/system/Site');
        var jobName = req.querystring.jobName;
        var jobApplicationForm = server.forms.getForm('job');
        jobApplicationForm.clear();
        var jobDescription = careersHelpers.getJobDescription(req.querystring.jobId);
        var careersEmail = Site.current.getCustomPreferenceValue('careersEmail');

        res.render('careers/applyForJob', {
            jobApplicationForm: jobApplicationForm,
            jobName: jobName,
            jobId: req.querystring.jobId,
            jobDescription: jobDescription,
            careersEmail: careersEmail
        });
        next();
    }, pageMetaData.computedPageMetaData);

/**
 * Careers-SubmitJobApplication : The Careers-SubmitJobApplication endpoint submits the candidate's data.
 * @name Careers-SubmitJobApplication
 * @function
 * @memberof Careers
 */
server.post('SubmitJobApplication', server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var jobId = req.querystring.jobId;
        var LinkedHashMap = require('dw/util/LinkedHashMap');
        var Mail = require('dw/net/Mail');
        var File = require('dw/io/File');
        var Transaction = require('dw/system/Transaction');
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var Map = require('dw/util/HashMap');
        var Template = require('dw/util/Template');
        var CareersHelper = require('*/cartridge/scripts/helpers/careersHelpers');
        var Site = require('dw/system/Site');
        var jobDetails = CustomObjectMgr.getCustomObject('careers', jobId);

        // Create the template that we will use to send the email.
        var template = new Template('mail/careers/jobMail');

        // Work with a HashMap to pass the data to the template.
        var mailAttributes = new Map();
        var form = req.form;
        var formDataObj = Object.keys(form);
        var newCandidate;
        var filename: String;
        var params: HttpParameterMap = req.httpParameterMap;
        var files: LinkedHashMap = new LinkedHashMap();

        var closure: Object = function (field, ct, oname) {
            filename = oname;
            return new File(File.IMPEX + "/" + oname);
        };
        files = params.processMultipart(closure);
        var resume = files.values();

        try {
            Transaction.wrap(function () {
                newCandidate = CustomObjectMgr.createCustomObject('jobCandidate', form.email);
                newCandidate.custom.candidateName = form.name;
                newCandidate.custom.candidateNumber = form.phone;
                newCandidate.custom.candidateResume = resume[0].fullPath;
                newCandidate.custom.aboutCandidate = form.yourself;

            });
        } catch (e) { }
        var resumeType = resume[0].name.split(".")
        var user = {
            name: form.name,
            phone: form.phone,
            email: form.email,
            yourself: form.yourself,
            resumeType: resumeType[resumeType.length - 1]
        };
        mailAttributes.put('EmailMessage', user);
        CareersHelper.addFilesToMailAttributes(mailAttributes, resume);
        var mail = new Mail();

        // Render the template with the data in the Hash
        try {
            var content = template.render(mailAttributes);
        } catch (e) { }

        mail.addTo(jobDetails.custom.emailId || Site.current.getCustomPreferenceValue('careersEmail'));
        mail.addCc(jobDetails.custom.ccEmail || '');
        mail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail'));
        mail.setSubject(Resource.msgf('job.candidate', 'careers', null, jobDetails.custom.city, jobDetails.custom.job, user.name));
        mail.setContent(content);
        mail.send();

        res.render('careers/applyForJob', {
            jobName: jobDetails.custom.job,
            jobApplicationForm: form
        });
        next();
    });

module.exports = server.exports();
