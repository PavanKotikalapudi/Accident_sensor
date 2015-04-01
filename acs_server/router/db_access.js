/**
 * Created by sunny on 3/24/15.
 */

module.exports = function dbConfig(app){

    var mysql = require("mysql");

    var pool = mysql.createPool({

        connectionLimit: 100,
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'acs_db',
        debug: false
    });

    pool.getConnection(function (err, connection) {

        if (err) {
            connection.release();
            console.log("ISSUE WITH MYSQL \n" + err);
            res.json({
                "code": 100, "status": "Error in connection database"
            });
            return;
        }
        else {

            console.log("connection successfully established to MySQL");


            require('./rest_handlers')(connection, app);


        }

    });



}
