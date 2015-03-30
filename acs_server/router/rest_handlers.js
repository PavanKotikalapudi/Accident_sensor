/**
 * Created by sunny on 3/27/15.
 */

module.exports = function handlingRequests(connection, app){

    var bodyParser  =   require('body-parser');
    var mysql       =   require("mysql");
    var async       =   require("async");

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

            //connection.release(); not working
            if (error) {

                console.log("Error in insertion to database");
                res.json({"message": "ERROR!! user already exists"});


            }
            else {
                console.log(rows);
                res.json({"message": " user created! "});

            }


        });

    });

    app.post('/login', function toLogin(req, res){

        var username = req.body.phone;
        var password = req.body.password;
        console.log(username);
        console.log(password);
        var query = "SELECT customer_id FROM acs_cust WHERE customer_phone= ?" +
            " and customer_password = ? ;";
        var inputs = [username, password];
        var injectionQuery = mysql.format(query, inputs);
        console.log(injectionQuery);

        connection.query(injectionQuery, function resultSet(error, rows){

            //connection.release();
            if (error) {

                console.log("Error in login "+ error);


            }
            else {


                if (rows[0] === undefined){
                    console.log(rows[0] === undefined);
                    res.json({"message": "user or password doesn't match!!"});

                }
                else{
                    console.log(rows[0]);
                    console.log(rows[0].customer_id);
                    res.json({"message": " user and password correct ",
                        "customer_id":rows[0].customer_id});
                }
            }
        });


    });

    app.put('/user/:userId/updateprofile', function toUpdateProfile(req, res){

        /*{"name":"sunny",
         "age":"24",
         "gender":"m",
         "address":"abcd",
         "econtact1Name":"rk",
         "econtact1Phone":"2343",
         "econtact1Email":"XXX",
         "econtact2Name":"XXX",
         "econtact2Phone":"2222",
         "econtact2Email":"XXX",
         "econtact3Name":"XXX",
         "econtact3Phone":"2345",
         "econtact3Email":"XXX"}*/

        var customer_id = req.params.userId;
        console.log(customer_id);
        console.log("inside put");
        var name = req.body.name;
        var age = req.body.age;
        var gender = req.body.gender;
        var address = req.body.address;
        var econtact1Name = req.body.econtact1Name;
        var econtact1Phone = req.body.econtact1Phone;
        var econtact1Email = req.body.econtact1Email;
        var econtact2Name = req.body.econtact2Name;
        var econtact2Phone = req.body.econtact2Phone;
        var econtact2Email = req.body.econtact2Email;
        var econtact3Name = req.body.econtact3Name;
        var econtact3Phone = req.body.econtact3Phone;
        var econtact3Email = req.body.econtact3Email;

        async.parallel({

            one: function (callback) {

                checkContact(econtact1Name, econtact1Phone, econtact1Email,
                                                function (err, result) {

                    if (err) return callback(err);

                    callback(null, result);


                });

            },
            two: function (callback) {

                checkContact(econtact2Name, econtact2Phone, econtact2Email,
                                                function (err, result) {

                    if (err) return callback(err);

                    callback(null, result);


                });

            },

            three: function (callback) {

                checkContact(econtact3Name, econtact3Phone, econtact3Email,
                                                function (err, result) {

                    if (err) return callback(err);

                    callback(null, result);


                });

            }

        }, function evaluateResults(err, values){

            console.log("results");
            console.log(values.one);
            console.log(values.two);
            console.log(values.three);
            console.log("---------------");
            var query = "UPDATE acs_cust SET customer_name = ?," +
                " customer_age = ?, customer_gender = ?, " +
                "customer_address = ?,customer_econtact1 = ?, " +
                "customer_econtact2 = ?, customer_econtact3 = ? " +
                "WHERE customer_id ='"+customer_id+"';";
            var inputs = [name, age, gender, address, values.one, values.two,
                            values.three];
            var injectionQuery = mysql.format(query, inputs);
            console.log(injectionQuery);

            connection.query(injectionQuery, function(err, rows){

                if (err){

                    console.log(err);
                }
                else{

                    console.log(rows);
                    res.json({"message":"data updated"});
                }
            });

        });


    });

    /*app.get('/test/:testnumber', function(req, res){

        var enumber = req.params.testnumber;
        console.log("test_id:" +enumber);

        async.parallel({

            one: function (callback) {

                checkContact(enumber, function (err, result) {

                    if (err) return callback(err);

                    callback(null, result);


                });

            },

            two: function (callback) {

                checkContact('2344', function (err, result) {

                    if (err) return callback(err);

                    callback(null, result);


                });

            },

            three: function (callback) {

                checkContact('2347', function (err, result) {

                    if (err) return callback(err);

                    callback(null, result);


                });

            }


        }, function searchForEcontacts(err, values){

            console.log("results");
            console.log(values.one);
            console.log(values.two);
            console.log(values.three);


        });



        res.json({"contactID":""});
    });*/



    function checkContact(eName, ePhone,eEmail, callback){

        var query = "SELECT contacts_id FROM acs_contacts WHERE " +
                                                "contact_phone = ? ;";
        var inputs = [ePhone];
        var injectionQuery = mysql.format(query, inputs);
        console.log(injectionQuery);

        connection.query(injectionQuery, function resultSet(error, rows){

            if (error) {

                console.log("Error in login module "+ error);


            }
            else {


                if (rows[0] === undefined){
                    console.log(rows[0] === undefined);
                    console.log("contact not present in db yet");

                    var query1 = "INSERT INTO acs_contacts (contact_name, " +
                        "contact_phone, contact_email) VALUES (?,?,?);";
                    var inputs1 = [eName, ePhone, eEmail];
                    var injectionQuery1 = mysql.format(query1, inputs1);
                    console.log(injectionQuery1);

                    connection.query(injectionQuery1, function resultSet1(err,
                                                                          rows){

                        if(err){

                            console.log(err);
                        }
                        else{

                            checkContact(eName, ePhone,eEmail, function
                                                            (err, result) {

                                if (err) return callback(err);

                                callback(null, result);


                            });
                        }
                    });

                }
                else{
                    console.log(rows[0]);
                    console.log(rows[0].contacts_id);

                    //return rows[0].contacts_id;

                    callback(null, rows[0].contacts_id);
                }
            }

        });
    }

}