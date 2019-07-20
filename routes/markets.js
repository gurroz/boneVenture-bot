'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const model = require('../model-datastore');

const router = express.Router();

// Automatically parse request body as form data
router.use(bodyParser.urlencoded({extended: false}));

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});


router.get('/', (req, res, next) => {
    model.list(10, req.query.pageToken, (err, entities, cursor) => {
        if (err) {
            next(err);
            return;
        }
        res.render('books/list.pug', {
            books: entities,
            nextPageToken: cursor,
        });
    });
});


router.get('/add', (req, res) => {
    res.render('books/form.pug', {
        book: {},
        action: 'Add',
    });
});

router.post('/add', (req, res, next) => {
    const data = req.body;

    // Save the data to the database.
    model.create(data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
});

module.exports = router;
