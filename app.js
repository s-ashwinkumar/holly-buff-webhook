'use strict';
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mdb = require('moviedb')('b8e5232ac7a2496540a6e80b935abdd3');
const actionsOnGoogle = require('actions-on-google').ApiAiApp;
// [START hello_world]
// Say hello!
app.get('/', (req, res) => {
  res.status(200).send('Its alive...');
});

app.post('/', (request, response) => {
  const api_app = new actionsOnGoogle({request, response});
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
        //get required data point (like director)
        var data_point = data.crew.filter(function(item){ return item.job.toLowerCase() == api_app.getArgument("attributes");})[0];
        api_app.ask(data_point.name);
      });
    });
  }

  const actionMap = new Map();
  actionMap.set('movie.details', responseHandler);
  api_app.handleRequest(actionMap);  
});

// [END hello_world]
if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}
module.exports = app;


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
