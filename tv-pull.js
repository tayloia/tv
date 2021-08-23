function Pull(username, password, lineup) {
  "use strict";

  const https = require("https");
  const crypto = require("crypto");
  const zlib = require("zlib");

  const HOSTNAME = "json.schedulesdirect.org";
  const API = "/20141201/";

  function Hash() {
    var sha = crypto.createHash("sha1");
    sha.update(password);
    return sha.digest("hex");
  }

  function Request(method, hostname, path, token, payload, gzip, callback) {
    var options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: { "User-Agent": "chilliant" }
    };
    if (token) {
      options.headers.token = token
    }
    if (payload) {
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = payload.length;
    }
    if (gzip) {
      // See https://github.com/SchedulesDirect/JSON-Service/wiki/API-20141201#download-program-information
      options.headers["Accept-Encoding"] = "deflate,gzip";
    }
    var request = https.request(options, response => {
      var data = [];
      if (gzip) {
        var gunzip = zlib.createGunzip();
        gunzip.on("data", chunk => data.push(chunk.toString()));
        gunzip.on("end", () => callback(data.join("")));
        gunzip.on("error", error => console.error(`GZIP ERROR: ${method} ${path}: ${error}`));
        response.pipe(gunzip);
      } else {
        response.on("data", chunk => data.push(chunk));
        response.on("end", () => callback(data.join("")));
      }
    });
    request.on("error", error => console.error(`ERROR: ${method} ${path}: ${error}`));
    if (payload) {
      request.write(payload);
    }
    request.end();
  }

  function Post(path, token, payload, gzip, callback) {
    Request("POST", HOSTNAME, API + path, token, payload, gzip, callback);
  }

  function Put(path, token, callback) {
    Request("PUT", HOSTNAME, API + path, token, null, false, callback);
  }

  function Get(path, token, callback) {
    Request("GET", HOSTNAME, API + path, token, null, false, callback);
  }

  function OnPrograms(date, stations, movies, programs, token) {
    process.stdout.write("TV(");
    process.stdout.write(JSON.stringify({
      date: date,
      stations: stations,
      movies: movies,
      programs: programs,
      token: token
    }, null, 2));
    process.stdout.write(");");
  }

  function OnSchedules(date, stations, schedules, token) {
    var movies = {};
    for (var s of schedules) {
      for (var p of s.programs) {
        if (p.programID.slice(0, 2) === "MV") {
          // Example: '{ "programID": "MV037855620000", "airDateTime": "2021-09-09T21:00:00Z", "duration": 7200, "md5": "2zZfih7MwnoelMIJfQe5wQ" }'
          var movie = movies[p.programID];
          if (!movie) {
            movie = movies[p.programID] = [];
          }
          movie.push({ station: s.stationID, start: p.airDateTime, duration: p.duration });
        }
      }
    }
    Post("programs", token, JSON.stringify(Object.keys(movies)), true, json => OnPrograms(date, stations, movies, JSON.parse(json), token));
  }

  function OnStations(date, stations, token) {
    var ids = stations.map(x => { return { stationID: x.id }; });
    Post("schedules", token, JSON.stringify(ids), false, json => OnSchedules(date, stations, JSON.parse(json), token));
  }

  function OnToken(date, token) {
    // Need to have the lineup registered: 'Put("lineups/GBR-1000073-DEFAULT", token, console.log);'
    Get(`lineups/${lineup}`, token, json => {
      var data = JSON.parse(json);
      var ids = Object.fromEntries(data.stations.map(x => [x.stationID, { name: x.name, callsign: x.callsign }]));
      var stations = data.map.map(x => Object.assign({ channel: +x.channel, id: x.stationID }, ids[x.stationID]));
      OnStations(date, stations, token);
    });
  }

  function OnTokenResponse(json) {
    // Example: {"code":0,"message":"OK","serverID":"20141201.web.1","datetime":"2021-08-23T15:01:11Z","token":"1b1ca42c5b1b9af8f4f6217ab186590c"}
    var data = JSON.parse(json);
    OnToken(new Date(data.datetime), data.token);
  }

  Post("token", null, JSON.stringify({ "username": username, "password": Hash(password) }), false, OnTokenResponse);
  // OnToken(new Date(), "33b549b263a2cf1173df28ee1fa21e0c");
}

Pull(process.argv[2], process.argv[3], process.argv[4]);

// https://json.schedulesdirect.org/20141201/transmitters/GBR
// { ... "Sandy Heath":"GBR-1000073-DEFAULT" ... }
