'use strict';

const {Datastore} = require('@google-cloud/datastore');

// [START config]
const ds = new Datastore();
const kind = 'Config';

const create = conf => {
    return ds.upsert({
        key: ds.key(kind),
        data: conf,
    });
};

function list(limit) {
    const q = ds
        .createQuery(kind)
        .limit(limit)
        ;

    return ds.runQuery(q);
}

module.exports = {
    create,
    list,
};