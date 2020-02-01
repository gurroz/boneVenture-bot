'use strict';

const {Datastore} = require('@google-cloud/datastore');

// [START config]
const ds = new Datastore();
const kind = 'Markets';
const serialize = require('node-serialize');

function fromDatastore(obj) {
    console.log("fromDatastore are", obj);
    let newObj = {};
    newObj.id = obj.code;
    newObj.code = obj.code;
    newObj.obj = serialize.unserialize(obj.obj);

    return newObj;
}

function toDatastore(obj, nonIndexed) {
    nonIndexed = nonIndexed || [];
    const results = [];
    Object.keys(obj).forEach(k => {
        if (obj[k] === undefined) {
            return;
        }
        results.push({
            name: k,
            value: obj[k],
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1,
        });
    });
    return results;
}


function update(id, data, cb) {
    let key;
    if (id) {
        key = ds.key([kind, parseInt(id, 10)]);
    } else {
        key = ds.key(kind);
    }

    const entity = {
        key: key,
        data: toDatastore(data, ['obj']),
    };

    ds.save(entity, err => {
        data.id = entity.key.id;
        cb(err, err ? null : data);
    });
}

function create(data, cb) {
    update(null, data, cb);
}

function list(limit, cb) {
    const q = ds
        .createQuery([kind])
        .limit(limit)
        .order('code');

    ds.runQuery(q, async (err, entities, nextQuery) => {
        if (err) {
            cb(err);
            return;
        }
        const hasMore =
            nextQuery.moreResults !== Datastore.NO_MORE_RESULTS
                ? nextQuery.endCursor
                : false;

        cb(null, entities.map(fromDatastore), hasMore);
    });
}

module.exports = {
    create,
    list,
};