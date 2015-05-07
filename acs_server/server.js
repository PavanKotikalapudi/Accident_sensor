/**
 * Created by sunny on 3/24/15.
 */
var express = require('express');
var winston = require('winston');
var app = express();

winston.add(winston.transports.File, { filename: 'mylogfile.log',
  level: 'debug'});

require('./router/db_access')(app,winston);

//uncomment below line to see debug details of server
//winston.level = 'debug';
app.get('/',function Test(req, res){

  winston.info('in sample api');
  res.json("good work!!");
});
var server = app.listen(8181, function(){

  var host    =   server.address().address;
  var port    =   server.address().port;
  winston.info('Acs server using logger on http://'+host+':'+port);
});
