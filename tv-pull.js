function Pull(username, password, lineup) {
  "use strict";

  const HOSTNAME = "json.schedulesdirect.org";
  const API = "/20141201/";
  const CHANNELS = {
    1: "BBC1EAST/BBC One East",
    2: "BBC2/BBC Two",
    3: "ITV1ANG/ITV1 (Anglia)",
    4: "C4/Channel 4",
    5: "CH5/Channel 5",
    6: "ITV2/ITV2",
    7: "THACAUK/That's Cambridge TV",
    9: "BBC4/BBC Four",
    10: "ITVTHREE/ITV3",
    11: "SKYART1/Sky Arts",
    12: "QUEST/Quest",
    13: "E4/E4",
    14: "FILM4UK/Film4",
    16: "QVCUK/QVC (European)",
    17: "REALLY/Really UKTV",
    18: "MORE4/More 4",
    19: "DAVE/Dave",
    20: "DRAMAUK/Drama",
    21: "5USA/5USA",
    22: "IDLFV/Ideal World",
    23: "DAVEJV/Dave Ja Vu",
    25: "ITV4/ITV4",
    26: "YESTDAY/Yesterday",
    27: "ITVBE/ITV BE",
    30: "4MUSIC/4Music",
    31: "5ST/5 Star",
    32: "PARNSVM/Paramount Network",
    33: "GRETMOV/Great Movies",
    35: "PICKTV/Pick TV",
    36: "QVCBEAU/QVC Beauty",
    37: "QVCSTFV/QVC Style",
    38: "DMAXE/DMAX",
    39: "QREDUK/Quest Red",
    40: "CBSJUVM/CBS Justice",
    41: "GRTMACT/Great Movies Action",
    42: "FOODNET/Food Network",
    43: "HGTVUK/HGTV",
    44: "GEMTVFV/Gems TV",
    47: "CHALL/Challenge TV",
    48: "4SEVEN/4Seven",
    49: "GREATUK/Great TV",
    50: "JEWELCH/The Jewellery Channel",
    51: "GRTMCL/Great Movies Classic",
    55: "5SELECT/5SELECT",
    56: "SMTSNSD/Smithsonian Channel SD",
    63: "BLZEFV/Blaze",
    64: "FREESPO/Free Sports",
    65: "TBNUK/TBN UK",
    66: "CBSRELT/CBS Reality",
    67: "CBSDRFV/CBS Drama",
    68: "HORROR/Horror Channel",
    71: "JEWELMK/Jewellery Maker",
    72: "SHOPQUA/Shopping Quarter",
    76: "NOW80UK/Now 80s",
    77: "TCCUK/TCC",
    81: "TALKPIC/Talking Pictures TV",
    82: "TOGETUK/Together",
    84: "PBSUKVM/PBS",
    91: "THATGOLD/That's TV Gold",
    94: "IDEALEX/Ideal Extra",
    95: "CREATFV/Create and Craft",
    96: "BRITFRC/British Forces TV",
    101: "BBC1LDH/BBC One HD (London)",
    102: "BBC2HD/BBC Two HD",
    103: "ITV1HDS/ITV1 HD (Meridian, Anglia)",
    104: "C4HD/Channel 4 HD",
    105: "CH5HD/Channel 5 HD",
    106: "BBC4HD/BBC Four HD",
    107: "BBCNWHD/BBC News HD",
    111: "QVCUKHD/QVC HD",
    112: "QVCBHFV/QVC Beauty HD",
    113: "RTUKHD/RT HD",
    114: "QUESHDV/Quest HD",
  };

  const https = require("https");
  const crypto = require("crypto");

  function Hash() {
    var sha = crypto.createHash("sha1");
    sha.update(password);
    return sha.digest("hex");
  }

  function Print(label, json) {
    try {
      json = JSON.stringify(JSON.parse(json), null, 2);
    } catch (e) {}
    console.log(`${label}: ${json}`);
  }

  function Request(method, hostname, path, token, payload, callback) {
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
    var request = https.request(options, response => {
      var data = "";
      response.on("data", chunk => data += chunk);
      response.on("end", () => callback ? callback(data) : Print(`${method} ${path}`, data));
    });
    request.on("error", error => {
      console.error(`ERROR: ${method} ${path}: ${error}`);
    });
    if (payload) {
      request.write(payload);
    }
    request.end();
  }

  function Post(path, token, payload, callback) {
    Request("POST", HOSTNAME, API + path, token, payload, callback);
  }

  function Put(path, token, callback) {
    Request("PUT", HOSTNAME, API + path, token, null, callback);
  }

  function Get(path, token, callback) {
    Request("GET", HOSTNAME, API + path, token, null, callback);
  }

  function OnSchedules(stations, schedules, token) {
    process.stdout.write(JSON.stringify(schedules, null, 2));
  }

  function OnStations(date, stations, token) {
    //Print("STATIONS", JSON.stringify(Object.fromEntries(stations.map(x => [x.channel, `${x.callsign}/${x.name}`]))));
    var ids = stations.map(x => { return { stationID: x.id }; });
    Post("schedules", token, JSON.stringify(ids), json => OnSchedules(stations, JSON.parse(json), token));
  }

  function OnToken(date, token) {
    // Need to have the lineup registered: 'registerPut("lineups/GBR-1000073-DEFAULT", token);'
    Get(`lineups/${lineup}`, token, json => {
      var data = JSON.parse(json);
      var ids = Object.fromEntries(data.stations.map(x => [x.stationID, { name: x.name, callsign: x.callsign }]));
      var stations = data.map.map(x => Object.assign({ channel: +x.channel, id: x.stationID }, ids[x.stationID]));
      OnStations(date, stations, token);
    });
  }

  function OnTokenResponse(json) {
    // Example: {"code":0,"message":"OK","serverID":"20141201.web.1","datetime":"2021-08-23T15:01:11Z","token":"1b1ca42c5b1b9af8f4f6217ab186590c"}
    Print("TOKEN RESPONSE", json);
    var data = JSON.parse(json);
    OnToken(new Date(data.datetime), data.token);
  }

  //Post("token", null, JSON.stringify({ "username": username, "password": Hash(password) }), OnTokenResponse);
  OnToken(new Date(), "33b549b263a2cf1173df28ee1fa21e0c");
}

