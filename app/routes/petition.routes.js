const petitions = require ('../controllers/petition.controller');
const categories = require ('../controllers/category.controller');
const signatures = require ('../controllers/signature.controller');


module.exports = function (app) {
    app.route(app.rootUrl + '/petitions')
        .get(petitions.list)
        .post(petitions.create);

    app.route(app.rootUrl + '/petitions/categories')
        .get(categories.list);

    app.route(app.rootUrl + '/petitions/:id')
        .get(petitions.read)
        .patch(petitions.update)
        .delete(petitions.remove);

    app.route(app.rootUrl + '/petitions/:id/photo')
        .get(petitions.readPhoto)
        .put(petitions.uploadPhoto);

    app.route(app.rootUrl + '/petitions/:id/signatures')
        .get(signatures.list)
        .post(signatures.create)
        .delete(signatures.remove);
};