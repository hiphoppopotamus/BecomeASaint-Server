const db = require('../../config/db');


exports.getAll = async function () {
    const connection = await db.getPool().getConnection();
    let query = `SELECT category_id AS categoryId, name FROM Category`;
    let [rows] = await connection.query(query);

    connection.release();
    return rows;
};


exports.checkCategoryId = async function (categoryId) {
    const connection = await db.getPool().getConnection();
    let query = 'SELECT * FROM Category WHERE category_id = ?';
    let values = [categoryId];
    let [rows] = await connection.query(query, values);
    let categoryIdExists = false;

    if (rows[0] !== undefined) {
        categoryIdExists = true;
    }

    connection.release();
    return categoryIdExists;
};