Pull(process.argv[2], process.argv[3], process.argv[4]);


// https://json.schedulesdirect.org/20141201/transmitters/GBR
// { ... "Sandy Heath":"GBR-1000073-DEFAULT" ... }

/*
C:\Project\tv>node tv-pull.js "chilliant" "zVeZG3dDGpm8sCX" "GBR-1000073-DEFAULT"
1,BBC1EAST,BBC One East
2,BBC2,BBC Two
3,ITV1ANG,ITV1 (Anglia)
4,C4,Channel 4
5,CH5,Channel 5
6,ITV2,ITV2
7,THACAUK,That's Cambridge TV
9,BBC4,BBC Four
10,ITVTHREE,ITV3
11,SKYART1,Sky Arts
12,QUEST,Quest
13,E4,E4
14,FILM4UK,Film4
15,C4P1,Channel 4 +1
16,QVCUK,QVC (European)
17,REALLY,Really UKTV
18,MORE4,More 4
19,DAVE,Dave
20,DRAMAUK,Drama
21,5USA,5USA
22,IDLFV,Ideal World (Freeview)
23,DAVEJV,Dave Ja Vu
25,ITV4,ITV4
26,YESTDAY,Yesterday
27,ITVBE,ITV BE
28,ITV2P1F,ITV2 +1 (Freeview)
29,E4P1,E4 +1
30,4MUSIC,4Music
31,5ST,5 Star
32,PARNSVM,Paramount Network
33,GRETMOV,Great Movies
34,ITVP1LN,ITV +1
35,PICKTV,Pick TV
36,QVCBEAU,QVC Beauty
37,QVCSTFV,QVC Style (Freeview)
38,DMAXE,DMAX
39,QREDUK,Quest Red
40,CBSJUVM,CBS Justice
41,GRTMACT,Great Movies Action
42,FOODNET,Food Network
43,HGTVUK,HGTV
44,GEMTVFV,Gems TV (Freeview)
45,CH5P1VM,Channel 5 +1
46,FILM41,Film4 +1
47,CHALL,Challenge TV
48,4SEVEN,4Seven
49,GREATUK,Great TV
50,JEWELCH,The Jewellery Channel
51,GRTMCL,Great Movies Classic
55,5SELECT,5SELECT
56,SMTSNSD,Smithsonian Channel SD
57,ITVBPFV,ITVBe +1 (Freeview)
58,ITV3P1F,ITV3 Freeview +1
59,ITV4PF,ITV4 +1 (Freeview)
60,GRTMOP1,Great Movies +1
61,GRETP1A,Great TV +1
62,GRTMCP1,Great Movies Classic +1
63,BLZEFV,Blaze (Freeview)
64,FREESPO,Free Sports
65,TBNUK,TBN UK
66,CBSRELT,CBS Reality
67,CBSDRFV,CBS Drama (Freeview)
68,HORROR,Horror Channel
69,QUESTP1,Quest +1
70,QREDUK1,Quest Red +1
71,JEWELMK,Jewellery Maker
72,SHOPQUA,Shopping Quarter
73,DRAVMP1,Drama +1
74,YESDYP1,Yesterday +1
76,NOW80UK,Now 80s
77,TCCUK,TCC
80,BLAZEP1,Blaze +1
81,TALKPIC,Talking Pictures TV
82,TOGETUK,Together
84,PBSUKVM,PBS
86,MORE4P1,More4 +1
87,PBSUKP1,PBS America +1
91,THATGOLD,That's TV Gold
94,IDEALEX,Ideal Extra
95,CREATFV,Create and Craft (Freeview)
96,BRITFRC,British Forces TV
100,FREEVIE,Freeview Information
101,BBC1LDH,BBC One HD (London)
102,BBC2HD,BBC Two HD
103,ITV1HDS,ITV1 HD (Meridian, Anglia)
104,C4HD,Channel 4 HD
105,CH5HD,Channel 5 HD
106,BBC4HD,BBC Four HD
107,BBCNWHD,BBC News HD
111,QVCUKHD,QVC HD
112,QVCBHFV,QVC Beauty HD (Freeview)
113,RTUKHD,RT HD
114,QUESHDV,Quest HD
201,CBBC,CBBC
202,CBEEB,CBeebies
203,CHITV,Children's ITV
204,CBBCHD,CBBC HD
205,CBEEBHD,CBeebies HD
206,POP,Pop
207,TINPFV,Tiny Pop (Freeview)
211,KETCHUP,Ketchup TV
231,BBCNEWS,BBC News
232,BBCPARL,BBC Parliament
233,SKYNEWS,Sky News
234,RUSTOD,RT
235,ALJAZEN,Al Jazeera English
236,GBNEWSD,GB News
250,BBCRDB1,BBC Red Button 1
252,KISSME,Kiss Me TV
253,PROUDDA,Proud Dating
263,SBND,SonLife Broadcasting Network
264,VISIOTV,Vision TV
265,PLANKNO,Planet Knowledge
269,ARISE,ARISE
601,BBCRDB1,BBC Red Button 1
670,ADULTUK,Adult Section
673,SMILET3,Smile TV3
674,BABESTV,Babestation
678,XXXPTV,xxXpanded TV
679,STU66TV,Studio 66 TV
680,XXXPTV2,xxXpanded TV 2
699,ADULTUK,Adult Section
700,BBCR1,BBC Radio 1
701,BBCR1X,BBC Radio 1 Xtra
702,BBCR2,BBC Radio 2
703,BBCR3,BBC Radio 3
704,BBCR4FM,BBC Radio 4 FM
705,BBCR5L,BBC Radio 5 Live
706,BBC5LX,BBC Radio 5 Live Sports Xtra
707,BBCR6M,BBC Radio 6 Music
708,BBCR4EX,BBC Radio 4 Extra
709,BBCASIA,BBC Asian Network
710,BBCWS,BBC World Service
711,HITSRAD,The Hits Radio
712,KISSRDO,Kiss Fresh
713,KISS,Kiss
714,KISSTOR,Kisstory
715,MAGICFM,Magic FM
716,HEATRAD,Heat Radio
717,KERRAD,Kerrang! Radio
718,SMTHFM,Smooth FM 102.2
723,TLKSPT,Talk Sport
724,CAPRAD,Capital London
725,PREMIER,Premier - PREMIER
726,BBCRSTK,BBC Radio Stoke
727,ABSOLRA,Absolute Radio
728,HEART,Heart FM
730,RNIBCO,RNIB Connect
731,CLASSFM,Classic FM
732,LBCLND,LBC
733,TWR,TWR
*/

/*
GET /20141201/lineups/GBR-1000073-DEFAULT: {
  "map": [
    {
      "stationID": "24321",
      "channel": "1"
    },
    {
      "stationID": "17154",
      "channel": "2"
    },
    //...
  ],
  "stations": [
    {
      "stationID": "24321",
      "name": "BBC One East",
      "callsign": "BBC1EAST",
      "affiliate": "BBC1",
      "broadcastLanguage": ["en-GB"],
      "descriptionLanguage": ["en-GB"],
      "stationLogo": [],
      "logo": {}
    },
    {
      "stationID": "17154",
      "name": "BBC Two",
      "callsign": "BBC2",
      "affiliate": "BBC2HD",
      "broadcastLanguage": ["en-GB"],
      "descriptionLanguage": ["en-GB"],
      "stationLogo": [],
      "logo": {}
    }
    //...
  ],
  "metadata": {
    "lineup": "GBR-1000073-DEFAULT",
    "modified": "2021-08-16T12:57:38Z",
    "transport": "DVB-T"
  }
}
*/