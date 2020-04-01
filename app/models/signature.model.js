const db = require('../../config/db');



exports.getAllById = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT s.signatory_id as signatoryId, u.name, u.city, u.country, s.signed_date as signedDate ' +
                  'FROM Signature AS s ' +
            'INNER JOIN User AS u ON s.signatory_id = u.user_id ' +
                 'WHERE s.petition_id = ? ' +
              'ORDER BY s.signed_date ASC';

    let [rows] = await connection.query(query, petitionId);

    connection.release();
    return rows;
};


exports.deleteByPetitionId = async function (petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'DELETE FROM Signature WHERE petition_id = ?';

    await connection.query(query, petitionId);
    connection.release();
};


exports.checkIfUserHasAlreadySignedPetition = async function (userId, petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM Signature WHERE signatory_id = ? AND petition_id = ?';
    let values = [
        [userId],
        [petitionId]
    ];
    let [rows] = await connection.query(query, values);
    let isAlreadySigned = false;

    if (rows[0]) {
        isAlreadySigned = true;
        console.log("Petition is already signed by user " + userId)
    }

    connection.release();
    return isAlreadySigned;
};


exports.signPetition = async function (userId, petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'INSERT INTO Signature (signatory_id, petition_id, signed_date) VALUES (?, ?, ?)';
    let values = [
        [userId],
        [petitionId],
        [new Date()]
    ];
    let [rows] = await connection.query(query, values);

    connection.release();
};


exports.deleteOne = async function (userId, petitionId) {
    const connection = await db.getPool().getConnection();
    let query = 'DELETE FROM Signature WHERE signatory_id = ? AND petition_id = ?';
    let values = [
        [userId],
        [petitionId]
    ];
    await connection.query(query, values);

    connection.release();
};

