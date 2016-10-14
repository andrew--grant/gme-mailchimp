var express = require('express');
var router = express.Router();
var Mailchimp = require('mailchimp-api-v3');
var mailchimpUrl = 'http://us9.api.mailchimp.com';
var apiKey = process.env['mailchimp-api-key'];
//var listId = 'f37f9feb84';
var mailchimp = new Mailchimp(apiKey);
var request = require('request');
var fs = require('fs');
// GET subscriptions.
router.get('/', function (req, res, next) {

    res.json({api_status: 'ok'});

});

// GET subscriptions/winner
router.get('/winner', function (req, res, next) {
    res.send('not yet implemented');
});

// POST subscriptions/xrconnectregister
router.post('/xrconnectregister', function (req, res, next) {

    // CORS Headers (client > gme app, not gme >  mailchimp)
    // todo: SECURE THIS ON PRODUCTION!
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var listId = '05bed547f8';
    var body = JSON.stringify({
        'email_address': Math.random() + '-' + Math.random() + '@emailrand',
        'status': 'subscribed',
        'merge_fields': {
            'MMERGE3': req.body.test
        }
    });

    request(
        {
            method: 'POST',
            url: mailchimpUrl + '/3.0/lists/' + listId + '/members/',
            headers: {
                'Authorization': 'apikey ' + apiKey,
            },
            body: body
        },
        function (error, response, body) {
            if (!error) {
                if (response.statusCode > 400) {
                    // http level problem - didn't connect through to mailchimp
                    res.send({status: 'failed', reason: 'bad status code: ' + response.statusCode});
                } else {
                    var mailchimpResponse = JSON.parse(body);
                    if (mailchimpResponse.status >= 400) {
                        res.send({status: 'fail', mailchimpresponse: mailchimpResponse, body: body});

                    } else {
                        // s'all goooood hombre
                        res.send({status: 'success', mailchimpresponse: mailchimpResponse});
                    }
                }
            } else {
                res.send({status: 'failed', reason: error});
            }
        }
    );

    // fs.writeFile("mydata.txt", "Hey there!", function(err) {
    //     if(err) {
    //         res.send({status: err});
    //         return console.log(err);
    //     }
    //     res.send({status: 'ok', messagxxxe: req.body, othermessaxxxge:req.body.test});
    //
    //     console.log("The file was saved!");
    // });

});

// POST subscriptions/savethedateregister
router.post('/savethedateregister', function (req, res, next) {

    // CORS Headers (client > gme app, not gme >  mailchimp)
    // todo: SECURE THIS ON PRODUCTION!
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var listId = '14142a683f'; //req.body.listId;
    var body = JSON.stringify({
        'email_address': req.body.email.toLowerCase(),
        'status': 'subscribed',
        'merge_fields': {
            'FNAME': req.body.firstName,
            'LNAME': req.body.lastName,
            'MMERGE4': req.body.numberOfGuests || 1,
            'MMERGE3': req.body.companyName,
            'MMERGE5': req.body.eventAttending
        }
    });

    request(
        {
            method: 'POST',
            url: mailchimpUrl + '/3.0/lists/' + listId + '/members/',
            headers: {
                'Authorization': 'apikey ' + apiKey,
            },
            body: body
        },
        function (error, response, body) {
            if (!error) {
                if (response.statusCode > 400) {
                    // http level problem - didn't connect through to mailchimp
                    res.send({status: 'failed', reason: 'bad status code: ' + response.statusCode});
                } else {
                    var mailchimpResponse = JSON.parse(body);
                    if (mailchimpResponse.status >= 400) {

                        // In these cases we do not get back the current member
                        // data - just an 'existing member' message

                        // Does this member/email already exist in mailchimp?
                        if (mailchimpResponse.status == 400 && mailchimpResponse.title == 'Member Exists') {
                            // update the answer

                            var md5 = require('blueimp-md5');
                            var subscriberHash = md5(req.body.email.toLowerCase());

                            var body = JSON.stringify({
                                'merge_fields': {
                                    'FNAME': req.body.firstName,
                                    'LNAME': req.body.lastName,
                                    'MMERGE4': req.body.numberOfGuests || 1,
                                    'MMERGE3': req.body.companyName,
                                    'MMERGE5': req.body.eventAttending
                                }
                            });

                            request(
                                {
                                    method: 'PATCH',
                                    url: mailchimpUrl + '/3.0/lists/' + listId + '/members/' + subscriberHash,
                                    headers: {
                                        'Authorization': 'apikey ' + apiKey,
                                    },
                                    body: body
                                }, function (error, response, body) {
                                    if (!error) {
                                        // s'all goooood hombre
                                        res.send({status: 'success', info: 'updated'});
                                    } else {
                                        res.send({
                                            status: 'failed',
                                            reason: 'error when trying to update existing email record'
                                        });
                                    }
                                });

                        } else {
                            // generic error
                            res.send({status: 'failed', reason: 'mailchimp generic error: ' + response.statusCode});
                        }

                    } else {
                        // s'all goooood hombre
                        res.send({status: 'success', info: 'added'});
                    }


                }
            } else {
                res.send({status: 'failed', reason: error});
            }
        }
    );
});

// POST subscriptions/subscribe
router.post('/subscribe', function (req, res, next) {

    // CORS Headers (client > gme app, not gme >  mailchimp)
    // todo: SECURE THIS ON PRODUCTION!
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var listId = req.body.listId;
    var body = JSON.stringify({
        'email_address': req.body.email.toLowerCase(),
        'status': 'subscribed',
        'merge_fields': {
            'MMERGE3': 'microsite'
        }
    });

    request(
        {
            method: 'POST',
            url: mailchimpUrl + '/3.0/lists/' + listId + '/members/',
            headers: {
                'Authorization': 'apikey ' + apiKey,
            },
            body: body
        },
        function (error, response, body) {
            if (!error) {
                if (response.statusCode > 400) {
                    // http level problem - didn't connect through to mailchimp
                    res.send({status: 'failed', reason: 'bad status code: ' + response.statusCode});
                } else {
                    var mailchimpResponse = JSON.parse(body);
                    if (mailchimpResponse.status >= 400) {
                        res.send({status: 'fail', mailchimpresponse: mailchimpResponse, body: body});

                    } else {
                        // s'all goooood hombre
                        res.send({status: 'success', mailchimpresponse: mailchimpResponse});
                    }
                }
            } else {
                res.send({status: 'failed', reason: error});
            }
        }
    );
});

module.exports = router;