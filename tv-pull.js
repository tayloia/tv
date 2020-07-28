function Pull(ids) {
  "use strict";

  var http = require("http");

  var genres = {};
  var channels = {};
  var programmes = {};
  var outstanding;

  function Request(request, callback) {
    // See http://tv.sky.com/logo/1000/64/skychb5252.png
    var options = {
      host: "epgservices.sky.com",
      path: "/tvlistings-proxy/TVListingsProxy/" + request
    };
    http.get(options, function(res) {
      var json = "";
      res.on("data", function (chunk) { json += chunk; });
      res.on("end", function() {
        if (res.statusCode === 200) {
          callback(JSON.parse(json));
        } else {
          console.warning("Warning:", res.statusCode, "for", request);
          callback(null);
        }
      });
    }).on("error", function(err) {
      console.error("Error:", res.statusCode, "for", request);
      callback(null);
    });
  }

  function Pad(x, n) {
    return ("00000000" + x).slice(-n);
  }

  function ToID(x) {
    // Replace non-alphanumeric sequences with hyphens
    return x.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function Compare(a, b) {
    if (a < b) {
      return -1;
    }
    if (b < a) {
      return 1;
    }
    return 0;
  }

  function OnComplete() {
    var sorted = [];
    for (var programme in programmes) {
      sorted.push(programmes[programme]);
    }
    sorted.sort(function(a, b) {
      return Compare(a.start, b.start) || Compare(a.channelid, b.channelid);
    });
    var results = {
      genres: genres,
      channels: channels,
      programmes: sorted
    };
    console.log("TV(" + JSON.stringify(results, null, 2) + ");");
  }

  function OnPeriodProgramme(data) {
    var programme = {
      channelid: data.channelid,
      start: new Date(+data.start),
      minutes: data.dur / 60,
      name: data.title,
      description: data.shortDesc,
      genre: data.genre
    };
    if (data.parentalrating.v !== "--") {
      programme.rating = data.parentalrating.v.trim();
    }
    if (data.genre && data.shortDesc && genres[data.genre] && genres[data.genre].name === "Movies") {
      var match = /\((19\d\d|20\d\d)\)/.exec(data.shortDesc) || /\[(19\d\d|20\d\d)\]/.exec(data.shortDesc) || /, (19\d\d|20\d\d)\./.exec(data.shortDesc) || /^(19\d\d|20\d\d)\./.exec(data.shortDesc);
      if (match) {
        programme.year = +match[1];
      }
    }
    programmes[data.channelid + ":" + data.eventid] = programme;
  }

  function OnPeriodChannel(data) {
    for (var programme = 0; programme < data.program.length; ++programme) {
      OnPeriodProgramme(data.program[programme]);
    }
  }

  function OnPeriod(data) {
    if (data) {
      if (Array.isArray(data.channels)) {
        for (var channel = 0; channel < data.channels.length; ++channel) {
          OnPeriodChannel(data.channels[channel]);
        }
      } else if (data.channels) {
        OnPeriodChannel(data.channels);
      }
    }
    if (--outstanding === 0) {
      OnComplete();
    }
  }

  function RequestPeriod(when) {
    var time = Pad(when.getFullYear(), 4) +
               Pad(when.getMonth() + 1, 2) +
               Pad(when.getDate(), 2) +
               Pad(when.getHours(), 2) +
               Pad(when.getMinutes(), 2);
    var request = "tvlistings.json?channels=" + ids + "&dur=360&detail=2&time=" + time;
    Request(request, OnPeriod);
  }

  function RequestPeriods(now, periods) {
    // Each period is six hours
    outstanding = periods;
    for (var period = 0; period < periods; ++period) {
      var when = new Date(now.getTime() + period * 6 * 60 * 60 * 1000);
      RequestPeriod(when);
    }
  }

  function OnInitChannel(data) {
    var index = ids.indexOf(data.channelid);
    if (index >= 0) {
      channels[data.channelid] = {
        id: ToID("channel-" + data.title),
        name: data.title,
        epggenre: data.epggenre,
        genre: data.genre,
        order: index / 5
      };
    }
  }

  function OnInitGenre(prefix, data) {
    genres[data.genreid] = {
      id: ToID(prefix + data.name),
      name: data.name
    };
  }

  function OnInit(data) {
    if (data) {
      // Genres and epggenres never share ids, so store them in the same dictionary
      for (var genre = 0; genre < data.genre.length; ++genre) {
        OnInitGenre("genre-", data.genre[genre]);
      }
      for (var epggenre = 0; epggenre < data.epggenre.length; ++epggenre) {
        OnInitGenre("epggenre-", data.epggenre[epggenre]);
      }

      // Load channels
      for (var channel in data.channels) {
        OnInitChannel(data.channels[channel]);
      }

      // Fetch 8 days of EPG data starting at the previous midnight
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      RequestPeriods(now, 4 * 8); // 6-hour blocks for 8 days
    }
  }

  Request("init.json", OnInit);
}

if (process.argv.length > 2) {
  Pull(process.argv.slice(2).join(","));
} else {
  var channels = [
    2076, // BBC One HD
    2075, // BBC Two HD
    6504, // ITV HD
    4075, // Channel 4 HD
    4058, // Channel 5HD
    2086, // BBC Four HD
    1627, // Film4
    1628, // E4
    3340, // More4
    3150, // 4seven
    6240, // ITV2
    6260, // ITV3
    6272, // ITV4
    6508, // ITVBe
    3028, // 5SELECT (My5)
    3022, // 5 USA
    3023, // 5STAR
    2085, // BBC NEWS HD
    3605, // horror channel
    1065, // BLAZE
    3617, // CBS Drama
    4610, // CBS Justice (Action)
    3352, // CBS Reality
    2202, // Challenge
    2306, // Dave
    2612, // Drama
    3590, // Food Network
    5415, // Forces TV
    2301, // HGTV
    1036, // Paramount
    5500, // PBS America
    1832, // Pick
    6761, // QUEST
    2411, // Quest Red
    2325, // Really
    4266, // Sony Channel (True Ent)
    3708, // Sony Action (movies4men)
    3643, // Sony Classic (True Movies)
    3709, // Sony Movies
    5252, // TalkingPictures
    1872, // Together
    2305  // YESTERDAY
  ];
  Pull(channels.join(","));
}
