var express = require('express');
var router = express.Router();
var Mailchimp = require('mailchimp-api-v3');
var mailchimpUrl = 'http://us9.api.mailchimp.com';//'http://us10.api.mailchimp.com';
var apiKey = 'd497aacaafd66952fd2121fb8799cee4-us9'; // 'e3e446cfa981120859f63bef031cc0ec-us10';
var listId = '5a388fe274';// 'ee321b4c68';
var mailchimp = new Mailchimp(apiKey);
var request = require('request');

// GET subscriptions.
router.get('/', function (req, res, next) {

    //todo: remove this and all usage of mailchimp, test.

    mailchimp.get({
        path: '/lists/' + listId
    }, function (err, result) {
        if (err) {
            res.json('error');
        } else {
            res.json(result);
        }
    })

});

// GET subscriptions/winner
router.get('/winner', function (req, res, next) {
    res.send('no yet implemented');
});

// GET subscriptions/subscribe
router.post('/subscribe', function (req, res, next) {

    // CORS Headers (client > gme app, not gme >  mailchimp)
    // todo: SECURE THIS ON PRODUCTION, no forgetty!!!
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


    var body = JSON.stringify({
        'email_address': req.body.email.toLowerCase(),
        'status': 'subscribed',
        'merge_fields': {
            'FNAME': req.body.firstName,
            'LNAME': req.body.lastName,
            'MMERGE4': req.body.mobile.replace(' ', ''),
            'MMERGE3': req.body.eventName,
            'MMERGE5': req.body.answer,
            'MMERGE6': req.body.eventSource,
            'MMERGE7': req.body.eventFacilitator
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
                    console.log("response.statusCode: " + response.statusCode);
                } else {
                    var mailchimpResponse = JSON.parse(body);

                    if (mailchimpResponse.status >= 400) {

                        if (mailchimpResponse.status == 400 && mailchimpResponse.title == 'Member Exists') {
                            // email exists logic
                            var md5 = require('blueimp-md5');
                            var subscriberHash = md5(req.body.email.toLowerCase());

                            var body = JSON.stringify({
                                'merge_fields': {
                                    'MMERGE5': req.body.answer
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
                                        console.log('patch response body');
                                        console.log(body);
                                        // s'all goooood hombre
                                        res.send({status: 'success'});
                                    } else {
                                        console.log('debug: ' + 'error when trying to update existing email record');
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
                        res.send({status: 'success'});
                    }
                }
            } else {
                res.send({status: 'failed', reason: error});
            }
        }
    );
});


module.exports = router;