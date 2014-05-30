if (typeof g_RoutingDirectionsBuilder == 'undefined') g_RoutingDirectionsBuilder = {};

g_RoutingDirectionsBuilder["sr"] = {
  _stationPlural: function(count) {
    if (count == 1) return "stanicu";
    if (count > 11 && count % 10 == 1) return "stanicu";
    if (count > 12 && count % 10 == 2) return "stanice";
    return "stanica";
  },
  build: function(directions, src, dest, srcIsStation, destIsStation) {
    var res = [], prevCost = 0;
    
    for (var i = 0; i < directions.length; ++i) {
      var entry = directions[i], relCost = (typeof entry.cost == 'undefined' ? prevCost : entry.cost - prevCost);
      switch (entry.type) {
        case 'prologue': {
          res.push(
            'Od početne tačke hodajte oko <strong>' + entry.distance + '</strong> do stanice <strong>' +
            directions[i + 1].title + '</strong> <span class="insignificant">(' + directions[i + 1].station +
            ')</span>. <div class="time">' + relCost + ' min</div>'
          );
        } break;
        
        case 'walk': {
          res.push(
            'Hodajte oko <strong>' + entry.distance + '</strong> do stanice <strong>' + entry.title + '</strong> ' +
            '<span class="insignificant">(' + entry.exitAt + ')</span>. <div class="time">' + relCost + ' min</div>'
          );
        } break;
        
        case 'travel': {
          var lines = "";
          if (entry.lines.length == 1)
            lines = '<strong>' + entry.lines[0] + '</strong>';
          else lines = '<strong>' + entry.lines.slice(0, -1).join('</strong>, <strong>') + '</strong> ili <strong>' + entry.lines[entry.lines.length - 1] + '</strong>';
          
          var compose = 
            'Sačekajte vozilo linije ' + lines + ' i vozite se do stajališta <strong>' + entry.title + '</strong> ' +
            '<span class="insignificant">(' + entry.exitAt + ')</span>. Ovo stajalište je udaljeno ';
          
          var counts_s;
          if (entry.lines.length == 1) {
              counts_s = '<strong>' + entry.stationCount[0] + ' </strong> ' + this._stationPlural(entry.stationCount[0]);
          } else {
            var counts = [];
            for (var j = 0; j < entry.lines.length; ++j)
              counts.push('<strong>' + entry.stationCount[j] + '</strong> ' +  this._stationPlural(entry.stationCount[j]) +  ' linijom <strong>' + entry.lines[j] + '</strong>');
            counts_s = counts.slice(0, -1).join(', ') + " i " + counts[counts.length - 1];
          }
          
          compose += counts_s + '. <div class="time">' + relCost + ' min</div>';
          
          res.push(compose);
        } break;
        
        case 'epilogue': {
          res.push(
            'Hodajte oko <strong>' + entry.distance + '</strong> do odredišta. <div class="time">' + relCost + ' min</div>'
          );          
        } break;
      }
      
      if (typeof entry.cost != 'undefined')
        prevCost = entry.cost;
    }
    
    return res;
  }
};
