/**
 * Created by sunny on 3/27/15.
 */

module.exports = function handlingRequests(connection, app){

    var bodyParser  =   require('body-parser');
    var mysql       =   require("mysql");

    app.use(bodyParser.json());


    app.post('/register', function toRegister(req, res) {

        var phone = req.body.phone;
        var password = req.body.password;
        console.log(phone);
        console.log(password);


        var query = "INSERT INTO acs_cust(customer_phone, customer_password) " +
            "VALUES (?,?)";
        var inputs = [phone, password];
        var injectionQuery = mysql.format(query, inputs);
        console.log(injectionQuery);
        connection.query(injectionQuery, function resultSet(error, rows) {

            connection.release();
            if (error) {

                console.log("Error in insertion to database");
                res.json({"message": "ERROR!! user not created"});

            }
            else {
                console.log(rows);
                res.json({"message": " user created! "});
            }
        });

    });

    //app.get();

}