/* locale-specific code (differentiate from locale-specific data in /data/ */
if (typeof g_RoutingDirectionsBuilder == 'undefined') g_RoutingDirectionsBuilder = {};

g_RoutingDirectionsBuilder["en"] = {
  _stationPlural: function(count) {
    if (count % 10 == 1) return "station";   else return "stations";
  },
  build: function(directions, src, dest, srcIsStation, destIsStation) {
    var res = [], prevCost = 0;
    
    for (var i = 0; i < directions.length; ++i) {
      var entry = directions[i], relCost = (typeof entry.cost == 'undefined' ? prevCost : entry.cost - prevCost);
      switch (entry.type) {
        case 'prologue': {
          res.push(
            'From your starting point walk about <strong>' + entry.distance + '</strong> towards the <strong>' +
            directions[i + 1].title + '</strong> stop <span class="insignificant">(' + directions[i + 1].station +
            ')</span>. <div class="time">' + relCost + ' min</div>'
          );
        } break;
        
        case 'walk': {
          res.push(
            'Walk about <strong>' + entry.distance + '</strong> towards the <strong>' + entry.title + '</strong> stop ' +
            '<span class="insignificant">(' + entry.exitAt + ')</span>. <div class="time">' + relCost + ' min</div>'
          );
        } break;
        
        case 'travel': {
          var lines = "";
          if (entry.lines.length == 1)
            lines = '<strong>' + entry.lines[0] + '</strong>';
          else lines = '<strong>' + entry.lines.slice(0, -1).join('</strong>, <strong>') + '</strong> or <strong>' + entry.lines[entry.lines.length - 1] + '</strong>';
          
          var compose = 
            'Wait for a vehicle operating on line ' + lines + ' and exit at the <strong>' + entry.title + '</strong> ' +
            ' stop <span class="insignificant">(' + entry.exitAt + ')</span>. This stop is ';
          
          var counts_s;
          if (entry.lines.length == 1) {
              counts_s = '<strong>' + entry.stationCount[0] + ' </strong> ' + this._stationPlural(entry.stationCount[0]) + " away";
          } else {
            var counts = [];
            for (var j = 0; j < entry.lines.length; ++j)
              counts.push('<strong>' + entry.stationCount[j] + '</strong> ' +  this._stationPlural(entry.stationCount[j]) +  ' away via line <strong>' + entry.lines[j] + '</strong>');
            counts_s = counts.slice(0, -1).join(', ') + " and " + counts[counts.length - 1];
          }
          
          compose += counts_s + '. <div class="time">' + relCost + ' min</div>';
          
          res.push(compose);
        } break;
        
        case 'epilogue': {
          res.push(
            'Walk about <strong>' + entry.distance + '</strong> towards your destination. <div class="time">' + relCost + ' min</div>'
          );          
        } break;
      }
      
      if (typeof entry.cost != 'undefined')
        prevCost = entry.cost;
    }
    
    return res;
  }
};
