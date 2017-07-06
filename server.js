var express = require('express'),
    https = require('https'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    app = express(),
    mdb = require('moviedb')('b8e5232ac7a2496540a6e80b935abdd3');
const App = require('actions-on-google').ApiAiApp;

// var async = require(“async”);
//Allow all requests from all domains & localhost
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static('public'));
    app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.post('/', function(request, response) {
  const api_app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  // Fulfill action business logic
  function responseHandler (api_app) {
    // Complete your fulfillment logic and send a response
    console.log('ARGUMENTS CHECKING: '+api_app.getArgument("movie")+"------"+api_app.getArgument("attributes"));
    // api_app.ask('The answer is '+api_app.getArgument("movie")+"------"+api_app.getArgument("attributes"));

    var movieId;
    var data;
    mdb.searchMovie({ query: api_app.getArgument("movie") }, function(err,res){
      movieId = res.results[0].id;
      mdb.movieCredits({ id: movieId }, function(err,res){
        data = res;
        console.log("RESULT of credits--- "+JSON.stringify(res))
        //get director
        var director = data.crew.filter(function(item){ return item.job.toLowerCase() == api_app.getArgument("attributes");})[0];
        api_app.ask(director.name);
      });
    });

  }

  const actionMap = new Map();

  actionMap.set('movie.details', responseHandler);

  api_app.handleRequest(actionMap);
});

var options = {
    key  : fs.readFileSync('ssl/key.pem'),
    ca   : fs.readFileSync('ssl/csr.pem'),
    cert : fs.readFileSync('ssl/cert.pem')
}

https.createServer(options, app).listen(PORT, HOST, null, function() {
    console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env);
});




// Backup code
    // client.get("http://www.omdbapi.com/?t="+api_app.getArgument("movie").replace(" ","+")+"&apikey=c22bc403",
      //   function (data, response) {
      //     // parsed response body as js object
      //     console.log("DATA --- " + JSON.stringify(title));
      //     api_app.ask("TESTING THIS STUFF");
      //   }
      // ).on('error', function(err){
      //   console.log("something went wrong...", err);
      // });
