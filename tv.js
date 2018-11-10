function TV(data) {
  "use strict";
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
    var matrix = [];
    for (var i = Object.keys(data.channels).length; i >= 0; --i) {
      matrix.push([{ lbound: 0, ubound: t.length }]);
    }
    var prev = null;
    var lbound = 0;
    for (var ubound = 0; ubound < t.length; ++ubound) {
      var next = LocalTime(t[ubound]).slice(0, 15);
      if (prev !== next) {
        if (lbound > 0) {
          var item = {
            date: prev,
            lbound: lbound,
            ubound: ubound
          }
          InsertItem(matrix[0], item);
        }
        prev = next;
        lbound = ubound;
      }
    }
    for (var i = 0; i < p.length; ++i) {
      var item = {
        programme: p[i],
        lbound: t.indexOf(p[i].lbound),
        ubound: t.indexOf(p[i].ubound)
      }
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
    if (extra.length) {
      return "<div class='extra'>(" + extra.join(", ") + ")</div>";
    }
    return "";
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
    cell.className = (genre && genre.id) || "genre-missing";
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
    var genre = data.genres[channel.epggenre];
    var cell = tr.insertCell();
    cell.className = genre.id + " " + channel.id;
    var tooltip = [channel.name, ];
    cell.title = channel.name + "\n" + genre.name;
  }
  function AddIndexHeader(tr, index) {
    var c = {};
    for (var i in data.channels) {
      if ((data.channels[i].order + 1) === index) {
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
    for (var j = 0; j < matrix[0].length; ++j) {
      SetRowTime(thead, matrix[0][j]);
      SetRowTime(tfoot, matrix[0][j]);
    }
    for (var i = 1; i < matrix.length; ++i) {
      AddRowHeader(i);
      for (var j = 0; j < matrix[i].length; ++j) {
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
    for (var i = 0; i < times.length; ++i) {
      tbody.insertRow();
    }
    var matrix = ComputeMatrix(data.programmes, times);
    for (var j = 0; j < matrix[0].length; ++j) {
      SetColumnTime(matrix[0][j]);
    }
    for (var i = 1; i < matrix.length; ++i) {
      AddColumnHeader(thead, i);
      for (var j = 0; j < matrix[i].length; ++j) {
        SetColumnCell(matrix[i][j]);
      }
      AddColumnHeader(tfoot, i);
    }
  }
  function DisplayMovies() {
    table.className = "by-movies";
    var movies = {};
    for (var i = 0; i < data.programmes.length; ++i) {
      var p = data.programmes[i];
      var genre = data.genres[p.genre];
      if (genre && (genre.id === "genre-movies")) {
        ComputeTime(p);
        var m = movies[p.name];
        if (!m) {
          m = movies[p.name] = [];
        }
        m.push(p);
      }
    }
    movies = Object.values(movies);
    movies.sort(function (a, b) { return a[0].start.localeCompare(b[0].start); });
    for (var i = 0; i < movies.length; ++i) {
      var m = movies[i];
      var p = m[0];
      var tr = tbody.insertRow();
      AddChannelHeader(tr, data.channels[p.channelid]);
      var td = tr.insertCell();
      var url = "https://letterboxd.com/search/" + p.name.toLowerCase().replace(/[^a-z0-9]+/g, "+") + "/";
      var html = "<a target='_blank' href='" + url + "'>" + p.name + "</a>" + GetExtra(p) + "<div class='description'>" + p.description + "</div>";
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
    case "movies":
      DisplayMovies();
      break;
    default:
      DisplayColumns();
      break;
  }
}
