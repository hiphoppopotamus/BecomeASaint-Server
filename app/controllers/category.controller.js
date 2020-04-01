const Category = require('../models/category.model');


exports.list = async function (req, res) {
    try {
        let categories = await Category.getAll();
        res.statusMessage = "OK";
        res.status(200)
            .send(categories);
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR getting categories ${err}`)
    }
};