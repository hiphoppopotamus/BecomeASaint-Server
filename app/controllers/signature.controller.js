const User = require('../models/user.model');
const Petition = require('../models/petition.model');
const Signature = require('../models/signature.model');
const moment = require('moment');


exports.list = async function (req, res) {
    const petitionId = req.params.id;
    try {
        let petition = await Petition.getOne(petitionId);
        if (petition === undefined) {
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("Petition Not Found");
        } else {
            const signatures = await Signature.getAllById(petitionId);
            res.statusMessage = 'OK';
            res.status(200)
                .send(signatures);
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR getting signature ${err}`)
    }
};


exports.create = async function (req, res) {
    const petitionId = req.params.id;
    const authToken = req.headers['x-authorization'];
    try {
        const authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        // if petition not valid (like petition dont exist) 404
        const isValidPetition = await Petition.validatePetition(petitionId);
        if (!isValidPetition) {
            console.log('Petition provided is not a valid petition!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("Petition Not Found");
            return
        }

        const userId = await User.getUserIdFromToken(authToken);
        const petition = await Petition.getOne(petitionId);
        const closingDate = petition['closingDate'];
        if (moment(closingDate).isBefore(new Date())) {
            res.statusMessage = 'Forbidden: cannot sign a petition that is already closed';
            res.status(403).send();
            console.log('Cannot sign a petition that is already closed!');
            return
        }

        let isAlreadySigned = await Signature.checkIfUserHasAlreadySignedPetition(userId, petitionId);
        if (isAlreadySigned) {
            res.statusMessage = 'Forbidden: cannot sign a petition more than once';
            res.status(403).send();
            console.log('Cannot sign a petition that is already signed!');
        } else {
            await Signature.signPetition(userId, petitionId);
            res.statusMessage = 'Created';
            res.status(201).send();
        }

    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR getting signature ${err}`)
    }
};


exports.remove = async function (req, res) {
    const petitionId = req.params.id;
    const authToken = req.headers['x-authorization'];
    try {
        const authTokenExists = await User.checkIfAuthTokenExists(authToken);
        if (!authTokenExists) {
            res.statusMessage = 'Unauthorised';
            res.status(401)
                .send('I am not logged in at all! Token is not provided!');
            return
        }

        // if petition not valid (like petition dont exist) 404
        const isValidPetition = await Petition.validatePetition(petitionId);
        if (!isValidPetition) {
            console.log('Petition provided is not a valid petition!');
            res.statusMessage = 'Not Found';
            res.status(404)
                .send("Petition Not Found");
            return
        }

        // A user cannot remove a signature from a petition they haven't signed,
        const userId = await User.getUserIdFromToken(authToken);
        let isAlreadySigned = await Signature.checkIfUserHasAlreadySignedPetition(userId, petitionId);
        if (!isAlreadySigned) {
            res.statusMessage = 'Forbidden: user cannot remove a signature from a petition they haven not signed';
            res.status(403).send('A user cannot remove a signature from a petition they have not signed');
            console.log('A user cannot remove a signature from a petition they have not signed');
            return
        }

        // A user cannot remove a signature from a petition they created,
        const authorId = await Petition.getAuthor(petitionId);
        if (userId === authorId) {
            res.statusMessage = 'Forbidden: user cannot remove a signature from a petition they created';
            res.status(403).send('A user cannot remove a signature from a petition they created');
            console.log('A user cannot remove a signature from a petition they created');
            return
        }

        // A user cannot remove a signature from a petition that has closed.
        const petition = await Petition.getOne(petitionId);
        const closingDate = petition['closingDate'];
        if (moment(closingDate).isBefore(new Date())) {
            res.statusMessage = 'Forbidden: user cannot remove a signature from a petition that has closed';
            res.status(403).send('A user cannot remove a signature from a petition that has closed');
            console.log('A user cannot remove a signature from a petition that has closed');
        } else {
            await Signature.deleteOne(userId, petitionId);
            res.statusMessage = 'OK';
            res.status(200).send();
        }
    } catch (err) {
        res.statusMessage = 'Internal Server Error';
        res.status(500)
            .send(`ERROR getting signature ${err}`)
    }
};