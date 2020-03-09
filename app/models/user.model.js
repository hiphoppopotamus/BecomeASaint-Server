const db = require('../../config/db');

exports.insert = async function (user_data) {
    const connection = await db.getPool().getConnection();

    let insertSQL = 'INSERT INTO User (name, email, password';
    let valuesSQL = ') VALUES (?, ?, ?';

    let values = [
        [user_data['name'].toString()],
        [user_data['email'].toString()],
        [user_data['password'].toString()]
    ];

    if (user_data['city'] !== undefined) {
        insertSQL += ', city';
        valuesSQL += ', ?';
        values.push([user_data['city'].toString()]);
    }

    if (user_data['country'] !== undefined) {
        insertSQL += ', country';
        valuesSQL += ', ?';
        values.push([user_data['country'].toString()]);
    }

    let sql = insertSQL + valuesSQL + ')';

    //try catch for this?
    const [ rows, _ ] = await connection.query(sql, values);

    return rows;
};