/**
 * Created by sunny on 3/27/15.
 */

module.exports = function handlingRequests(connection, app, winston){

  var bodyParser  =   require('body-parser');
  var mysql       =   require("mysql");
  var async       =   require("async");
  var nodemailer  =   require("nodemailer");

  var smtpTransport = nodemailer.createTransport("SMTP",{
      service: "Gmail",
      auth: {
          user: "accident.sensor@gmail.com",
          pass: "accsensor"
      }
  });
  winston.info('configured nodemailer. ready to serve');
  app.use(bodyParser.json());

  app.post('/register', function toRegister(req, res) {

    var phone = req.body.phone;
    var password = req.body.password;
    winston.info('new user registering ', phone);

    var query = "INSERT INTO acs_cust(customer_phone, customer_password) " +
          "VALUES (?,?)";
    var inputs = [phone, password];
    var injectionQuery = mysql.format(query, inputs);
    winston.debug('query to register user ',injectionQuery);
    connection.query(injectionQuery, function resultSet(error, rows) {
          //connection.release(); not working
      if (error) {
        winston.info('Error in insertion to database',error);
        res.json({"message": "ERROR!! user already exists or " +
        "details provided not correct"});
      }
      else {
        winston.debug(rows);
        winston.info('registration successful for ', phone);
        res.json({"message": "success"});
      }
    });
  });

  app.post('/login', function toLogin(req, res){

    var username = req.body.phone;
    var password = req.body.password;
    winston.info('user ',username,'trying to login');
    var query = "SELECT customer_id FROM acs_cust WHERE customer_phone= ?" +
        " and customer_password = ? ;";
    var inputs = [username, password];
    var injectionQuery = mysql.format(query, inputs);
    winston.debug('login query injected ',injectionQuery);
    connection.query(injectionQuery, function resultSet(error, rows){
            //connection.release();
      if (error) {
        winston.info('Error in login ',error);
        res.json({"message":"server error. please try again later"});
      }
      else {
        if (rows[0] === undefined){
          winston.info('login unsuccessful');
          res.json({"message": "user or password doesn't match!!"});
        }
        else{
          winston.info('successfully logged in user ', phone);
          res.json({"message": "success", "customer_id":rows[0].customer_id});
        }
      }
    });
  });

  app.put('/user/:userId/updateprofile', function toUpdateProfile(req, res){

    var customer_id = req.params.userId;
    winston.info('updating profile info of user ',customer_id);
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

        checkAndUpdateEcontact(econtact1Name, econtact1Phone, econtact1Email,
                                                function (err, result) {
          if (err) return callback(err);
          callback(null, result);
        });
      },
      two: function (callback) {

        checkAndUpdateEcontact(econtact2Name, econtact2Phone, econtact2Email,
                                                function (err, result) {
          if (err) return callback(err);
          callback(null, result);
        });
      },
      three: function (callback) {

        checkAndUpdateEcontact(econtact3Name, econtact3Phone, econtact3Email,
                                                function (err, result) {
          if (err) return callback(err);
          callback(null, result);
        });
      }
    }, function evaluateResults(err, values){

      winston.debug('returned with contacts_ids');

      var query = "UPDATE acs_cust SET customer_name = ?," +
                " customer_age = ?, customer_gender = ?, " +
                "customer_address = ?,customer_econtact1 = ?, " +
                "customer_econtact2 = ?, customer_econtact3 = ? " +
                "WHERE customer_id ='"+customer_id+"';";
      var inputs = [name, age, gender, address, values.one, values.two,
                            values.three];
      var injectionQuery = mysql.format(query, inputs);
      winston.debug('query to update the customer info ',injectionQuery);
      connection.query(injectionQuery, function(err, rows){

        if (err){
          winston.info('error at updating customer info :',err);
          res.json({"message":"error in updating info"});
        }
        else{
          winston.debug(rows);
          winston.info('updated info successfully of user ',customer_id);
          res.json({"message":"data updated"});
        }
      });
    });
  });

  app.get('/user/:userId/accidentalert', function sendAlert(req, res){

    var customer_id = req.params.userId;
    winston.info('user id of customer who reported accident is ',customer_id);

    var latitude = req.query.latitude;
    var longitude = req.query.longitude;
    winston.debug('user location: ',latitude,' : ',longitude);

    async.waterfall([

      function retrieveEcontactsIds(callback){

        getCustomerInfo(customer_id, function (err, result) {

          if (err) return callback(err);
          winston.debug('retireved econtactIds successfully');
          callback(null, result);
        });
      },
      function retireveEcontactsDetails(customerInfo,callback){

      winston.debug("in parallel async of retrieve econtactsDetails");
      var customer_name = customerInfo.customer_name;
      var customer_phone = customerInfo.customer_phone;
      var econtact1Id = customerInfo.customer_econtact1;
      var econtact2Id = customerInfo.customer_econtact2;
      var econtact3Id = customerInfo.customer_econtact3;

      async.parallel({

        oneContactSending: function(callback){

          sendAlertToEcontacts(customer_name, customer_phone,
                                latitude,longitude,econtact1Id,
                                function (err,result) {

            if (err) return console.log(err);
            winston.debug('sent to alert to econtact1 successfully ');
            winston.debug(result);
          });
        },
        twoContactSending: function(callback){

          sendAlertToEcontacts(customer_name, customer_phone,
                                latitude,longitude,econtact2Id,
                                function (err,result) {

            if (err) return console.log(err);
            winston.debug('sent to alert to econtact2 successfully ');
            winston.debug(result);
          });
        },
        threeContactSending: function(callback){

          sendAlertToEcontacts(customer_name, customer_phone,
                                latitude,longitude,econtact3Id,
                                function (err,result) {

            if (err) return console.log(err);
            winston.debug('sent to alert to econtact3 successfully ');
            winston.debug(result);
          });
        }
      },callback);
      callback(null,"sent complete");

    }],function DoneAlerting(err,result){

      console.log("at done ");

    });
    winston.info('details sent to econtacts');
    res.json({"message":"details sent to econtacts"});
  });

  app.get('/user/:userId',function getUserInfo(req, res){

    var customer_id = req.params.userId;
    winston.info('requesting complete info of user ',customer_id);
    var customer_name;
    var customer_phone;
    var customer_age;
    var customer_gender;
    var customer_address;
    var econtact1Id;
    var econtact2Id;
    var econtact3Id;
    var contact1_name;
    var contact1_phone;
    var contact1_email;
    var contact2_name;
    var contact2_phone;
    var contact2_email;
    var contact3_name;
    var contact3_phone;
    var contact3_email;

    async.waterfall([

      function retrieveCustomerInfo(callback){

        getCustomerInfo(customer_id, function (err, result) {

          if (err) return callback(err);
          winston.debug('retrieved complete customer info successfully ' +
          'successfully');
          callback(null, result);
        });
      },

      function retireveEcontactsDetails(customerInfo,callback){

        winston.debug('in parallel async to retrieve econtact info');
        customer_name = customerInfo.customer_name;
        customer_phone = customerInfo.customer_phone;
        customer_age = customerInfo.customer_age;
        customer_gender = customerInfo.customer_gender;
        customer_address = customerInfo.customer_address;
        econtact1Id = customerInfo.customer_econtact1;
        econtact2Id = customerInfo.customer_econtact2;
        econtact3Id = customerInfo.customer_econtact3;

        async.parallel({

        retrieveEcontact1Info: function(callback){

          getEcontactInfo(econtact1Id, function(err, result){

            if (err) return callback(err);
            callback(null,result);
          });
        },
        retrieveEcontact2Info: function(callback){

          getEcontactInfo(econtact2Id, function(err, result){

            if (err) return callback(err);
            callback(null,result);
          });
        },
        retrieveEcontact3Info: function(callback){

          getEcontactInfo(econtact3Id, function(err, result){

            if (err) return callback(err);
            callback(null,result);
          });
        }
        },function completeInfo(err,result){

          winston.debug('at the end of the retrieval of complete info');
          contact1_name = result.retrieveEcontact1Info.contact_name;
          contact2_name = result.retrieveEcontact2Info.contact_name;
          contact3_name = result.retrieveEcontact3Info.contact_name;
          contact1_phone = result.retrieveEcontact1Info.contact_phone;
          contact2_phone = result.retrieveEcontact2Info.contact_phone;
          contact3_phone = result.retrieveEcontact3Info.contact_phone;
          contact1_email = result.retrieveEcontact1Info.contact_email;
          contact2_email = result.retrieveEcontact2Info.contact_email;
          contact3_email = result.retrieveEcontact3Info.contact_email;

          winston.info('complete info sent -- customer ',customer_id);
          res.json({"name":customer_name,
                     "age":customer_age,
                     "gender":customer_age,
                     "address":customer_address,
                     "econtact1Name":contact1_name,
                     "econtact1Phone":contact1_phone,
                     "econtact1Email":contact1_email,
                     "econtact2Name":contact2_name,
                     "econtact2Phone":contact2_phone,
                     "econtact2Email":contact2_email,
                     "econtact3Name":contact3_name,
                     "econtact3Phone":contact3_phone,
                     "econtact3Email":contact3_email});
        });

        callback(null,"sent complete");
      }
    ]);
  });

  function checkAndUpdateEcontact(eName, ePhone, eEmail, callback){

    var query = "SELECT contacts_id FROM acs_contacts WHERE " +
                                                "contact_phone = ? ;";
    var inputs = [ePhone];
    var injectionQuery = mysql.format(query, inputs);
    winston.debug('inside checkAndUpdateEcontact function');
    winston.debug('query to retrieve econtact info ',injectionQuery);
    connection.query(injectionQuery, function resultSet(error, rows){

      if (error) {
        winston.info('Error in login module ', error);
        res.json({"message":"error in updating info"});
      }
      else {
        if (rows[0] === undefined){
          winston.debug('contact not present in db yet');
          var query1 = "INSERT INTO acs_contacts (contact_name, " +
                        "contact_phone, contact_email) VALUES (?,?,?);";
          var inputs1 = [eName, ePhone, eEmail];
          var injectionQuery1 = mysql.format(query1, inputs1);
          winston.debug('query to insert new contact ', injectionQuery1);
          connection.query(injectionQuery1, function resultSet1(err, rows){

             if(err){
               winston.info('error instering econtact details ',err);
               res.json({"message":"error in updating info"});
             }
             else{
               checkAndUpdateEcontact(eName, ePhone,eEmail, function (err,
                                                                      result) {
                 if (err) return callback(err);
                 callback(null, result);
               });
             }
          });
        }
        else{
          winston.debug('retrieved the econtact info ',rows[0].contacts_id);
          callback(null, rows[0].contacts_id);
        }
      }
    });
  }

  function getCustomerInfo(customer_id, callback){

    var query = "SELECT customer_name, " +
            "customer_phone, " +
            "customer_age, " +
            "customer_gender, " +
            "customer_address, " +
            "customer_econtact1, " +
            "customer_econtact2, " +
            "customer_econtact3 " +
            "FROM acs_cust WHERE customer_id = ? ;";

    var inputs = [customer_id];
    var injectionQuery = mysql.format(query, inputs);
    winston.debug('query to getCustomerInfo',injectionQuery);

    connection.query(injectionQuery, function resultSet(err, rows){

      if(err){
        winston.info('error in econtactid retrieval: ',err);
          res.json({"message":"could not retrieve customer info"});
      }
      else{
        callback(null,rows[0]);
      }
    });
  }


  function sendAlertToEcontacts(customer_name, customer_phone, latitude,
                                  longitude, econtacts_id, callback){

    var query = "SELECT contact_phone, contact_email FROM acs_contacts " +
            "WHERE contacts_id = ? ;";

    var inputs = [econtacts_id];
    var injectionQuery = mysql.format(query, inputs);
    winston.debug('query to retrieve contacts info ',injectionQuery);

    connection.query(injectionQuery, function resultSet(err, rows){

      if(err){
        winston.info('error in contact info retrieval: ',err);
      }
      else{

        //console.log(rows[0]);

        winston.info('strated to send alert');
        var mailOptions = {
          to: ""+rows[0].contact_email+","+
                 rows[0].contact_phone+"@tmomail.net,"+
                 rows[0].contact_phone+"@mms.att.net, "+
                 rows[0].contact_phone+"@vtext.com, "+
                 rows[0].contact_phone+"@vmobl.com, "+
                 rows[0].contact_phone+"@messaging.sprintpcs.com",
          subject : "Accident Alert",
          text : customer_name+" using phone number "+customer_phone+
                    " at https://maps.google.com/maps?q="+latitude+","+
          longitude+" has meet with an accident.. APRIL FOOL!!!"
                }
        winston.debug('this is mail options used ',mailOptions);
        smtpTransport.sendMail(mailOptions, function mailSent(err, result){

          if(err){
            winston.info(err);
            res.json({"message":"unable to send mails and emails to " +
            "emergency contacts"})
          }
          else{
            winston.info('message sent successfully to ',
                        rows[0].contact_email);
            callback(null,"confirmed!!");
            //console.log(result);
          }
        });


      }
    });
  }

  function getEcontactInfo(contact_id, callback){

    var query = "SELECT contact_name, " +
            "contact_phone, " +
            "contact_email " +
            "FROM acs_contacts WHERE contacts_id = ? ;";

    var inputs = [contact_id];
    var injectionQuery = mysql.format(query, inputs);
    winston.debug('query to request econtact info ',injectionQuery);

    connection.query(injectionQuery, function resultSet(err, rows){

      if(err){
        winston.info('error in econtacts retrieval: ',err);
        res.json({"message":"could not retrieve econtact info"});
      }
      else{
        callback(null,rows[0]);
      }
    });
  }
}
