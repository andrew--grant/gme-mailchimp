var express = require('express');
var router = express.Router();
var Mailchimp = require('mailchimp-api-v3');
var apiKey = 'e3e446cfa981120859f63bef031cc0ec-us10';
var listId = 'ee321b4c68';
var mailchimp = new Mailchimp(apiKey);
var request = require('request');

// GET subscriptions.
router.get('/', function (req, res, next) {

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
    // todo: SECURE THIS ON PRODUCTION
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // todo: add in body params

    var body = JSON.stringify({
        'email_address': req.body.email,
        'status': 'subscribed',
        'merge_fields': {
            'FNAME': req.body.firstName,
            'LNAME': req.body.lastName,
            'MMERGE4': req.body.mobile.replace(' ',''),
            'MMERGE3': req.body.eventName,
            'MMERGE5':req.body.answer,
            'MMERGE6':req.body.eventSource,
            'MMERGE7':req.body.eventFacilitator
        }
    });

    console.log('req.body');
    console.log(req.body);
    console.log('');

    console.log('request body');
    console.log(body);
    console.log('');

    request(
        {
            method: 'POST',
            url: 'http://us10.api.mailchimp.com/3.0/lists/' + listId + '/members/',
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
                    console.log('---------- Mailchimp Response ------------');
                    console.log(mailchimpResponse);
                    console.log('');

                    // mailchimp error code as per:
                    // http://developer.mailchimp.com/documentation/mailchimp/guides/error-glossary/
                    if (mailchimpResponse.status >= 400) {
                        res.send({status: 'failed', reason: 'bad status code: ' + response.statusCode});
                        console.log('debug: mailchimpResponse.status ' + mailchimpResponse.status);
                    } else {
                        var emailExists = (mailchimpResponse.title == 'Member Exists');
                        if (!emailExists) {
                            res.send({status: 'success'});
                            console.log('user now in comp!');
                        } else {
                            // do this when email already in
                            // mailchimp subscription list
                            res.send({status: 'email exists'});
                            console.log('Member Exists logic not yet implemented');
                        }
                    }
                }
            } else {
                res.send({status: 'failed', reason: error});
                console.log('failed: ' + error);
                console.log(error);
            }
        }
    );
});

module.exports = router;