const db = require('../../config/db');

exports.getAll = async function () {
    const connection = await db.getPool().getConnection();
    const sql = 'SELECT * FROM Petition';

    const [rows, _] = await connection.query(sql);
    return rows;
};

exports.getAllWithQueryParameters = async function () {
    const connection = await db.getPool().getConnection();
    const sql = 'SELECT * FROM Petition';
    const [rows, fields] = await connection.query(sql);
    return rows;
}