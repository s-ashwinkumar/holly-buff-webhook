// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
var Client = require('node-rest-client').Client;
var client = new Client();



// [START YourAction]
exports.yourAction = functions.https.onRequest((request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  // Fulfill action business logic
  function responseHandler (app) {
    // Complete your fulfillment logic and send a response
    console.log('ARGUMENTS CHECKING: '+app.getArgument("movie")+"------"+app.getArgument("attributes"));
    // app.ask('The answer is '+app.getArgument("movie")+"------"+app.getArgument("attributes"));

    // client.get("http://www.omdbapi.com/?t="+app.getArgument("movie").replace(" ","+")+"&apikey=c22bc403", 10.138.0.2
    client.get("http://10.138.0.2:8000/",
      function (data, response) {
        // parsed response body as js object 
        console.log("DATA --- " + data);
        // raw response 
        console.log("RESPONSE --- " + response);
        app.ask(response);
      }
    ).on('error', function(err){
      console.log("something went wrong...", err);
    });

  }

  const actionMap = new Map();
  actionMap.set('movie.details', responseHandler);

  app.handleRequest(actionMap);
});
// [END YourAction]
