function TV(data) {
  "use strict";

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

  var table = document.getElementById("Table");
  var tbody = table.getElementsByTagName("tbody")[0];
  function ComputeTime(q) {
    var s = new Date(q.start);
    q.lbound = s.toISOString().slice(0, 16) + "Z";
    q.ubound = new Date(s.getTime() + q.minutes * 60000).toISOString().slice(0, 16) + "Z";
  }
  function ComputeTimes(p) {
    var map = {};
    for (var i = 0; i < p.length; ++i) {
      var q = p[i];
      ComputeTime(q);
      map[q.lbound] = true;
      map[q.ubound] = true;
    }
    var list = Object.keys(map);
    list.sort();
    return list;
  }
  function InsertItem(list, item) {
    var last = list[list.length - 1];
    if (item.ubound === last.ubound) {
      last.ubound = item.lbound;
      list.push(item);
    } else if (item.lbound === last.lbound) {
      last.lbound = item.ubound;
      list.splice(-1, 0, item);
    } else {
      var extra = {
        lbound: item.ubound,
        ubound: last.ubound
      };
      last.ubound = item.lbound;
      list.push(item, extra);
    }
  }
  function LocalTime(x) {
    var when = new Date(x);
    return when.toString().slice(0, 21);
  }
  function ComputeMatrix(p, t) {
    var i, item, matrix = [];
    for (i of Object.values(data.channels)) {
      while (matrix.length <= i.order + 1) {
        matrix.push([{ lbound: 0, ubound: t.length }]);
      }
    }
    var prev = null;
    var lbound = 0;
    for (var ubound = 0; ubound < t.length; ++ubound) {
      var next = LocalTime(t[ubound]).slice(0, 15);
      if (prev !== next) {
        if (lbound > 0) {
          item = {
            date: prev,
            lbound: lbound,
            ubound: ubound
          };
          InsertItem(matrix[0], item);
        }
        prev = next;
        lbound = ubound;
      }
    }
    for (i = 0; i < p.length; ++i) {
      item = {
        programme: p[i],
        lbound: t.indexOf(p[i].lbound),
        ubound: t.indexOf(p[i].ubound)
      };
      InsertItem(matrix[data.channels[p[i].channelid].order + 1], item);
    }
    return matrix;
  }
  function SetRowTime(tr, item) {
    var cell = tr.insertCell();
    cell.colSpan = item.ubound - item.lbound;
    if (item.date) {
      cell.innerHTML = "<div>" + item.date + "</div>";
      cell.className = "date";
    }
  }
  function SetColumnTime(item) {
    var cell = tbody.rows[item.lbound].insertCell();
    cell.rowSpan = item.ubound - item.lbound;
    if (item.date) {
      cell.innerHTML = "<div>" + item.date + "</div>";
      cell.className = "date";
    }
  }
  function GetExtra(p) {
    var extra = [];
    if (p.year) {
      extra.push(p.year);
    }
    if (p.rating) {
      extra.push(p.rating);
    }
    if (extra.length === 0) {
      extra.push(data.genres[p.genre || "0"].name);
    }
    return "<div class='extra'>(" + extra.join(", ") + ")</div>";
  }
  function GetWhen(p) {
    return LocalTime(p.lbound) + " to " + LocalTime(p.ubound).slice(-5) + ", " + p.minutes + "mins";
  }
  function SetCell(cell, item) {
    var genre;
    var p = item.programme;
    if (p) {
      genre = data.genres[p.genre];
      var tooltip = [p.name, p.description];
      if (genre) {
        var what = genre.name;
        if (p.rating) {
          what += " (Certificate " + p.rating + ")";
        }
        tooltip.push(what);
      }
      tooltip.push(data.channels[p.channelid].name + " (" + GetWhen(p) + ")");
      cell.innerText = p.name;
      cell.innerHTML += GetExtra(p);
      cell.title = tooltip.join("\n");
    }
    cell.className = genre && genre.id || "genre-missing";
  }
  function SetRowCell(row, item) {
    var cell = tbody.rows[row - 1].insertCell();
    cell.colSpan = item.ubound - item.lbound;
    SetCell(cell, item);
  }
  function SetColumnCell(item) {
    var cell = tbody.rows[item.lbound].insertCell();
    cell.rowSpan = item.ubound - item.lbound;
    SetCell(cell, item);
  }
  function CreateHeaderRow(tag) {
    var header = document.createElement(tag).insertRow();
    header.appendChild(document.createElement("th"));
    return header;
  }
  function AddChannelHeader(tr, channel) {
    var genre = data.genres[channel.epggenre || 0];
    var cell = tr.insertCell();
    cell.className = genre.id + " " + channel.id;
    cell.title = channel.name + "\n" + genre.name;
  }
  function AddIndexHeader(tr, index) {
    var c = {};
    for (var i in data.channels) {
      if (data.channels[i].order + 1 === index) {
        c = data.channels[i];
        break;
      }
    }
    AddChannelHeader(tr, c);
  }
  function AddRowHeader(row) {
    var tr = tbody.insertRow();
    AddIndexHeader(tr, row);
  }
  function AddColumnHeader(tr, col) {
    AddIndexHeader(tr, col);
  }
  function DisplayRows() {
    table.className = "by-rows";
    var thead = CreateHeaderRow("thead");
    table.insertBefore(thead.parentNode, tbody);
    var tfoot = CreateHeaderRow("tfoot");
    table.appendChild(tfoot.parentNode);
    var times = ComputeTimes(data.programmes);
    var matrix = ComputeMatrix(data.programmes, times);
    var i, j;
    for (j = 0; j < matrix[0].length; ++j) {
      SetRowTime(thead, matrix[0][j]);
      SetRowTime(tfoot, matrix[0][j]);
    }
    for (i = 1; i < matrix.length; ++i) {
      AddRowHeader(i);
      for (j = 0; j < matrix[i].length; ++j) {
        SetRowCell(i, matrix[i][j]);
      }
    }
  }
  function DisplayColumns() {
    table.className = "by-columns";
    var thead = CreateHeaderRow("thead");
    table.insertBefore(thead.parentNode, tbody);
    var tfoot = CreateHeaderRow("tfoot");
    table.appendChild(tfoot.parentNode);
    var times = ComputeTimes(data.programmes);
    var i, j;
    for (i = 0; i < times.length; ++i) {
      tbody.insertRow();
    }
    var matrix = ComputeMatrix(data.programmes, times);
    for (j = 0; j < matrix[0].length; ++j) {
      SetColumnTime(matrix[0][j]);
    }
    for (i = 1; i < matrix.length; ++i) {
      AddColumnHeader(thead, i);
      for (j = 0; j < matrix[i].length; ++j) {
        SetColumnCell(matrix[i][j]);
      }
      AddColumnHeader(tfoot, i);
    }
  }
  function DisplayMovies() {
    table.className = "by-movies";
    var movies = {};
    var i, m, p;
    for (i = 0; i < data.programmes.length; ++i) {
      p = data.programmes[i];
      var genre = data.genres[p.genre];
      if (genre && genre.id === "genre-movies") {
        ComputeTime(p);
        m = movies[p.name];
        if (!m) {
          m = movies[p.name] = [];
        }
        m.push(p);
      }
    }
    movies = Object.values(movies);
    movies.sort(function (a, b) { return a[0].start.localeCompare(b[0].start); });
    for (i = 0; i < movies.length; ++i) {
      m = movies[i];
      p = m[0];
      var tr = tbody.insertRow();
      AddChannelHeader(tr, data.channels[p.channelid]);
      var td = tr.insertCell();
      var url = "https://letterboxd.com/search/" + p.name.toLowerCase().replace(/[^a-z0-9]+/g, "+") + "/";
      if (p.rating) {
        td.className = "rating-" + p.rating.toLowerCase();
      }
      var html = "<a target='_blank' href='" + url + "'>" + p.name + "</a>" + GetExtra(p) + "<div class='description'>" + p.description + "</div>";
      for (var j = 0; j < m.length; ++j) {
        html += "<div class='when'>" + GetWhen(m[j]) + "</div>";
      }
      td.innerHTML += html;
    }
  }
  function DisplayNew() {
    table.className = "by-new";
    var programme = {};
    var i, m, p;
    for (i = 0; i < data.programmes.length; ++i) {
      p = data.programmes[i];
      if (p.name.toUpperCase().slice(0, 4) === "NEW:") {
        ComputeTime(p);
        m = programme[p.name];
        if (!m) {
          m = programme[p.name] = [];
        }
        m.push(p);
      }
    }
    programme = Object.values(programme);
    programme.sort(function (a, b) { return a[0].start.localeCompare(b[0].start); });
    for (i = 0; i < programme.length; ++i) {
      m = programme[i];
      p = m[0];
      var tr = tbody.insertRow();
      AddChannelHeader(tr, data.channels[p.channelid]);
      var td = tr.insertCell();
      var html = "<span>" + p.name + "</span>" + GetExtra(p) + "<div class='description'>" + p.description + "</div>";
      for (var j = 0; j < m.length; ++j) {
        html += "<div class='when'>" + GetWhen(m[j]) + "</div>";
      }
      td.innerHTML += html;
    }
  }
  switch (window.location.search.substring(1).toLowerCase()) {
    case "rows":
      DisplayRows();
      break;
    case "columns":
      DisplayColumns();
      break;
    case "movies":
      DisplayMovies();
      break;
    default:
      DisplayNew();
      break;
  }
}
