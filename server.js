/**
 * Created by sunny on 3/24/15.
 */
var express = require('express');

var app = express();

require('./router/db_access')(app);


app.get('/',function Test(req, res){

    res.json("good work!!");
});
var server = app.listen(3000, function(){

    var host    =   server.address().address;
    var port    =   server.address().port;

    console.log('acs-server listening at http://%s:%s', host, port);
});