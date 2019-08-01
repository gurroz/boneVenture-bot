'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const model = require('../daos/config-dao');

const router = express.Router();

// Automatically parse request body as form data
router.use(bodyParser.urlencoded({extended: false}));


router.get('/', async (req, res, next) => {
    try {
        const [entities] = await model.list(1);
        res.json({data: entities});
    } catch (error) {
        console.log("Errors are", error);
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    const data = createConfig();

    try {
        await model.create(data);
        const [entities] = await model.list(1);
        res.json({data: entities});
    } catch (error) {
        console.error("Errors are", error);
        next(error);
    }
});

const createConfig = () => {
    let marketConfig = {
        markets: [
            {code:'buda', api:'rwrwdsfds'}
            ,{code:'coinspot', api:'rwrwdsfds'}
        ],
        processing: false,
        marketsLastUpdate: new Date(),
        transactionAmount: 0.1,
        lastTransaction: new Date(),
        transactionWaitSeconds: 10
    };

    // let feederConfig = {
    //     id: '124',
    //     start: new Date(),
    //     tries: 3
    // };
    //
    // let deciderConfig = {
    //     id: '0',
    // };

    // let fullconfig = [marketConfig, feederConfig, deciderConfig];
    return marketConfig;
};

module.exports = router;
