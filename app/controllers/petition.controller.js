const Petition = require('../models/petition.model');

exports.list = async function (req, res) {
    try {
        const startIndex = req.query.startIndex;
        const count = req.query.count;
        const q = req.query.q;
        const categoryId = req.query.categoryId;
        const authorId = req.query.authorId;
        const sortBy = req.query.sortBy;

        console.log(startIndex, count, q, categoryId, authorId, sortBy);

        console.log(req.uri);

        if (req.url == null) {
            console.log("wooo");
            const result = await Petition.getAll();
        } else {
            const result = await Petition.getAllWithQueryParameters();
        }

        res.statusMessage = "OK";
        res.status(200)
            .send(result);
    } catch (err) {
        console.log(err);
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send(`ERROR getting petitions ${err}`)
    }
};