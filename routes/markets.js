'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const feederService = require("../services/feeder");
const router = express.Router();

// Automatically parse request body as form data
router.use(bodyParser.urlencoded({extended: false}));


router.post('/', async (req, res, next) => {
    try {
        await feederService.updateMarketConfiguration();
        res.json({data: 'OK'});
    } catch (error) {
        console.log("Errors are", error);
        next(error);
    }
});


router.get('/', async (req, res, next) => {
    try {
        await feederService.getArbitrateCoins();
        res.json({data: 'OK'});
    } catch (error) {
        console.log("Errors are", error);
        next(error);
    }
});

module.exports = router;
