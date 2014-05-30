if (typeof g_Settings === 'undefined')
  g_Settings = {};
if (typeof g_Strings === 'undefined')
  g_Strings = {};
  
function eU8(str) {
  return unescape(encodeURIComponent(str));
}

function dU8(str) {
  return decodeURIComponent(escape(str));
}

util = {
  c: {
    llToGoogle: function(latlng) {
      return new google.maps.LatLng(latlng[0], latlng[1]);
    },
    llbToGoogle: function(latlngbounds) {
      return new google.maps.LatLngBounds(util.c.llToGoogle(latlngbounds[0]), util.c.llToGoogle(latlngbounds[1]));
    },
    containerPixelToLatLng: function(pix, map) {
      /* a slightly slow kludge. use with care. */

      var p = proj.fromContainerPixelToLatLng(pix);
      overlay.setMap(null);
      proj = overlay = null;
      return p;
    },
    time: function() {
      var t = Math.round((new Date()).getTime() / 1000);
      return ts;
    },
    elemHeight: function(el) {
      return Math.max( el.scrollHeight, el.offsetHeight );
    },
    showElem: function(el) {
      if (el)
      el.classList.remove('invisible');
    },
    hideElem: function(el) {if (el)
      el.classList.add('invisible');
    },
    buildPopupControls: function(ctls, context, clickHandler) {
      var html = '<div class="controls">';
      for (var ctl of ctls) {
        html += '<a href="#" data-context="' + context + '" data-command="';
        html += ctl["cmd"];
        html += '"';
        if (clickHandler != undefined)
          html += ' onclick="' + clickHandler + '"';
        html += '>';
        html += ctl["text"];
        html += '</a>';
      }
      html += '</div>';
      return html;
    },
    buildLabel: function(text, offset, spacing) {
      if (spacing == undefined) spacing = _$('lineTextSpacing');
      if (offset == undefined) offset = Math.round(spacing / 2);
      
      return Array(offset + 1).join(" ") + text + Array(spacing - offset + 1).join(" ");
    },
    formatDistance: function(distKm) {
      if (distKm < 0.5)
        return Math.round(distKm * 1000) + "m";
      else return distKm.toFixed(1) + "km";
    },
    unbindListeners: function(el) {
      var nel = el.cloneNode(true);
      el.parentNode.replaceChild(nel, el);      
    },
    reset: function() {
      history.go(0);
    },
    injectScript: function(url, callback) {
      var head = document.head;
      var script = document.createElement("script");

      script.setAttribute("src", url);
      script.setAttribute("type", "text/javascript");
      if (callback) script.addEventListener('load', callback);
      
      head.appendChild(script);     
    }
  },
  
  data: {
    Area: null,
    AreaIndex: null,
    load: function (filename, callback) {
      var head = document.head;
      var script = document.createElement("script");

      script.setAttribute("src", filename);
      script.setAttribute("type", "text/javascript");
      script.addEventListener('load', function() {
        var json = __g_FileContents;
        callback(json);
        head.removeChild(script);
      });
      
      head.appendChild(script);
    },
    nearestStations: function(loc, k, distLimit, noAnchor, giveAll) {
      if (typeof distLimit == 'undefined') distLimit = -1;
      if (typeof noAnchor == 'undefined') noAnchor = false;
     if (typeof giveAll == 'undefined') giveAll = false;
      
      var stations = util.data.Area["stations"], dists = [];
      for (var i = 0; i < stations.length; ++i) {
        var station = stations[i];
        if (!giveAll && station["displayName"] == undefined) continue;
        if (!noAnchor && typeof station["anchor"] == 'undefined') alert(station["id"]);
        
        var dist;
        if (!noAnchor)
          dist = util.math.geoDistance(station["anchor"], loc);
        else dist = util.math.geoDistance(station["location"], loc);
        
        if (distLimit == -1 || dist <= distLimit)
          dists.push({ idx: i, d: dist });
      }
      
      /* this is O(nlogn) average-case probably, depending on the
       * algorithm used by Gecko. I can afford that */
      dists.sort(function(a, b) {
        return a.d - b.d;
      });
      
      if (dists.length == 0)
        return util.data.nearestStations(loc, k, distLimit * _$('nearestStationsLimitIncreaseGranularity'));
      else return dists.slice(0, k);
    },
    getOperatingLines: function(stations) {
      /*var res = [];
      var ln = data["lines"];
      // O(MFG)
      // more precisely, O(LSM) worst case, L ~ 200, S ~ 10, M ~ 2
      for (var j = 0; j < ln.length; ++j) {
        var line = ln[j], lst = line["stations"], sts = data["stations"];
        var kbreak = false;
        for (var k = 0; (k < lst.length) && !kbreak; ++k) {
          var lbreak = false;
          for (var l = 0; (l < lst[k].length) && !lbreak; ++l) {
            for (var m = 0; m < stations.length; ++m) {
              if (lst[k][l] == sts[stations[m]]["id"]) {
                res = res.concat([ line["id"] ]);
                lbreak = kbreak = true;
                break;
              }
            }
          }
        }*/
        
      var res = [];
      for (var i = 0; i < stations.length; ++i)
        res = res.concat(util.data.AreaIndex["stationLines"][util.data.Area["stations"][stations[i]]["id"]]);
      res.sort(natcompare);
      
      var rres = [];
      for (var i = 0; i < res.length; ++i) {
        rres.push(res[i]);
        var j = i + 1;
        while (res[j] == res[i])
          ++j;
          
        i = j - 1;
      }
      
      return rres;
    },
    stationByID: function(ID) {
      return util.data.Area["stations"][util.data.AreaIndex["stations"][ID]];
    },
    representativeStationByID: function(ID) {
      var i = util.data.AreaIndex["stations"][ID];
      while (i >= 0 && typeof util.data.Area["stations"][i]["displayName"] == 'undefined')
        --i;
        
      return util.data.Area["stations"][i];
    },
    lineByID: function(ID) {
      return util.data.Area["lines"][util.data.AreaIndex["lines"][ID]];
    },
    lineTypeByName: function(name) {
      for (var j = 0; j < util.data.Area["lineTypes"].length; ++j)
        if (util.data.Area["lineTypes"][j]["name"] == name) {
          return  util.data.Area["lineTypes"][j];
          break;
        }
    },
    formatStations: function(stations) {
      var stationsToWrite = [stations[0], stations[stations.length - 1]];
  
      var stationString = "";
      for (var j = 0; j < stationsToWrite.length; ++j) {
        var stat = stationsToWrite[j];
        if (stat === "...")
          stationString += "... &ndash;" ;
        else {
          var sts = util.data.Area["stations"], st = {"displayName":'pojma nem'};
          var k = util.data.AreaIndex["stations"][stat], st;
        
          while (k >= 0 && typeof sts[k]["displayName"] == 'undefined')
            --k;
          st = sts[k];
          stationString += st["displayName"] + (j == stationsToWrite.length - 1 ? "" : " &ndash; ");
        }
      }
      
      return stationString;
    },
    getString: function (sName) {
      return g_Strings[sName];
    },
    getSetting: function (sName) {
      return g_Settings[sName];
    },
    
    normalize: {
      remove: [ " ", "\t", "\n" ],
      seek: ["š","č","ć","ž","а","б","в","г","д","е","ж","з","и","ј","к","л","м","н","о","п","р","с","т","ћ","у","ф","х","ц","ч","ш"],
      replace: "scczabvgdezzijklmnoprstcufhccs",
      digraphSeek: [ "đ", "љ", "њ", "ђ", "џ" ],
      digraphReplace: [ "dj", "lj", "nj", "dj", "dz" ]
    },
    replaceAll: function(str, search, replace) {
      return str.replace(new RegExp(search, 'g'), replace);
    },
    normalizeString: function(str) {
      var a = util.data.normalize.remove;
      str = str.toLowerCase();
      for (var i = 0; i < a.length; ++i)
        str = this.replaceAll(str, a[i], "");
      
      a = util.data.normalize.seek;
      var b = util.data.normalize.replace;
      for (var i = 0; i < a.length; ++i)
        str = this.replaceAll(str, a[i], b[i]);
        
      a = util.data.normalize.digraphSeek;
      b = util.data.normalize.digraphReplace;
      for (var i = 0; i < a.length; ++i)
        str = this.replaceAll(str, a[i], b[i]);
        
      return str;
    },
    enrichStations: function(stArr) {
      for (var i = 0; i < stArr.length; ++i)
        if (typeof stArr[i]["displayName"] != 'undefined')
          stArr[i]["displayNameNormalized"] = util.data.normalizeString(stArr[i]["displayName"]);
    }
  },

  math: {
    toRad: function(n) {
      return n * (Math.PI / 180.0);
    },
    geoDistance: function(pt1, pt2) {
      var m = util.math;
      
      var lat1 = pt1[0], lon1 = pt1[1];
      var lat2 = pt2[0], lon2 = pt2[1];
      
      var R = 6371.009;
      var dLat = m.toRad(lat2-lat1);
      var dLon = m.toRad(lon2-lon1);
      var lat1 = m.toRad(lat1);
      var lat2 = m.toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      
      return d;
    },
    naturalGeoDistance: function(pt1, pt2) {
      var vertex3 = [ pt1[0], pt2[1] ];
      return (util.math.geoDistance(pt1, pt2) + (util.math.geoDistance(pt1, vertex3) + util.math.geoDistance(pt2, vertex3))) / 2;
    }
    
    /*createMapLayer: function() {
      /* customizable: can use OSM-MapQuest-based TileLayers, Google or
       * CloudMade tiles. everything is allowed. *//* dead code
      return new L.Google('ROADMAP');
    }*/
  },
  localization: {
    localize: function(node) {
      function sTest(s) {
        if (typeof g_Strings[s] != 'undefined')
          return true;
        else return false; /* kekekekeke so sue me */
      }
      for (var i = 0; i < node.childNodes.length; ++i) {
        var newNode = node.childNodes[i];
        if (newNode.hasAttribute) {
          if(newNode.hasAttribute("data-l10n-string")) {
            var strn = newNode.getAttribute("data-l10n-string");
            if (sTest(strn)) {
              newNode.removeChild(newNode.firstChild);
              newNode.insertBefore(document.createTextNode(util.data.getString(strn)), newNode.firstChild);
            }
          }
          if (newNode.hasAttribute("data-l10n-placeholder-string")) {
            var strn = newNode.getAttribute("data-l10n-placeholder-string");
            if (sTest(strn)) newNode.setAttribute("placeholder", util.data.getString(strn));
          }
          if (newNode.hasAttribute("data-l10n-value-string")) {
            var strn = newNode.getAttribute("data-l10n-value-string");
            if (sTest(strn)) newNode.setAttribute("value", util.data.getString(strn));
          }
        }
        
        util.localization.localize(node.childNodes[i]);
      }
    }
  }
}
function $ (selector, el) {
     if (!el) {el = document;}
     return el.querySelector(selector);
}

function $$ (selector, el) {
     if (!el) {el = document;}
     return Array.prototype.slice.call(el.querySelectorAll(selector));
}

_$ = util.data.getSetting; /* shorthand setting acessor */
_$$ = util.data.getString; /* shorthand string accessor */
llg = util.c.llToGoogle;
llbg = util.c.llbToGoogle; /* these lines exist because of reasons */
