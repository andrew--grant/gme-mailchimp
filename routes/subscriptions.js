var express = require('express');
var router = express.Router();
var Mailchimp = require('mailchimp-api-v3');
var mailchimpUrl = 'http://us9.api.mailchimp.com';
var apiKey = process.env['mailchimp-api-key'];
var sqlPwd = process.env['sqlpwd'];
//var listId = 'f37f9feb84';
var mailchimp = new Mailchimp(apiKey);
var request = require('request');

var bodyParser = require('body-parser')

var app = express()
// parse application/json
app.use(bodyParser.json())


var fs = require('fs');
// GET subscriptions.
router.get('/', function (req, res, next) {

    res.json({api_status: 'ok'});

});


// POST subscriptions/compsubscribe
router.post('/compsubscribe', function (req, res, next) {

    // CORS Headers (client > gme app, not gme >  mailchimp)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var listId = req.body.listId;
    var body = JSON.stringify({
        'email_address': req.body.email.toLowerCase(),
        'status': 'subscribed',
        'merge_fields': {
            'FNAME': req.body.firstName,
            'LNAME': req.body.lastName,
            'MMERGE4': req.body.mobile.replace(/\s/g, '').replace(/\-/g, ''),
            'MMERGE3': req.body.eventName,
            'MMERGE5': req.body.answer,
            'MMERGE6': req.body.eventSource,
            'MMERGE7': req.body.eventFacilitator,
            'MMERGE8': req.body.state,
            'MMERGE9': req.body.businessUnit,
            'MMERGE11': req.body.isSubscribed
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

                        // Does this member/email already exist in mailchimp? If so, we can
                        // resubmit the request as an update operation
                        if (mailchimpResponse.status == 400 && mailchimpResponse.title == 'Member Exists') {
                            // update the answer

                            var md5 = require('blueimp-md5');
                            var subscriberHash = md5(req.body.email.toLowerCase());

                            var body = JSON.stringify({
                                'merge_fields': {
                                    'MMERGE5': req.body.answer,
                                    'MMERGE3': req.body.eventName
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
                                        res.send({status: 'success'});
                                    } else {
                                        res.send({
                                            status: 'failed',
                                            reason: 'error when trying to update existing email record'
                                        });
                                    }
                                });

                        } else {
                            // must be a generic error
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


// GET subscriptions/winner
router.get('/winner', function (req, res, next) {
    res.send('not yet implemented');
});

// POST subscriptions/xrconnectregister   USED BY XRS IOS/ANDROID APP
router.post('/xrconnectregister', function (req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    try {


        var bodyIncomingParsed = JSON.parse(req.body.data);

        var theMergedFields = {
            'FNAME': bodyIncomingParsed.FirstName || '',
            'LNAME': bodyIncomingParsed.LastName || '',
            'MMERGE8': bodyIncomingParsed.Mobile || '',
            'MMERGE9': bodyIncomingParsed.Postcode || '',
            'MMERGE5': bodyIncomingParsed.Marketing || '',
            'MMERGE10': bodyIncomingParsed.SerialNumber || '',
            'MMERGE7': bodyIncomingParsed.RadioModel || '',
            'MMERGE3': bodyIncomingParsed.ReadPolicy || ''


        }

        var body = JSON.stringify({
            'email_address': bodyIncomingParsed.Email,
            'status': 'subscribed',
            'merge_fields': theMergedFields
        });

        request(
            {
                method: 'POST',
                url: mailchimpUrl + '/3.0/lists/daf92284c5/members/',
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

                            // Does this member/email already exist in mailchimp? If so, we can
                            // resubmit the request as an update operation
                            if (mailchimpResponse.status == 400 && mailchimpResponse.title == 'Member Exists') {
                                // update the answer

                                var md5 = require('blueimp-md5');
                                var subscriberHash = md5(bodyIncomingParsed.Email.toLowerCase());

                                var bodyUpdate = JSON.stringify({
                                    'merge_fields': theMergedFields
                                });

                                request(
                                    {
                                        method: 'PATCH',
                                        url: mailchimpUrl + '/3.0/lists/daf92284c5/members/' + subscriberHash,
                                        headers: {
                                            'Authorization': 'apikey ' + apiKey,
                                        },
                                        body: bodyUpdate
                                    }, function (error, response, body) {
                                        if (!error) {
                                            // s'all goooood hombre
                                            res.send({status: 'success'});
                                        } else {
                                            res.send({
                                                status: 'failed',
                                                reason: 'error when trying to update existing email record'
                                            });
                                        }
                                    });

                            } else {
                                // must be a generic error
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


    } catch (err) {
        console.log('could not process Mailchimp request, on to SQL insert')
    }


    // Also save to Azure SQL table

    var sql = require('mssql');

    var config = {
        user: 'DB_Admin',
        password: sqlPwd,
        server: 'kecenudals.database.windows.net',
        database: 'GMEWeb_Aux',
        options: {
            encrypt: true // required by Azure
        }
    }

    var bodySql = JSON.stringify({
        'email_address': Math.random() + '-' + Math.random() + '@emailrand.com',
        'status': 'subscribed',
        'merge_fields': {
            'MMERGE3': req.body.data
        }
    });


    sql.connect(config).then(function () {
        // Query
        new sql.Request()
            .query("insert into GMELocationLog (LogDateTime, LogStatus) values ('" + new Date().toISOString() + "','" + bodySql + "')").then(function (recordset) {
            console.log('good news');
            console.log(recordset);
        }).catch(function (err) {
            console.log('sql level error');
            console.log(err);
        });
    }).catch(function (err) {
        console.log('connect level error');
    });

});

// POST subscriptions/savethedateregister
router.post('/savethedateregister', function (req, res, next) {

    // CORS Headers (client > gme app, not gme >  mailchimp)
    // todo: SECURE THIS ON PRODUCTION!
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var listId = 'a6f1694bb5'; //req.body.listId;
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