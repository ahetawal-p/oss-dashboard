/* Copyright (c) 2017, Salesforce.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

var express = require('express');
var app = express();
var fs = require('fs');
var pg = require('pg');
var Q = require('q');
var url = require('url');
var favicon = require('serve-favicon');
var path = require('path');

var databaseURL = process.env.DATABASE_URL || "postgres://localhost:5432/oss-dashboard";
console.log(databaseURL)
databaseURL = databaseURL + "?ssl=true"
console.log(databaseURL)

app.set('port', (process.env.PORT || 5000));

//app.use(favicon(path.join(__dirname, 'html', 'favicon.ico')));
app.use('/html',express.static(path.join(__dirname, 'html')));

app.get('/', function(request, response) {
	var endpoint = 'AllAccounts';
	dbCalls("select count(*) FROM result_store WHERE endpoint=($1)", [endpoint], true, true)
	.then(function(result){
		if(result && result.count == 0) {
				console.log("Serving first record");
				serveFirstRecord(response);
			} else {
				serveValidEndpointRecord(response, endpoint);
			}
	});
});


app.get('/ossdash/:type', function(request, response) {
	var endpoint = request.params.type;
 	serveValidEndpointRecord(response, endpoint)
});



// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(err);
  res.send({
        message: err.message,
         error: {}
    });
});


serveFirstRecord = function(response) {
	dbCalls("select html FROM result_store limit 1", [], true, true)
	.done(function(result){
		if(result){
			var htmlResult = result['html'];
			if(htmlResult){
				response.send(htmlResult);
			}
		} else {
			response.send("No content found");
		}
	},
    function(error){
    	console.log(error);
    	next(error);
	});
}


serveValidEndpointRecord = function(response, endpoint) {
	dbCalls("select html FROM result_store WHERE endpoint=($1)", [endpoint], true, true)
	.done(function(result){
		if(result){
			var htmlResult = result['html'];
			if(htmlResult){
				response.send(htmlResult);
			}
		} else {
			response.send("No content found");
		}
	},
    function(error){
    	console.log(error);
    	next(error);
	});


}



dbCalls = function (sql, values, singleItem, dontLog) {
	if (!dontLog) {
        typeof values !== 'undefined' ? console.log(sql, values) : console.log(sql);
    }
    var deferred = Q.defer();
    pg.connect(databaseURL, function (err, conn, done) {
        if (err) return deferred.reject(err);
        try {
            conn.query(sql, values, function (err, result) {
                done();
                if (err) {
                    deferred.reject(err);
                } else {
                    if(result.command == 'UPDATE' || result.command == 'INSERT'){
                        deferred.resolve(result.rowCount);
                    } else {
                        deferred.resolve(singleItem ? result.rows[0] : result.rows);
                    }
                }
            });
        }
        catch (e) {
            done();
            deferred.reject(e);
        }
    });
    return deferred.promise;
};

app.listen(app.get('port'), function() {
  console.log('oss-dashboard is running on port', app.get('port'));
});


