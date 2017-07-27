'use strict';
const express = require('express');
const app = express();
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();
const tmdb = new (require('tmdbapi'))({
    apiv3: 'b8e5232ac7a2496540a6e80b935abdd3'
});
const actionsOnGoogle = require('actions-on-google').ApiAiApp;


const bodyParser = require('body-parser');
// Setting a map to find the correct attrs

// -------------------------------------------------------------------------------------------------------------------------------
const dataMapper = new Map();

dataMapper.set("director", "credits");
dataMapper.set("producer", "credits");
dataMapper.set("screenplay", "credits");
dataMapper.set("editor", "credits");
dataMapper.set("original music composer", "credits");
dataMapper.set("cast", "credits"); // get top 3 of cast . Get the name and character
dataMapper.set("crew", "credits"); // get director , producer and musician

// dataMapper.set("release_date","details");
// dataMapper.set("overview","details");
// dataMapper.set("genres","details");

// FOR SIMILAR movies use similar api

// -------------------------------------------------------------------------------------------------------------------------------

// for "some movies running right now" - use movie.rightnow - Get top 5

// -------------------------------------------------------------------------------------------------------------------------------

// Next make one for movie suggestion...a little complex, take year, and genre to start with.

// -------------------------------------------------------------------------------------------------------------------------------

const genres = new Map();

genres.set("action", 28)
genres.set("adventure", 12)
genres.set("animation", 16)
genres.set("comedy", 35)
genres.set("crime", 80)
genres.set("documentary", 99)
genres.set("drama", 18)
genres.set("family", 10751)
genres.set("fantasy", 14)
genres.set("history", 36)
genres.set("horror", 27)
genres.set("music", 10402)
genres.set("mystery", 9648)
genres.set("romance", 10749)
genres.set("science fiction", 878)
genres.set("tv movie", 10770)
genres.set("thriller", 53)
genres.set("war", 10752)
genres.set("western", 37)
// -------------------------------------------------------------------------------------------------------------------------------


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Test get request
app.get('/', (req, res) => {
  res.status(200).send('Its alive...');
});

app.post('/', (request, response) => {
  const api_app = new actionsOnGoogle({request, response});
  // console.log('Request headers: ' + JSON.stringify(request.headers));
  // console.log('Request body: ' + JSON.stringify(request.body));
  // Fulfill action business logic
  function responseHandler (api_app) {
    // Complete your fulfillment logic and send a response
    const inputAttr = api_app.getArgument("attributes");
    const movieName = api_app.getArgument("movie");
    // var inputAttr="director";
    // var movieName="iron man";
    var movieId = myCache.get(movieName);
    // var movieData = myCache.get("ASd");
    var movieData = myCache.get(movieId || "placeholder_ran");
    // var mData;
    const sendAppropriateResponse = function(data) {
      // WRITE CORE LOGIC HERE for getting that data
      // mData = data;
      var result = "";
      if(dataMapper.get(inputAttr) == "credits"){
        switch(inputAttr) {
          case "crew":
            var map = new Map();
            result = "The";
            data.credits.crew.filter( item => { return ["producer","director"].indexOf(item.job.toLowerCase()) != -1;}).forEach( obj => { map.set(obj.job, obj.name) });
            map.forEach( (value, key) => result += ` ${key} is ${value}` );
            break;
          case "cast":
            var cast = data.credits.cast;
            result = `${cast[0].name}, ${cast[1].name} and ${cast[2].name} are some of the cast members`;
            break;
          default:
            result = "The " + inputAttr + " of " + movieName + " is " +
              data.credits.crew.filter( item => { return item.job.toLowerCase() == inputAttr;})[0].name;
        }
      }else{
        if(inputAttr == "release_date"){
          var options = { year: 'numeric', month: 'long', day: 'numeric' };
          result = `It was released on ${(new Date(data[inputAttr])).toLocaleDateString("en-US",options)}`;
        }else if(inputAttr == "genres"){
          result = `${movieName} can be classified into ${data.genres.map( obj => obj.name ).join(",")}`;
        }else{
          result = data.overview;
        }
      }

      api_app.ask(result);

    }

    const getMovieDetails = function(id) {
      tmdb.movie.details({movie_id: id, append_to_response: "credits"})
      .then( data => {
        movieData = data;
        myCache.set( id, movieData, 120 );
        sendAppropriateResponse(movieData);
      }).catch( error => {
        console.log("ERROR getting movie details "+JSON.stringify(error));
        api_app.ask("Sorry, can you try again please ?");
      });
    }

    const getMovieId = function(name) {
      tmdb.search.movie({ query: name })
      .then( movies => {
        movieId = movies.results[0].id
        getMovieDetails(movieId);
      }).catch( error => {
        console.log("ERROR searching movie - "+JSON.stringify(error));
        api_app.ask("Oops, either the service is down or I just forgot the movie name. Can you start over with the movie ?");
      });
    }

    if(movieId == undefined) {
      // not in cache, make the request and cache it
      getMovieId(movieName)
    }else if(movieData == undefined) {
      getMovieDetails(movieId);
    }else{
      sendAppropriateResponse(movieData);
    }
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
