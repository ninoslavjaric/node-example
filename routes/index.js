const express = require('express');
const router = express.Router();
const Fetcher = require('../logic/statuses');

router.get('/', function(req, res, next) {
    if (req.headers['sec-fetch-mode'] === 'cors' || req.xhr || req.query.json) {
        Fetcher.getStatuses().then((success, error) => {
            res.json({data: success});
        });

        return;
    }

    res.render('index', {title: 'Monitor'});
});

router.get('/get-process/:id', (req, res) => {
    Fetcher.getStatus(req.params.id).then(data => res.json(data));
});

module.exports = router;
