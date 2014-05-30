//FastClick.attach(document.body);
    
if (localStorage["l10n"] == undefined)
  localStorage["l10n"] = "sr";
  
util.data.load("data/strings-" + localStorage["l10n"] + ".json", function(sr_json) {
  
g_Strings = sr_json;
util.localization.localize(document.documentElement);

/* 44,80989 : 20,464557 */
 
util.data.load("data/settings.json", function(st_json) {  
g_Settings = st_json;

g_Screens = [];
g_ScreenIndex = {};

function removeStrayClassNames(el) {
  var names = ['anim-rightToCurrent', 'anim-currentToRight', 'anim-currentToLeft', 'anim-leftToCurrent', 'engaged'];
  for (var i = 0; i < names.length; ++i) {
    el.classList.remove(names[i]);
    el.classList.remove(names[i] + "-now");
  }
}

window._mapLoadGlobalTimeout = null;
window["_mapLoadCallback"] = function() {
  util.c.injectScript(_$('googleMapLabelURL'), function() {
    clearTimeout(window._mapLoadGlobalTimeout);
    $('#bigbutton-map').classList.remove('disabled');
    $$('#bigbutton-map h2 progress').forEach(function(e) {
      e.classList.add('ghostly');
    });
  });
}

function navigateTo(newScreen, noAnim, immAnim) {
  if (typeof noAnim == 'undefined')
    noAnim = false;
  if (typeof immAnim == 'undefined')
    immAnim = false;
    
  for (var i = 0; i < g_Screens.length; ++i) {
    if (g_Screens[i].name == newScreen.name) {
      g_Screens.splice(i, 1);
      break;
      /*for (var j = i + 1; j < g_Screens.length - 1; ++j) {
        var scr = g_Screens[j];
        removeStrayClassNames($('#' + scr.name));
        if (scr.onNavigateAway)
          scr.onNavigateAway();
      }
      
      var last = g_ScreenIndex[g_Screens[g_Screens.length - 1].name];
      while (g_Screens.length - 1 != i)
        g_Screens.pop();
      g_Screens.push(last);
      return navigateBack();*/
    }
  }
  
  var cScreen = (g_Screens.length > 0 ? $('#' + g_Screens[g_Screens.length - 1].name) : null);
  var nScreen = $('#' + newScreen.name);
  
  if (cScreen) removeStrayClassNames(cScreen);
  removeStrayClassNames(nScreen);
  
  console.log("navigating to " + newScreen.name);
  
  if (!noAnim && cScreen)cScreen.classList.add('anim-currentToLeft');
  if (!noAnim) nScreen.classList.add('anim-rightToCurrent');
  
  if (immAnim) {
    if (cScreen) cScreen.classList.add('anim-currentToLeft-now');
    nScreen.classList.add('anim-rightToCurrent-now');
    
  }
  
  if (cScreen) cScreen.classList.add('engaged');
  if (nScreen) nScreen.classList.add('engaged');
  
  localStorage["currentScreen"] = newScreen.name;
  
  if (cScreen && cScreen.onNavigateAway)
    newScreen.onNavigateAway();
  g_Screens.push(newScreen);
  if (newScreen.onNavigateTo)
    newScreen.onNavigateTo();
}

function navigateBack() {
  var cScreen = $('#' + g_Screens[g_Screens.length - 1].name);
  var nScreen = $('#' + g_Screens[g_Screens.length - 2].name);
  
  removeStrayClassNames(cScreen);
  removeStrayClassNames(nScreen);
  
  cScreen.classList.add('anim-currentToRight');
  nScreen.classList.add('anim-leftToCurrent');
  
  if (cScreen) cScreen.classList.add('engaged');
  if (nScreen) nScreen.classList.add('engaged');
  
  if (g_Screens[g_Screens.length - 1].onNavigateAway)
    g_Screens[g_Screens.length - 1].onNavigateAway();
  
  g_Screens.pop();
  var sc = g_Screens[g_Screens.length - 1];
  localStorage["currentScreen"] = sc.name;
  console.log("navigating to " + sc.name);
  
  if (sc.onNavigateTo)
    sc.onNavigateTo();
  
}

g_Area = null;

g_RoutingSelections = {
  pointA: {
    type: "not-selected"
  },
  pointB: {
    type: "not-selected"
  },
  
  setA: function(newA, calledByMap) {
    var g = g_RoutingSelections;
    
    g_RoutingSelections.pointA = newA;
    
    if (typeof calledByMap == 'undefined') calledByMap = false;
    if (newA.type == "station" && g.pointB.type == "station" && newA.id == g.pointB.id)
      g.setB({ type: "not-selected" });
    
    if (newA.type == "station" && !calledByMap) {
      g_MapScreen.doAction('setAsSource', [ "station", newA.id ]);
    } else if (newA.type == "not-selected" && !calledByMap) {
      g_MapScreen.doAction('removeAnchor', [ "nigga", "A" ]);
      $$('.routing-pointA:not(.inactive), .routing-pointB:not(.inactive').forEach(function(e) {
        e.classList.add('inactive');
      });
    }
    
    
    g_RoutingSelections._doRoute();
  },
  setB: function(newB, calledByMap) {
    var g = g_RoutingSelections;
    
    g_RoutingSelections.pointB = newB;
    
    if (typeof calledByMap == 'undefined') calledByMap = false;
    if (newB.type == "station" && g.pointA.type == "station" && newB.id == g.pointA.id)
      g.setA({ type: "not-selected" });
    
    if (newB.type == "station" && !calledByMap) {
      g_MapScreen.doAction('setAsDestination', [ "station", newB.id ]);
    } else if (newB.type == "not-selected" && !calledByMap) {
      g_MapScreen.doAction('removeAnchor', [ "nigga", "B" ]);
      $$('.routing-pointA:not(.inactive), .routing-pointB:not(.inactive').forEach(function(e) {
        e.classList.add('inactive');
      });
    }
    
    g_RoutingSelections._doRoute();
  },
  _doRoute: function() {
    var g = g_RoutingSelections;
    if (g.pointA.type != "not-selected" && g.pointB.type != "not-selected") {
      var l1, l2, srcs, dests;
      if (g.pointA.type == "station")
        l1 = g_Area["stations"][g.pointA.id]["location"];
      else l1 = g.pointA.location;
      if (g.pointB.type == "station")
        l2 = g_Area["stations"][g.pointB.id]["location"];
      else l2 = g.pointB.location;
      
      var d = util.math.geoDistance(l1, l2);
      if (g.pointA.type == "station")
        srcs = [ g_Area["stations"][g.pointA.id]["id"] ];
      else srcs = g_Routing.sourcePlaceToStations(l1, d);
      
      if (g.pointB.type == "station")
        dests = [ g_Area["stations"][g.pointB.id]["id"] ];
      else dests = g_Routing.destinationPlaceToStations(l2, d);
      
      g_Routing.route(srcs, dests);
    }
  }
};

g_Routing = {
  _w: null,
  routingInProgress: false,
  init: function() {
    g_Routing._w = new Worker("js/route-worker.js");
    g_Routing._w.onmessage = function(oe) {
      var d = oe.data;
      if (d.type == "routingComplete") {
        $('#directions-calculating-wrapper').classList.add('ghostly');
        $('#directions-finished-wrapper').classList.remove('ghostly');
        
        $('#bigbutton-directions').classList.remove('disabled');
        
        g_Routing.routingInProgress = false;
        g_Routing._handleRoutingComplete(d.results);
        g_Routing._w.postMessage({ type: "deinit" });
      }
    };
    /*miroslav.init();*/
  },
  recall: function() {
    
  },
  destroy: function() {
    g_Routing._w = null;
    /*miroslav.destroy();*/
  },
  sourcePlaceToStations: function(loc, d) {
    var bias = 0;
    if (typeof d != "undefined") bias = d * _$('distLimitSrcBias');
    var sts = util.data.nearestStations(loc, _$('nearestStationsSrc'), _$('distLimitSrc'), true);
    for (var i = 0; i < sts.length; ++i)
      sts[i] = g_Area["stations"][sts[i].idx]["id"];
      
    return sts;
  },
  destinationPlaceToStations: function(loc, d) {
    var bias = 0;
    if (typeof d != "undefined") bias = d * _$('distLimitDestBias');
    var sts = util.data.nearestStations(loc, _$('nearestStationsDest'), _$('distLimitDest'), true);
    for (var i = 0; i < sts.length; ++i)
      sts[i] = g_Area["stations"][sts[i].idx]["id"];
      
    return sts;
  },
  route: function(sources, destinations) {
    if (g_Routing.routingInProgress)
      return;
      
    $('#directions-calculating-wrapper').classList.remove('ghostly');
    $('#directions-finished-wrapper').classList.add('ghostly');
    $('#directions-popup').classList.add('visible');
    
    g_Routing._w.postMessage({ type: "route", sources: sources, dests: destinations });
    g_Routing.routingInProgress = true;
  },
  _pathLength: function(path, pA, pB) {
    /*var cost = 0;
    for (var i = 0; i < path.length; ++i) {
      var elem = path[i];
      if (elem.type == "travel") {
        if (elem.stationCount.length == 0)
          return +Infinity;
        var maxC = Math.max.apply(null, elem.stationCount);
        cost += _$('travelCostPerVehicle') + maxC * _$('travelCostPerStation');}
      else if (elem.type == 'walk')
        cost += elem.distance * _$('walkCost');
    }*/
    var cost = path[path.length - 1].cost,
        start = path[0].station,
        end = path[path.length - 1].exitAt;
        
    if (typeof pA != "undefined")
      cost += 60.0 * (util.math.naturalGeoDistance(g_Area["stations"][g_AreaIndex["stations"][start]]["location"], pA) / _$('walkKmh'));
    if (typeof pB != "undefined")
      cost += 60.0 * (util.math.naturalGeoDistance(g_Area["stations"][g_AreaIndex["stations"][end]]["location"], pB) / _$('walkKmh'));
        
    return cost;
  },
  _optimalPaths: function(paths, pA, pB) {
    paths.sort(function(a,b) {
      return g_Routing._pathLength(a, pA, pB) - g_Routing._pathLength(b, pA, pB);
    })
    
    var stringified = [];
    for (var i = 0; i < paths.length; ++i)
      stringified[i] = JSON.stringify(paths[i]);
      
    var rres = [];
    for (var i = 0; i < paths.length; ++i) {
      rres.push(paths[i]);
      var j = i + 1;
      while (stringified[j] == stringified[i])
        ++j;
        
      i = j - 1;
    }
    
    return rres.slice(0, _$('routeVariantCount'));
  },
  _handleRoutingComplete: function(paths) {
    var g = g_RoutingSelections;
    
    var rpaths = [], l = 0;
    for (var i = 0; i < paths.length; ++i) {
      var x = paths[i];
      for (var j = 0; j < x.length; ++j)
        rpaths[l++] = miroslav.unveilPath(x[j]);
    }
    
    var pA, pB;
    if (g.pointA.type == "place")
      pA = g.pointB.location;
    if (g.pointB.type == "place")
      pB = g.pointB.location;
        
    var optimum = g_Routing._optimalPaths(rpaths, pA, pB);
    g_DirectionsScreen.present(optimum, g_RoutingSelections.pointA, g_RoutingSelections.pointB);
  }
};

g_MapScreen = {
  name: "map-screen", 
  loaded: false,
  timeoutHandle: null,
  mapSearchSuggestions: $('#map-search-suggestions'),
  mapSearchField: $('#map-search-text'),
  searchResultMarker: null,
  searchResultPaths: null,
  mapLabels: [],
  pickedSearchResult: null,
  stopIcon: {
        iconUrl: _$('stopMarkerUrl'),
        iconRetinaUrl: _$('stopMarkerRetinaUrl'),
  },
  stopIconAlt: {
        iconUrl: _$('stopMarkerAltUrl'),
        iconRetinaUrl: _$('stopMarkerAltRetinaUrl'),
  },
  geolocationIcon: {
        iconUrl: _$('geolocationMarkerUrl'),
        iconRetinaUrl: _$('geolocationMarkerRetinaUrl'),
    },
  pointAIcon: {
      iconUrl: _$('pointAMarkerUrl'),
      iconRetinaUrl: _$('pointAMarkerRetinaUrl'),
      shadowUrl: _$('pointShadowUrl'),
      iconSize: _$('pointMarkerSize'),
      shadowSize: _$('pointShadowSize'),
      iconAnchor: _$('pointMarkerAnchor'),
      shadowAnchor: _$('pointShadowAnchor'),
      popupAnchor: _$('pointPopupAnchor')
    },
  pointBIcon: {
      iconUrl: _$('pointBMarkerUrl'),
      iconRetinaUrl: _$('pointBMarkerRetinaUrl'),
      shadowUrl: _$('pointShadowUrl'),
      iconSize: _$('pointMarkerSize'),
      shadowSize: _$('pointShadowSize'),
      iconAnchor: _$('pointIconAnchor'),
      shadowAnchor: _$('pointShadowAnchor'),
      popupAnchor: _$('pointPopupAnchor')
    },
  pointA: null,
  pointB: null,
  pointAContext: null,
  pointBContext: null,
  geolocationMarker: null,
  waitingCallback: false,
  searchIntervalContext: null,
  activePopup: null,
  autocompleter: null,
  places: null,
  fail: null,
  dummyOverlay: null,
  containerProjection: null,
  adhocPopup: false,
  lastSearch: "",
  onInit: function() {
    var g = g_MapScreen;
    
    if (!g.loaded && !g.fail) {
      if (typeof google == 'undefined' || typeof google.maps == 'undefined' || typeof google.maps.places == 'undefined') {
        $('#map-disabled-overlay').classList.remove('ghostly');
        g.fail = true;
        
        $("#map-search-reset").addEventListener('click', function() {
          g.mapSearchField.value = "";
          util.c.hideElem(g.mapSearchSuggestions);
        });
        
        $('#map-fail-back').addEventListener('click', function() {
          navigateBack();
        });
        
        $('#map-fail-retry').addEventListener('click', function() {
          util.c.reset();
        });
        return;
      }
      
      g._initMap();
      var overlay = new google.maps.OverlayView();
      
      var proj = null;
      overlay.draw = function() { if (!g.containerProjection) g.containerProjection = this.getProjection(); };
      overlay.onAdd = function() {};
      overlay.onRemove = function() {};

      overlay.setMap(g.map);
      g.dummyOverlay = overlay;
      
      Hammer($('#main-map-area'), {
        drag: false, release: false, swipe: false, tap: false, doubletap: false, touch: false, transform: false
      }).on('hold', function(ev) {
        var left = this.offsetLeft, top = this.offsetTop;
        var latlng = g.containerProjection.fromContainerPixelToLatLng(new google.maps.Point(ev.gesture.center.pageX - left, ev.gesture.center.pageY - top));
        
        var infowindow = new google.maps.InfoWindow({
          content: '<div class="popup">' + util.c.buildPopupControls(_$('placePopupControls'),
            "adhoc," + latlng.lat() + "," + latlng.lng(), "g_MapScreen._processPopupCommand(this)") + '</div>',
          position: latlng,
          disableAutoPan: true
        }); 
        if (g.activePopup) {
          g.activePopup.close();
          g.activePopup = null;
        }
        infowindow.open(g.map);
        g.activePopup = infowindow;
        g.adhocPopup = true;
      });
      
      google.maps.event.addListener(g.map, 'click', function() {
        if (g.activePopup && !g.adhocPopup) {
          g.activePopup.close()
          g.activePopup = null;
        }
      });
      g.loaded = true;
      g.fail = false;
      g.autocompleter = new google.maps.places.AutocompleteService();
      
      if (!navigator.geolocation) {
        var geohud = $('#geolocation-hud');
        geohud.parentNode.removeChild(geohud);
      } else {
        $('#geolocation-hud').addEventListener('click', function(el) {
          g._geolocate(this);
        });
      }
            
      $('#remove-markers-hud').addEventListener('click', function() {
        g._destroyMarkers();
      });
      g.mapSearchField.addEventListener('blur', function() {
        util.c.hideElem(g.mapSearchSuggestions);
        util.c.showElem($('.map-hud-icons'));
        clearInterval(g.searchIntervalContext);
      });

      $('#menu-hud').addEventListener('click', function() {
        navigateBack();
      });
      g.mapSearchField.addEventListener('focus', function() {
        if (g.mapSearchField.value.length > 0 && $$('#map-search-suggestions ul li').length > 0)
          util.c.showElem(g.mapSearchSuggestions);
        util.c.hideElem($('.map-hud-icons'));
        g.searchIntervalContext = setInterval(function() {
          if (g.lastSearch != g.mapSearchField.value) {
            g._effectSearchSuggestions();
            g.lastSearch = g.mapSearchField.value;
          }
        }, _$('searchWatcherInterval'));
      }); 
           
      google.maps.event.addListener(g.map, "rightclick", function(evt) {
          /*TODO:adhoc*//*L.popup().setLatLng(evt.latlng).setContent(util.c.buildPopupControls(_$('placePopupControls'),
            "adhoc," + evt.latlng.lat + "," + evt.latlng.lng, "g_MapScreen._processPopupCommand(this)")).openOn(g.map);*/
           // alert('not implemented');
      });
      
      window.addEventListener("resize", function() {
        g_MapScreen.mapSearchSuggestions.style.maxHeight = util.c.elemHeight(document.body) - util.c.elemHeight($("#map-searchbox")) + 2 + 'px';
      }, false);

      g.mapSearchField.addEventListener('keypress', g._effectSearchSuggestions);
      g.places = new google.maps.places.PlacesService(g.map);
    }
  },
  delegate: function() {
    window._mapLoadGlobalTimeout = setTimeout(function() {
      $('#bigbutton-map').classList.remove('disabled');
      $$('#bigbutton-map h2 progress').forEach(function(e) {
        e.classList.add('ghostly');
      });
    }, _$('mapLoadTimeout') * 1000);
    
    util.c.injectScript(_$('googleMapsURL') + "_mapLoadCallback&" + Math.random().toString().replace('0.', ''));
  },
  onDestroy: function() {
    var g = g_MapScreen;
    if (!g.loaded || g.fail) return;
    
    
    $('#map-screen').removeChild($('#main-map-area'));
    var aBraveNewWorld = document.createElement('div');
    aBraveNewWorld.id = 'main-map-area';
    $('#map-screen').appendChild(aBraveNewWorld);
    util.c.unbindListeners($('#map-screen'));
    
    g.loaded = false;
    clearInterval(g.searchIntervalContext);
  },
  onNavigateTo: function() {
    var g = g_MapScreen;
    
    localStorage["currentScreen"] = g_MainMenuScreen.name;
    if (!g.loaded && !g.fail) {
      g.onInit(); 
      google.maps.event.trigger(g.map, "resize");
    }
  },
  onNavigateAway: function() {
    
  },
  _effectSearchSuggestions: function() {
    var g = g_MapScreen;
    if (g.timeoutHandle == null && !g.waitingCallback) {
      g.timeoutHandle = setTimeout(function() {
        g.timeoutHandle = null;        
        g.mapSearchSuggestions.scrollTop = 0;
        
        var val = g.mapSearchField.value;
        var html = '';
        var tsr = g._getTransportSearchResults(val);
        for (var i = 0; i < tsr.length; ++i) {
          var r = tsr[i];
          switch(r.type) {
            case "line": {
              var obj = g_Area["lines"][r.idx], type = obj["type"];
              
              var lineType = util.data.lineTypeByName(type);
              /*for (var j = 0; j < g_Area["lineTypes"].length; ++j)
                if (g_Area["lineTypes"][j]["name"] == type) {
                  lineType = g_Area["lineTypes"][j];
                  break;
                }
               */ 
              html += '<li onclick="g_MapScreen._chooseSearchResult(this)" data-type="transport-search" data-raw="line,' + r.idx + '">';
              html += '<img class="results-icon" src="icons/line-types/' + obj["type"] + _$('searchResLineTypeSuffix') + '" />';
              html += '<div class="title"><strong>' + obj["id"] + '</strong> <span class="insignificant rightfloat">' + lineType["lineName"] + '</span></div>';
              
              var stationString = util.data.formatStations(obj["stations"][0]);
              html += '<div class="subtitle">' + stationString + '</div>';
              html += '</li>';
            } break;
            case "station": {
              var sts = g_Area["stations"], obj = sts[r.idx];
                
              var members = [ r.idx ];
              var j = r.idx + 1;
              while (j < sts.length && sts[j]["displayName"] == undefined)
                members.push(j++);
                
              var nmbstr = obj["id"];
              for (var j = 1; j < members.length; ++j)
                nmbstr += ', ' + sts[members[j]]["id"];
                
              html += '<li onclick="g_MapScreen._chooseSearchResult(this)" data-type="transport-search" data-raw="station,' + r.idx + '">';
              html += '<img class="results-icon" src="' + _$('stopIconUrl') + '" />';
              html += '<div class="title"><strong>' + obj["displayName"] + '</strong> (' + nmbstr + ')<span class="insignificant rightfloat">stajalište</span></div>';
              
              var operatingLinesStr = util.data.getOperatingLines(members).join(', ');
              html += '<div class="subtitle">' + operatingLinesStr + '</div></li>';
            } break;
            default: break;
          }
        }
        $('#map-search-suggestions #transport-suggestions').innerHTML = html;
        
        if (val.length == 0) {
          util.c.hideElem(g.mapSearchSuggestions);
          return;
        }
        
        if (g.mapSearchField.value.length == 0) {
          util.c.hideElem(g.mapSearchSuggestions);
          return;
        }
        
        if (html == '' && $$('#map-search-suggestions ul li').length == 0)
          util.c.hideElem(g.mapSearchSuggestions);
        else 
          util.c.showElem(g.mapSearchSuggestions);
          
        var ne = g_Area["approximateRect"]["northEast"], sw = g_Area["approximateRect"]["southWest"];
        
        g.autocompleter.getQueryPredictions({
            input: val,
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(sw[0], sw[1]),
              new google.maps.LatLng(ne[0], ne[1])
            ),
            componentRestrictions: {
              country: g_Area["country"]
            }
          },
          function(preds, status) {
            g.waitingCallback = false;
                
            if (g.mapSearchField.value.length == 0) {
              util.c.hideElem(g.mapSearchSuggestions);
              return;
            }
            
            if (preds != undefined) {
              var html = '';
              for (var i = 0, pred; pred = preds[i], i < preds.length; ++i) {
                var desc = pred.description, j = desc.indexOf(',');
                
                var filter = g_Area["acceptableResultFilter"], ok = false;
                for (var k = 0; k < filter.length; ++k) {
                  if (desc.indexOf(filter[k]) != -1) {
                    ok = true;
                    break;
                  }
                }
                if (!ok) continue;
                var title, subtitle;
                if (j == -1) {
                  title = desc; subtitle = "";
                } else {
                  title = desc.substring(0, j); subtitle = desc.substring(j + 2);
                } 
                
                var optag = '<li data-type="generic-search" data-display-name="' + title + '" data-raw="' + pred.reference + '" onclick="g_MapScreen._chooseSearchResult(this)">';
                
                html += optag + '<div class="title">' + title + '</div>';
                if (subtitle != "")
                  html += '<div class="subtitle">' + subtitle + '</div>';
                
                html += '</li>';
              }
            }
            $("#map-search-suggestions #google-suggestions").innerHTML = html;
            if (html == '' && $$('#map-search-suggestions ul li').length == 0)
              util.c.hideElem(g.mapSearchSuggestions);
            else 
              util.c.showElem(g.mapSearchSuggestions);
          });
        g.waitingCallback = true;
      }, _$('keypressSearchInterval'));
    }
  },
  _initMap: function () {
    //20.465372, 44.808543
    google.maps.visualRefresh = true;
    var mapOptions = {
      center: llg(g_Area["startLocation"]),
      zoom: g_Area["startZoom"],
      minZoom: g_Area["minZoom"],
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false
    };

    var map = (g_MapScreen.map = new google.maps.Map(
      $('#main-map-area'), mapOptions
    ));
    
    
  },
  _destroyMap: function () {
    g_MapScreen.map = null;
  },
  _fitBounds: function(bounds) {
    var g = g_MapScreen;
    g.map.fitBounds(bounds);
  },
  _createPopup: function(marker, html, open) {
    var g = g_MapScreen;
    html = '<div class="popup">' + html + '</div>';
    var infowindow = new google.maps.InfoWindow({
      content: html
    }); 
    google.maps.event.addListener(marker, 'click', function() {
      if (g.activePopup) {
        g.activePopup.close();
        g.activePopup = null;
      }
      infowindow.open(g.map, marker);
      g.activePopup = infowindow;
      g.adhocPopup = false;
    });
    if (typeof open != 'undefined' && open) {
      g.activePopup = infowindow;
      g.adhocPopup = false;
      infowindow.open(g.map, marker);
    }
  },
  _produceResult: function(popupHtml, loc, focus, open, icon) {
    var g = g_MapScreen;
    if (icon == undefined) {
      icon = _$('defaultIconUrl');
    }
    var marker = new google.maps.Marker({
      position: llg(loc),
      map: g.map,
      icon: icon
    });
    
    if (g.searchResultMarker == null)
      g.searchResultMarker = marker;
    else if (!(g.searchResultMarker instanceof Array))
      g.searchResultMarker = [ g.searchResultMarker, marker ];
    else 
      g.searchResultMarker.push(marker);

    g._createPopup(marker, popupHtml, open);
    if (focus) {
      g_MapScreen._focusResult(llbg([ loc, loc ]));
    }    
  },
  _destroyMarkers: function() {
    var g = g_MapScreen;
    
    if (g.searchResultMarker instanceof Array) {
      for (var marky of g.searchResultMarker) {
        (marky.setMap(null));
      }
      g.searchResultMarker = null;
    } else if (g.searchResultMarker != null) {
      g.searchResultMarker.setMap(null);
      g.searchResultMarker = null;
    }    
    
    if (g.searchResultPaths != null) {
      for (var path of g.searchResultPaths)
        path.setMap(null);
      g.searchResultPaths = [];
    }
    
    for (var label of g.mapLabels) {
      label.onRemove();
    }
    g.mapLabels = [];
    
    if (g.geolocationMarker != null) {
      g.geolocationMarker.setMap(null);
      g.geoLocationMarker = null;
    }
  },
  _focusResult: function(loc) {
    var g = g_MapScreen;
    if (g.fail) return;
    
    if (loc instanceof google.maps.LatLngBounds) {
      g._fitBounds(loc);
      return;
    }
    g.map.panTo(llg(loc));  
    g.map.setZoom(20);  
  },
  produceStation: function(idx, lineArray, exclusive, alternate, preserve, whatPopup) {
    var g = g_MapScreen;
    if (!g.loaded)
      g.onInit();
      
    if (g.fail) return;
    if (typeof preserve == 'undefined') preserve = true;
    if (typeof whatPopup == 'undefined') whatPopup = null;
    
    if (!preserve) g._destroyMarkers();
    
    var j = idx;
    while (j >= 0 && g_Area["stations"][j]["displayName"] == undefined) --j;
    if (typeof exclusive == 'undefined') exclusive = false;
    if (typeof alternate == 'undefined') alternate = false;
    
    if (lineArray == undefined) {
      lineArray = util.data.getOperatingLines([ j ]);
    }
    
    var results = [];
    
    var station = g_Area["stations"][j];
    var stationHtml = '<div class="title">' + station["displayName"] + ' <span class="insignificant">([%id%])</span></div>';
    stationHtml += '<div class="subtitle">[%lines%]</div>';
    
    if (!exclusive || (exclusive && j == idx)) {
      var shtml = stationHtml.replace("[%id%]", g_Area["stations"][j]["id"]).replace("[%lines%]", util.data.getOperatingLines([ j ]).join(', ')) + util.c.buildPopupControls(_$('stationPopupControls'), 'station,' + j, "g_MapScreen._processPopupCommand(this)");
      results.push({ html: shtml, open: (whatPopup == null ? false : (whatPopup == g_Area["stations"][j]["id"] ? true : false)), id: g_Area["stations"][j]["id"], location: station["location"], icon: g.stopIcon.iconUrl});
    }
    
    var bounds = llbg([ station["location"], station["location"] ]);
    
    ++j;
    var loc, alt = true;
    while (j < g_Area["stations"].length && (typeof g_Area["stations"][j]["displayName"] == 'undefined')) {
      loc = g_Area["stations"][j]["location"];
      
      if (!exclusive || (exclusive && j == idx)) {
        var shtml = stationHtml.replace("[%id%]", g_Area["stations"][j]["id"]).replace("[%lines%]", util.data.getOperatingLines([ j ]).join(', ')) + util.c.buildPopupControls(_$('stationPopupControls'), 'station,' + j, "g_MapScreen._processPopupCommand(this)");
        results.push({ html: shtml, open: (whatPopup == null ? false : (whatPopup == g_Area["stations"][j]["id"] ? true : false)), id: g_Area["stations"][j]["id"], location: loc, icon: (alt? g.stopIconAlt.iconUrl : g.stopIcon.iconUrl ) });
        bounds.extend(llg(loc));
      } 
      alt = !alt;
      
      ++j;
    }
    
    if (exclusive) {
      var icon;
      if (alternate) icon = g.stopIconAlt.iconUrl; else icon = g.stopIcon.iconUrl;
      g._produceResult(results[0].html, results[0].location, false, results[0].open, icon);
    } else 
      for (var i = 0; i < results.length; ++i)
        g._produceResult(results[i].html, results[i].location, false, results[i].open, results[i].icon);
        
    return bounds; 
  },
  produceLine: function(j, focus, preserve) {
    var g = g_MapScreen;
    if (!g.loaded)
      g.onInit();
    if (g.fail) return;
    
    var line = g_Area["lines"][j];if (g.fail) return;
    
    if (typeof preserve == 'undefined') preserve = true;
    
    if (!preserve) g._destroyMarkers();
    
    
    var produced = [], alt = true, bounds = [];
    var k = 0;
    for (var stationArray of line["stations"]) {
      for (var station of stationArray) {
        if (produced.indexOf(station) != -1) continue;
        
        var idx = g_AreaIndex["stations"][station];

        var mybounds = g.produceStation(idx, undefined, true, alt, true);
        bounds[k++] = mybounds;
        
        produced.push(station);
      }
      alt = !alt;
    }
    
    var path;
    g.searchResultPaths = [];
    
    var alt = true;
    var idx = 0;
    if (typeof line["paths"] != 'undefined') {
      for (var pathDesc of line["paths"]) {
        alt = !alt;

        var newPath = [];
        for (var i = 0; i < pathDesc.length; ++i)
          newPath.push(llg(pathDesc[i]));
          
        path = new google.maps.Polyline({ path: newPath, strokeOpacity: _$('pathOpacity'), strokeWeight: line["pathWeight"], 
          strokeColor: (!alt? _$('linePathColorAlt') : _$('linePathColor')) });
        path.setMap(g.map);
        
        var off = Math.round((alt ? _$('lineTextSpacing') / 2 : _$('nullTextSpacing')));
        /*path.setText(util.c.buildLabel(line["id"], off), { repeat: true, offset: line["pathWeight"] / 2 });*/
        g.searchResultPaths.push(path);
        
        /*var popupHtml = '<div class="title"><img src="icons/line-types/' + line["type"] + _$('popupLineTypeSuffix') + '" class="popup-line-icon" />linija ' + line["id"] + '</div>' +
          '<div class="subtitle">' + util.data.formatStations(line["stations"][idx]) + '</div>' + util.c.buildPopupControls(_$('linePopupControls'), "line," + j + "," + idx, 
          'g_MapScreen._processPopupCommand(this)');
          
        path.bindPopup(popupHtml);*/
        ++idx;
      }
    }
    
    /*if (focus) {
      g.map.fitBounds(path.getBounds());
    }*/
    
    return bounds[Math.floor(k / 4)];
  },
  _chooseSearchResult: function(elem) {
    var g = g_MapScreen;
    util.c.hideElem(g.mapSearchSuggestions);
    g.mapSearchField.value = "";

    g._destroyMarkers();
    
    var srchtype = elem.getAttribute("data-type") ;
    if (srchtype == "generic-search") {
      var raw = elem.getAttribute("data-raw");
      g.pickedResult = elem.getAttribute("data-display-name");
      
      g.places.getDetails({ reference: raw }, function (res, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          var firstResult = res;
            
          var latlng = firstResult["geometry"]["location"], loc = [latlng.lat(), latlng.lng()];
          g._produceResult(elem.innerHTML + util.c.buildPopupControls(_$('placePopupControls'), 'place', "g_MapScreen._processPopupCommand(this)"), loc, true, true);
        }
      });
    } else if (srchtype == "transport-search") {
      var raw = elem.getAttribute("data-raw"), rawSp = raw.split(',');
      if (rawSp[0] == 'station') {
        var j = rawSp[1];
        g._focusResult(g.produceStation(j, undefined, undefined, undefined, false));                                                                                                                                  ;
      } else if (rawSp[0] == 'line') {
        var j = rawSp[1];
        g._focusResult(g.produceLine(j, true, false));
      }
    }
  },
  _getTransportSearchResults: function(query) {
   function lineSearch(lineNo, type, sort) {
      var res = [],  typeStr;
      if (sort == undefined) sort = true;
      if (type != undefined)
        typeStr = g_Area["lineTypes"][type]["name"];
      else {
        var linetypes = g_Area["lineTypes"], rz = [];
        for (var i = 0; i < linetypes.length; ++i)
          rz = rz.concat(lineSearch(lineNo, i, false));
          
        return rz.sort(function(a,b) {
          var lna = g_Area["lines"][a.idx], lnb = g_Area["lines"][b.idx];
          
          return (lna["id"].length - lnb["id"].length);
        });
      }
      var l = g_Area["lines"];
      for (var i = 0; i < l.length; ++i) {
        if (type != undefined && l[i]["type"] != typeStr) continue;
        if (l[i]["id"].toLowerCase().indexOf(lineNo.toString()) == 0) {
          res.push({ tpi: type, type: "line", idx: i });
          if (res.length > _$('maxLineSearchResults')) {
            if (sort)
              return res;
            else return res;
          }
        }
      }
      
      if (sort)
        return res;
      else return res;
    }
    
    function stationSearch(stationNo) {
      var res = [];
      
      var s = g_Area["stations"];
      var lastWithDisplayName = 0, lwdnUsed = false;
      for (var i = 0; i < s.length; ++i) {
        if (s[i]["displayName"] != undefined) {
          lastWithDisplayName = i;
          lwdnUsed = false;
        }
        if (!lwdnUsed && s[i]["id"].toString().indexOf(stationNo.toString()) == 0) {
          res.push({ type: "station", idx: lastWithDisplayName });
          lwdnUsed = true;
          if (res.length > _$('maxStationSearchResults'))  return res.sort();
        }
      }   
       return res.sort();
    }
    
    function stationTextSearch(stationQuery) {
      var res = [];
      
      var s = g_Area["stations"], normalizedQuery = util.data.normalizeString(stationQuery);
      
      var lastWithDisplayName = 0, lwdnUsed = false;
      for (var i = 0; i < s.length; ++i) {
        if (s[i]["displayName"] != undefined) {
          lastWithDisplayName = i;
          lwdnUsed = false;
        }
        if (!lwdnUsed && s[lastWithDisplayName]["displayNameNormalized"].indexOf(normalizedQuery) == 0) {
          res.push({ type: "station", idx: lastWithDisplayName });
          lwdnUsed = true;
          if (res.length > _$('maxStationTextSearchResults')) return res.sort();
        }
      }   
       return res.sort();
    }
    
    query = query.trim();
    query = query.toLowerCase();
    
    var results = stationTextSearch(query);
    
    var numericalQuery = query;
    for (var i = 0; i < g_Area["lineQueries"].length; ++i)
      numericalQuery = numericalQuery.replace(g_Area["lineQueries"][i], "");
    for (var i = 0; i < g_Area["stationQueries"].length; ++i)
      numericalQuery = numericalQuery.replace(g_Area["stationQueries"][i], "");
    for (var i = 0; i < g_Area["lineTypes"].length; ++i)
      for (var j = 0; j < g_Area["lineTypes"][i]["queries"].length; ++j)
        numericalQuery = numericalQuery.replace(g_Area["lineTypes"][i]["queries"][j], "");
    numericalQuery = numericalQuery.trim();
      
    if (numericalQuery.length <= 0 || isNaN(numericalQuery[0])) return results;
    
    /*for (var i = 0; i < g_Area["lineQueries"].length; ++i) {
      if (query.indexOf(g_Area["lineQueries"][i]) == 0) {
        return results.concat(lineSearch(numericalQuery));
      }
    }*/
    
    for (var i = 0; i < g_Area["stationQueries"].length; ++i) {
      if (query.indexOf(g_Area["stationQueries"][i]) == 0) {
        return results.concat(stationSearch(numericalQuery));
      }
    }
    
    for (var i = 0; i < g_Area["lineTypes"].length; ++i) {
      var break2 = false;
      for (var j = 0; j < g_Area["lineTypes"][i]["queries"].length; ++j) {
        if (query.indexOf(g_Area["lineTypes"][i]["queries"][j]) == 0) {
          return results.concat(lineSearch(numericalQuery, i));
        }
      }
      if (break2) break;
    }
    results = results.concat(lineSearch(numericalQuery));
    results = results.concat(stationSearch(numericalQuery));
    
    return results;
  },
  _geolocate: function(elem) {
    var g = g_MapScreen;
    
    $('#geolocation-hud').parentNode.classList.add('sign-of-evil');
    $('#geolocation-progress').classList.remove('hide');
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        $('#geolocation-hud').parentNode.classList.remove('sign-of-evil');
        $('#geolocation-progress').classList.add('hide');
        var loc = [pos.coords.latitude, pos.coords.longitude];
        var radius = pos.coords.accuracy / 2;
        
        var marker = (g.geolocationMarker = new /* TODO: icon */ google.maps.Marker({
          position: llg(loc),
          map: g.map,
          icon: g.geolocationIcon.iconUrl
        }));
        
        g._createPopup(marker, '<div class="title">' + _$$('geolocation-youAreHere') + '</div><div class="subtitle">' + 
          _$$('geolocation-accuracy') + pos.coords.accuracy.toFixed(1) + ' m</div>' + util.c.buildPopupControls(_$('placePopupControls'),
          "geolocation", "g_MapScreen._processPopupCommand(this)"), true);
        g._focusResult(llbg([ loc, loc ]));
      }, 
      function(error) {
        $('#geolocation-hud').parentNode.classList.remove('sign-of-evil');
        $('#geolocation-progress').classList.add('hide');
        switch (error.code) {
          case error.POSITION_UNAVAILABLE: {
            alert(_$$('messages-geolocationPositionUnavailable'));
          } break;
          case error.TIMEOUT: {
            alert(_$$('messages-geolocationTimeout'));
          } break;
        }
      },
      { enableHighAccuracy: true }
    );
  },

  _labelStraightLine: function(path, labelText, fontSize) {
    var g = g_MapScreen;
    
    var loc1 = path.getPath().getAt(0), loc2 = path.getPath().getAt(1);
    var midLoc = llg( [(loc1.lat() + loc2.lat()) / 2, (loc1.lng() + loc2.lng()) / 2] );
    var mapLabel = new MapLabel({
      text: labelText,
      position: midLoc,
      map: g.map,
      fontSize: fontSize,
      align: 'center',
      fontFamily: _$('lineLabelFontFamily')
    });
    g.mapLabels.push(mapLabel);

  },
  doAction: function(command, context) {
    var loc, g = g_MapScreen;
    if (!g.loaded)
      g.onInit();
      
    if (g.fail)
      return;
      
    switch (context[0]) {
      case "place": {
        loc = (g.searchResultMarker instanceof Array ? g.searchResultMarker[0].getPosition() : g.searchResultMarker.getPosition());
        loc = [ loc.lat(), loc.lng() ];
      } break;
      
      case "station": {
        loc = g_Area["stations"][context[1]]["location"];
      } break;
      
      case "geolocation": {
        loc = g.geolocationMarker.getPosition();
        loc = [loc.lat(), loc.lng()];
      } break;
      
      case "adhoc": {
        loc = [ parseFloat(context[1]), parseFloat(context[2]) ];
      } break;
    }
    
    var stations = util.data.Area["stations"];
    switch (command) {
      case 'setAsSource':
      case 'setAsDestination': {
        var src = (command == 'setAsSource');
        
        var pt = (src? g.pointA : g.pointB);
        if (pt  != null)
          pt.setMap(null);

        var icon;
        if (src) icon = g.pointAIcon.iconUrl; else icon = g.pointBIcon.iconUrl;
        icon = {
          url: icon,
          size: new google.maps.Size(g.pointAIcon.iconSize[0], g.pointAIcon.iconSize[1]),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(g.pointAIcon.iconAnchor[0], g.pointAIcon.iconAnchor[1])
        };
        
        var marker = new google.maps.Marker({ map: g.map, position: llg(loc), icon: icon, zIndex: -5 }); /*TODO:icon*/
        if (src) g.pointA = marker; else g.pointB = marker;
        
        var selection = { };
        switch (context[0]) {
          case "place": {
            selection.type = "place";
            selection.location = loc;
            selection.placeName = g.pickedResult;
          } break;
          
          case "adhoc": {
            selection.type = "place";
            selection.location = loc;
            selection.placeName = _$$('routing-adhocPlace');
          } break;
          
          case "station": {
            selection.type = "station";
            selection.id = context[1];
            selection.placeName = util.data.representativeStationByID(g_Area["stations"][context[1]]["id"])["displayName"] + ' <span class="insignificant">(' + 
              g_Area["stations"][context[1]]["id"] + ')</span>';
          } break;
        }
        if (src)
          g_RoutingSelections.setA(selection, true);
        else g_RoutingSelections.setB(selection, true);
        
        var html = '<div class="title">' + (src? _$$('routing-pointA') : _$$('routing-pointB')) + '</div><div class="subtitle">' + selection.placeName + '</div>' + 
          util.c.buildPopupControls(_$('anchorPopupControls'), "anchor," + (src? 'A' : 'B'), "g_MapScreen._processPopupCommand(this)");
        g._createPopup(marker, html, false);
        if (src) g.pointAContext = context; else g.pointBContext = context;
      } break;
      
      case 'removeAnchor': {
        if (context[1] == 'A') {
          g.pointA.setMap(null);
          g.pointA = null;
          g_RoutingSelections.setA({ type: "not-selected" }, true);
        } else {
          g.pointB.setMap(null);
          g.pointB = null;
          g_RoutingSelections.setB({ type: "not-selected" }, true);
        }
      } break;
      
      case 'nearestStops': {
        if (g.searchResultPaths != null)
          for (var path of g.searchResultPaths)
            path.setMap(null);
        g.searchResultPaths = [];
        
        var bounds = null;
        var dists = util.data.nearestStations(loc, _$('nearestStopCount'));
        for (var i = 0; i < dists.length; ++i) {
          var mybounds = g.produceStation(dists[i].idx);
          if (bounds == null)
            bounds = mybounds;
          else bounds.extend(mybounds.getSouthWest());
          
          var alt = false, idx = dists[i].idx;
          var polyline = new google.maps.Polyline({ path: [ llg(stations[idx]["anchor"]), llg(loc) ].sort(function(a,b) { return a.lng() - b.lng(); }), 
            strokeWeight: _$('stopTraceWeight'), strokeOpacity: _$('pathOpacity'), strokeColor: _$('stopTraceColor') });
          polyline.setMap(g.map);
          /*TODO:text*/ //polyline.setText(util.c.buildLabel(util.c.formatDistance(util.math.geoDistance(loc, stations[idx]["anchor"])), alt? _$('nullTextSpacing') : _$('distanceTextSpacing'), _$('distanceTextSpacing')),
            //{ repeat: true, offset: _$('stopTraceWeight') / 2});
          g.searchResultPaths.push(polyline);
          g._labelStraightLine(polyline, util.c.formatDistance(util.math.geoDistance(loc, stations[idx]["anchor"])), _$('lineLabelFontSize'));
          
          var si = idx;
          
          var alt = true;
          while (idx < stations.length && (si == idx || stations[idx]["displayName"] == undefined)) {
            polyline = new google.maps.Polyline({ path: [ llg(stations[idx]["anchor"]), llg(stations[idx]["location"]) ],
              strokeWeight: _$('stopSecondaryTraceWeight'), strokeOpacity: _$('pathOpacity'), strokeColor: _$((alt? 'linePathColor' : 'linePathColorAlt')) });
            polyline.setMap(g.map);
            g.searchResultPaths.push(polyline);
            
            ++idx;
            alt = !alt;
          };
        }
        
        g._fitBounds(bounds);
      } break;
      
      case 'showInNetwork': {
        if (context[0] == 'line') {
          g_LineInfoScreen.present(g_Area["lines"][context[1]]);
        } else if (context[0] == 'station') {
          g_StationInfoScreen.present(g_Area["stations"][context[1]]);
        }
      } break;
      
    }
  },
  _processPopupCommand: function(elem) {
    var g = g_MapScreen;
    if (g.activePopup != null) {
      g.activePopup.close();
      g.activePopup = null;
    }
    
    var command = elem.getAttribute("data-command"), context = elem.getAttribute("data-context").split(','), loc;
    g.doAction(command, context);
  }
};

g_NetworkViewScreen = {
  name: 'network-view-screen',
  loaded: false,
  dataShown: null,
  dataShownAmount: 0,
  searchField: null,
  searchWatcherInterval: null,
  map: null,
  activeTab: '',
  lastQuery: "",
  watcherContext: null,
  recall: function() {
    var g = g_NetworkViewScreen;
    if (typeof localStorage["networkCurrentTabID"] != "undefined")
      g._tabSelected(localStorage["networkCurrentTabID"]);
  }, 
  onInit: function() {
    var g = g_NetworkViewScreen;
    if (g.loaded) return;
    
    $$('#net-view-filter li a').forEach(function(elem) {
      elem.addEventListener('click', function(ev) {
        g._tabSelected(this.parentNode.id);
      });
    });
    
    $('#net-view-load-more').addEventListener('click', function() {
      var lastAmt = g.dataShownAmount;
      g.dataShownAmount += _$('netViewItemsPerPage');
      if (g.dataShownAmount > g.dataShown.length) {
        this.style.display = 'none';
        g.dataShownAmount = g.dataShown.length;
      }
      $('#net-view-list').innerHTML += g._createDataHTML(lastAmt, g.dataShownAmount - 1);
    });
    
    g.searchField = $('#net-search-text');
    g.searchField.addEventListener('focus', function() {
      /*util.c.hideElem($('#net-view-filters'));*/
      $('#net-view-content').classList.add('free');
      g.searchWatcherInterval = setInterval(function() {
        g._searchWatch();
      }, _$('netSearchWatcherInterval'));
    });
    g.searchField.addEventListener('blur', function() {
      g._searchWatch();
      $('#net-view-content').classList.remove('free');
      clearInterval(g.searchWatcherInterval);
      /*util.c.showElem($('#net-view-filters'));*/
    });
  },
  onDestroy: function() {
    if (!g.loaded) return;
  },
  onNavigateTo: function() {
    var g = g_NetworkViewScreen;
    
    g._tabSelected($('[role="tab"][aria-selected="true"]').id);
  },
  onNavigateAway: function() {
    
  },
  _searchWatch: function() {
    var g = g_NetworkViewScreen, query = g.searchField.value.toLowerCase().trim();
    if (g.lastQuery != query) {
      if (g.activeTab == 'lines')
        g._effectLines(query);
      else if (g.activeTab == 'stations')
        g._effectStations(query);

      g.lastQuery = query;
    }
  },
  _destroyMap: function() {
    var g = g_NetworkViewScreen;
    if (!g.map) return;
    
    $('#net-view-content').classList.remove('ghostly');
    $('#net-search-field').classList.remove('ghostly');
    
    var mnode = $('#net-view-map'), nmnode = document.createElement('div');
    nmnode.id = mnode.id;
    nmnode.classList.add('ghostly');
    nmnode.innerHTML = '<div id="net-view-map-container"></div>';
    mnode.parentNode.replaceChild(nmnode, mnode);
    
    g.map = null;
  },
  _createMap: function() {
    var g = g_NetworkViewScreen;
    if (g.map) return;
    
    $('#net-view-content').classList.add('ghostly');
    $('#net-search-field').classList.add('ghostly');
    $('#net-view-map').classList.remove('ghostly');
    
    var tmi = g_Area["tracemap"];
    var map = (g.map = new L.Map('net-view-map-container', {
      maxZoom: tmi["maxZoom"],
      minZoom: tmi["minZoom"],
      crs: L.CRS.Simple
    }));
    
    /*var zoom = Math.ceil((tmi["maxZoom"] + tmi["minZoom"]) / 2.0);*/
    map.setView(map.unproject([tmi["dimensions"][1] / 2.0, tmi["dimensions"][0] / 2.0], map.getMaxZoom()), tmi["minZoom"]);
    var sw = map.unproject([0, tmi["dimensions"][1]], map.getMaxZoom());
    var ne = map.unproject([tmi["dimensions"][0], 0], map.getMaxZoom());
    map.setMaxBounds(new L.LatLngBounds(sw, ne));
    
    L.tileLayer(tmi["url"], {minZoom: tmi["minZoom"], maxZoom: tmi["maxZoom"]}).addTo(map);
      
  },
  _tabSelected: function(tabID) {
    var g = g_NetworkViewScreen;
    //g.searchField.value = "";
    g._searchWatch();
    $('#network-view-screen [role="tab"][aria-selected="true"]').setAttribute('aria-selected', 'false');
    $('#' + tabID).setAttribute('aria-selected', 'true');
    $('#net-view-content').scrollTop = 0;
    if (tabID != "network-view-filter-nearby") {
      if (g.watcherContext)
        navigator.geolocation.clearWatch(g.watcherContext);
      
      $('#network-view-screen').classList.remove('irrelevant');
    }
    localStorage["networkCurrentTabID"] = tabID;
    
    if (tabID == 'network-view-filter-lines') {
      if (g.activeTab == 'lines') return;
      g.activeTab = 'lines';
      g._destroyMap();
      $('#net-search-text').setAttribute('placeholder', _$$('interface-lineSearchPlaceholder'));
      g._effectLines("");
    } else if (tabID == 'network-view-filter-stops') {
      if (g.activeTab == 'stations') return;
      g._destroyMap();
      g.activeTab = 'stations';
      $('#net-search-text').setAttribute('placeholder', _$$('interface-stationSearchPlaceholder')); 
      g._effectStations("");
    } else if (tabID == 'network-view-filter-map') {
      if (g.activeTab == 'map') return;
      g.activeTab = 'map';
      g._createMap();
      
    } else if (tabID == 'network-view-filter-nearby') {
      localStorage["networkCurrentTabID"] = 'network-view-filter-stops';
      if (g.activeTab == 'nearby')
        return;
      
      g._destroyMap();
      g.activeTab = 'nearby';
      g.dataShown = [];
      g._updateData();
      $('#network-view-screen').classList.add('irrelevant');
      
      $('#net-view-list').innerHTML = 
        '<ul><li><progress></progress>' + _$$('geolocation-locatingWait') + '</li></ul>';      
      if ("geolocation" in navigator) {
          navigator.geolocation.watchPosition(function(position) {
            g._effectNearbyData(position.coords);
          },
          function(error) {
            g.dataShown = [];
            g._updateData();
            $('#net-view-list').innerHTML = 
              '<ul><li>' + _$$('geolocation-netViewError') + '</li></ul>';
          },
          { enableHighAccuracy: true }
        );
      }
      
    }
  },
  _effectNearbyData: function(loc) {
    var g = g_NetworkViewScreen;
    
    var data = [],
        sts = util.data.nearestStations([ loc.latitude, loc.longitude ], _$('netViewNearestStops'), -1, false, true);
        
    var name = "";
    for (var i = 0; i < sts.length; ++i) {
      var st = g_Area["stations"][sts[i].idx];
      if (typeof st["displayName"] != 'undefined')
        name = st["displayName"];
        
      data.push({
        type: "element",
        context: sts[i].idx,
        contents: '<p><span class="insignificant distance">' + util.c.formatDistance(sts[i].d) + '</span> ' + name + ' <span class="insignificant">(' + st["id"] + ')</span></p><p>' + util.data.getOperatingLines([ sts[i].idx ]).join(', ') + '</p>'
      });
    }
    
    g.dataShown = data;
    g._updateData();
  },
  _updateData: function() {
    var g = g_NetworkViewScreen;
    g.dataShownAmount = _$('netViewItemsPerPage');
    $('#net-view-list').innerHTML = g._createDataHTML(0, g.dataShownAmount - 1);
    if (g.dataShownAmount < g.dataShown.length)
      $('#net-view-load-more').style.display = 'block';
    else $('#net-view-load-more').style.display = 'none';
  },
  _listElementClicked: function(el) {
    var g = g_NetworkViewScreen;    var ctx = el.getAttribute('data-context');
    if (g.activeTab == 'stations') {
      g_StationInfoScreen.present(g_Area["stations"][ctx]);
    } else if (g.activeTab == 'lines') {
      g_LineInfoScreen.present(g_Area["lines"][ctx]);
    } else if (g.activeTab == 'nearby') {
      g_StationInfoScreen.present(g_Area["stations"][ctx]);
    }
  },
  _createDataHTML: function(start, end) {
    var html = "<ul>", g = g_NetworkViewScreen;
    for (var i = start; i <= end && i < g.dataShown.length; ++i) {
      var datum = g.dataShown[i];
      if (datum.type == 'header')
        html += '</ul><header>' + datum.contents + '</header><ul>';
      else html += '<li onclick="g_NetworkViewScreen._listElementClicked(this);" data-context="' + datum.context + '">' + datum.contents + '</li>';
    }
    html += '</ul>';
    return html;
  },
  _effectLines: function(filter) {
    filter = filter.toLowerCase();
    var results = [], g = g_NetworkViewScreen, typeEnum = g_Area["lineTypeOrdering"], typeIndexer = g_AreaIndex["types"], lineIndexer = g_AreaIndex["lines"], lines = g_Area["lines"];
    for (var i = 0; i < typeEnum.length; ++i) {
      var typeName = typeEnum[i], linesOfType = typeIndexer[typeName];
      for (var j = 0; j < linesOfType.length; ++j) {
        var line = lines[lineIndexer[linesOfType[j]]];
        if (filter.length == 0 || line["id"].toLowerCase().indexOf(filter) == 0)
          results.push({
            name: line["id"],
            type: typeName,
            stations: util.data.formatStations(line["stations"][0]),
            context: lineIndexer[linesOfType[j]]
          });
      }
    }
    
    var lastType = "", newData = [];
    for (var i = 0; i < results.length; ++i) {
      var res = results[i];
      if (res.type != lastType)
        newData.push({type: "header", context: res.context, contents: util.data.lineTypeByName(res.type)["displayName"]});
      newData.push({type: "element", context: res.context, contents: '<a href="#"><p>' + res.name + '</p><p>' + res.stations + '</p></a>'});
      lastType = res.type;
    }
    
    g.dataShown = newData;
    g._updateData();
    //$('#net-view-list').innerHTML = html;
  },
  _effectStations: function(filter) {
    filter = filter.toLowerCase().trim();
    
    var numeric = false;
    if (!isNaN(filter))
      numeric = true;
      
    var results = [], g = g_NetworkViewScreen, stationIndexer = g_AreaIndex["stations"], stationsSorted = g_AreaIndex["sortedStations"], stations = g_Area["stations"];
    
    if (!numeric) filter = util.data.normalizeString(filter);
    var nDisplayName, displayName;
    
    var populated = [];
    for (var i = 0; i < stationsSorted.length; ++i) {
      var j = stationIndexer[stationsSorted[i]];
      while (j >= 0 && typeof stations[j]["displayName"] == 'undefined')
        --j;
        
      var station = stations[j];
      displayName = station["displayName"];
      nDisplayName = station["displayNameNormalized"];
      if (populated[j]) continue;
      
      populated[j] = true;
      if (filter.length == 0 || (numeric && station["id"].toString().indexOf(filter) == 0) || (!numeric && nDisplayName.indexOf(filter) == 0)) {
        results.push({
          name: displayName,
          id: station["id"],
          lines: util.data.getOperatingLines([ j ]),
          context: j
        });
        
        ++j;
        while (j < stations.length && typeof stations[j]["displayName"] == 'undefined') {
          results.push({
            name: displayName,
            id: stations[j]["id"],
            lines: util.data.getOperatingLines([ j ]),
            context: j
          });
          ++j;
        }
      }
    }
    
    var newData = [];
    for (var i = 0; i < results.length; ++i) {
      var res = results[i];
      if (res.lines.length > 0)
        newData.push({type: "element", context: res.context, contents: '<a href="#"><p>' + res.name + ' <span class="insignificant">(' + res.id + ')</span></p><p>' + res.lines.join(', ') + '</p></a>'});
    }
    
    g.dataShown = newData;
    g._updateData();    
  }
};

g_LineInfoScreen = {
  name: 'line-info-screen',
  currentLine: null,
  present: function(lineVar, passive) {
    if (typeof passive == 'undefined') passive = false;
    localStorage["lineInfoState"] = JSON.stringify(lineVar);
    
    $('#line-info-screen article.content').scrollTop = 0;
    $('#line-info-title').innerHTML = _$$('interface-lineInfoTitle').replace("[%id%]", lineVar["id"].toString()).replace("[%type%]", 
      util.data.lineTypeByName(lineVar["type"])["displayName"]);
    var stations = lineVar["stations"][0], stationList = lineVar["stations"];
    
    g_LineInfoScreen.currentLine = lineVar;
    var showMiddle = false;
    if (stations[0] == stations[stations.length - 1])
      showMiddle = true;
      
    $('#line-info-start-name').innerHTML = util.data.representativeStationByID(stations[0])["displayName"];
    $('#line-info-start-id').innerHTML =  stations[0];
    $('#line-info-end-name').innerHTML = util.data.representativeStationByID(stations[stations.length - 1])["displayName"];
    $('#line-info-end-id').innerHTML = stations[stations.length - 1];
    if (showMiddle) {
      var mid = Math.floor(stations.length / 2);
      $('#line-info-mid-name').innerHTML = util.data.representativeStationByID(stations[mid])["displayName"];
      $('#line-info-mid-id').innerHTML = stations[mid];
      
      $('#line-terminusM').classList.remove('ghostly');
      $('#terminusM-line').classList.remove('ghostly');
    } else {
      $('#line-terminusM').classList.add('ghostly');
      $('#terminusM-line').classList.add('ghostly');      
    }
    
    var lineListHTML = [ '', '' ];
    for(var i = 0; i < stationList.length; ++i) {
      for (var j = 0; j < stationList[i].length; ++j) {
        var st = stationList[i][j];
        var html = '<li><a href="#" class="station-clickable" data-id="' + st + '">' + st + '</a><span class="subtitle">' + 
          util.data.representativeStationByID(st)["displayName"] + '</span></li>';
        lineListHTML[i] += html;
      }
    }
    $('#line-stops-dirA').innerHTML = lineListHTML[0];
    $('#line-stops-dirB').innerHTML = lineListHTML[1];
    $$('.station-clickable').forEach(function(el) {
      el.addEventListener('click', function() {
        g_StationInfoScreen.present(util.data.stationByID(this.getAttribute("data-id")));
      });
    });
    
    if (!passive) navigateTo(g_LineInfoScreen);
  },
  recall: function() {
    if (localStorage["lineInfoState"] != undefined) {
      try {
        g_LineInfoScreen.present(JSON.parse(localStorage["lineInfoState"]), true);
      } catch (e) {
        /* oh, well. */
      }
    }
  },
  onInit: function() {
    $('#line-show-on-map').addEventListener('click', function() {
      g_MapScreen._focusResult(g_MapScreen.produceLine(g_AreaIndex["lines"][g_LineInfoScreen.currentLine["id"]], undefined, false));
      var hasMap = false, mi;
      for (var i = 0; i < g_Screens.length; ++i)
        if (g_Screens[i].name == g_MapScreen.name) {
          hasMap = true;
          mi = i;
          break;
        }
        
      if (hasMap) {
        g_Screens.splice(mi + 1, g_Screens.length - 2 - mi);
        navigateBack();
      } else {
        g_Screens.splice(1, 0, g_MapScreen);
        g_Screens.splice(2, g_Screens.length - 3);
        navigateBack();
      }
    });
  },
  onDestroy: function() {
    
  },
  onNavigateTo: function() {
    
  },
  onNavigateAway: function() {
    
  }
};

g_StationInfoScreen = {
  name: 'station-info-screen',
  currentStation: null,
  present: function (stVar, passive) {
    if (typeof passive == 'undefined') passive = false;
    
    localStorage["stationInfoState"] = JSON.stringify(stVar);
    
    $('#station-info-screen article.content').scrollTop = 0;
    g_StationInfoScreen.currentStation = stVar;
    var rep = util.data.representativeStationByID(stVar["id"]);
    $('#station-info-title').innerHTML = _$$('interface-stationInfoTitle').replace('[%id%]', stVar["id"]);
    $('#station-info-name-field').innerHTML = rep["displayName"];
    var html = '', lines = util.data.getOperatingLines([ g_AreaIndex["stations"][stVar["id"]] ]);
    for (var i = 0; i < lines.length; ++i) {
      html += '<li><a href="#" class="line-clickable" data-id="' + lines[i] + '">' + lines[i] + ' </a><div class="desc">' + util.data.formatStations(
        util.data.lineByID(lines[i])["stations"][0]) + ' </div></li>';
    }

    $('#station-info-screen .line-list ul').innerHTML = html;
    $$('.line-clickable').forEach(function(el) {
      el.addEventListener('click', function() {
        g_LineInfoScreen.present(util.data.lineByID(this.getAttribute("data-id")));
      });
    });
    
    if (g_RoutingSelections.pointA.type == "station" && g_Area["stations"][g_RoutingSelections.pointA.id]["id"] == stVar["id"])
      $('#station-info-screen .routing-pointA').classList.remove('inactive');
    else $('#station-info-screen .routing-pointA').classList.add('inactive');
    
    if (g_RoutingSelections.pointB.type == "station" && g_Area["stations"][g_RoutingSelections.pointB.id]["id"] == stVar["id"])
      $('#station-info-screen .routing-pointB').classList.remove('inactive');
    else $('#station-info-screen .routing-pointB').classList.add('inactive');
    
    $$('#station-info-screen .routing-controls a').forEach(function(el) {
      el.setAttribute("data-station", stVar["id"]);
    });
    if (!passive) navigateTo(g_StationInfoScreen);
    
  },
  onInit: function() {
    $$('#station-info-screen .routing-pointA').forEach(function(el) {
      el.addEventListener('click', function() {
        if (!this.classList.contains('inactive')) {
          g_RoutingSelections.setA({ type: "not-selected" });
          this.classList.add('inactive');
          return;
        }
        
        var bst, id = g_AreaIndex["stations"][this.getAttribute('data-station')];
        if (g_RoutingSelections.pointB.type == 'station' && g_RoutingSelections.pointB.id == id)
          $('#station-info-screen .routing-pointB').classList.add('inactive');
          
        g_RoutingSelections.setA({
          type: "station",
          id: g_AreaIndex["stations"][this.getAttribute('data-station')]
        });
        this.classList.remove('inactive');
      });
    });
    
    /* viva la boilerplate */
    $$('#station-info-screen .routing-pointB').forEach(function(el) {
      el.addEventListener('click', function() {
        if (!this.classList.contains('inactive')) {
          g_RoutingSelections.setB({ type: "not-selected" });
          this.classList.add('inactive');
          return;
        }
        
        var bst, id = g_AreaIndex["stations"][this.getAttribute('data-station')];
        if (g_RoutingSelections.pointA.type == 'station' && g_RoutingSelections.pointA.id == id)
          $('#station-info-screen .routing-pointA').classList.add('inactive');
          
        g_RoutingSelections.setB({
          type: "station",
          id: g_AreaIndex["stations"][this.getAttribute('data-station')]
        });
        this.classList.remove('inactive');
      });
    }); 
    
    $('#station-show-on-map').addEventListener('click', function() {
      g_MapScreen._focusResult(g_MapScreen.produceStation(g_AreaIndex["stations"][g_StationInfoScreen.currentStation["id"]], undefined, undefined, undefined, false, g_StationInfoScreen.currentStation["id"]));
      var hasMap = false, mi;
      for (var i = 0; i < g_Screens.length; ++i)
        if (g_Screens[i].name == g_MapScreen.name) {
          hasMap = true;
          mi = i;
          break;
        }
        
      if (hasMap) {
        g_Screens.splice(mi + 1, g_Screens.length - 2 - mi);
        navigateBack();
      } else {
        g_Screens.splice(1, 0, g_MapScreen);
        g_Screens.splice(2, g_Screens.length - 3);
        navigateBack();
      }
    });   
    
    $('#station-vehicle-info').addEventListener('click', function() {
      var activity = new MozActivity({
        name: "dial",
        data: {
          type: 'webtelephony/number',
          number: _$('ussdPrefix') + g_StationInfoScreen.currentStation["id"] + _$('ussdSuffix')
        }
      });

      activity.onsuccess = function() {
        
      };

      activity.onerror = function() {
        alert(_$('messages-cannotDial'));
      };
    });
  },
  recall: function() {
    if (localStorage["stationInfoState"] != undefined) {
      try { g_StationInfoScreen.present(JSON.parse(localStorage["stationInfoState"]), true); }
      catch (e) { /* oh, well. */ }
    }
  },
  onDestroy: function() {
    
  },
  onNavigateTo: function() {
    
  },
  onNavigateAway: function() {
    
  }
};

g_DirectionsScreen = {
  name: "directions-screen",
  _paths: null,
  _ptA: null,
  _ptB: null,
  activeTab: 0,
  _createPointName: function(pt) {
    var pn;
    if (pt.type == "station") {
      var st = g_Area["stations"][pt.id], repst = util.data.representativeStationByID(st["id"]);
      pn = repst["displayName"] + ' <span class="insignificant">(' + st["id"] + ')</span>';
    } else if (pt.type == "place") {
      pn = pt.placeName;
    }
    
    return pn;
  },
  present: function(paths, ptA, ptB) {
    localStorage["directionsState"] = JSON.stringify({
      paths: paths,
      ptA: ptA,
      ptB: ptB
    });
    var g = g_DirectionsScreen;
    g._paths = paths;
    g._ptA = ptA;
    g._ptB = ptB;
    
    if (paths.length < 3)
      $('#directions-filter3').setAttribute("aria-disabled", "true");
    else $('#directions-filter3').setAttribute("aria-disabled", "false");
    if (paths.length < 2)
      $('#directions-filter2').setAttribute("aria-disabled", "true");
    else $('#directions-filter2').setAttribute('aria-disabled', 'false');
    
    $('#pointA-name').innerHTML = g._createPointName(g._ptA);
    $('#pointB-name').innerHTML = g._createPointName(g._ptB);
    
    g._tabSelected("directions-filter1");
  },
  onInit: function() {
    var g = g_DirectionsScreen;
    
    $$('#directions-filter li a').forEach(function(elem) {
      elem.addEventListener('click', function(ev) {
        if (this.parentNode.getAttribute('aria-disabled') != 'true')
          g._tabSelected(this.parentNode.id);
      });
    });
  },
  recall: function() {
    if (localStorage["directionsState"] != undefined) {
      var recalled = JSON.parse(localStorage["directionsState"]);
      try {
        g_DirectionsScreen.present(recalled.paths, recalled.ptA, recalled.ptB);
      } catch (e) {
        /* oh, well. */
      }
    }
  },
  onDestroy: function() {
    
  },
  onNavigateTo: function() {
    
  },
  onNavigateAway: function() {
    
  },
  _tabSelected: function(id) {
    var g = g_DirectionsScreen;
    var tab;
    if (id == "directions-filter1") tab = 0;
    else if (id == "directions-filter2") tab = 1;
    else if (id == "directions-filter3") tab = 2;
    $('#directions-screen .content').scrollTop = 0;

    $('#directions-screen [role="tab"][aria-selected="true"]').setAttribute('aria-selected', 'false');
    $('#' + id).setAttribute('aria-selected', 'true');
    
    g.activeTab = tab;
    var path = g._paths[tab], res = g._createDirectionsHTML(path);
    $('#directions-list').innerHTML = res.html;
    $('#route-length').innerHTML = res.cost + " min";
    
  },
  _createDirectionsHTML: function(directions) {
    var previous = directions[0].station, res = [], proCost = 0, postCost = 0, g = g_DirectionsScreen;
    if (g._ptA.type != "station") {
      var dist =  util.math.naturalGeoDistance(g._ptA.location, util.data.stationByID(previous)["location"]);
      proCost = 60.0 * dist / _$('walkKmh');
      res.push({ type: "prologue", distance: util.c.formatDistance(dist), cost: Math.round(proCost) });
    }
    for (var i = 0; i < directions.length; ++i) {
      var enriched = JSON.parse(JSON.stringify(directions[i]));
      if (enriched.type == "source") {
        enriched.title = util.data.representativeStationByID(enriched.station)["displayName"];
      } else if (enriched.type == "walk") {
        enriched.distance = util.c.formatDistance(util.math.naturalGeoDistance(util.data.stationByID(previous)["location"], 
          util.data.stationByID(enriched.exitAt)["location"]));
        enriched.title = util.data.representativeStationByID(enriched.exitAt)["displayName"];
        previous = directions[i].exitAt;
      } else if (enriched.type == "travel") {
        enriched.title = util.data.representativeStationByID(enriched.exitAt)["displayName"];
        previous = directions[i].exitAt;
      }
      if (typeof enriched.cost != 'undefined')
        enriched.cost = Math.round(enriched.cost + proCost);
      
      res.push(enriched);
    }
    var postCost = 0;
    if (g._ptB.type != "station") {
      var dist = util.math.naturalGeoDistance(g._ptB.location, util.data.stationByID(previous)["location"]);
      postCost = 60.0 * dist / _$('walkKmh');
      res.push({ type: "epilogue", distance: util.c.formatDistance(dist), cost: Math.round(res[res.length - 1].cost + postCost) });
    }
    
    var built = g_RoutingDirectionsBuilder[localStorage["l10n"]].build(res);
    return { html: '<li>' + built.join('</li><li>') + '</li>', cost: Math.round(res[res.length - 1].cost) };
  }
};

g_MainMenuScreen = {
  name: "menu-screen",
  onInit: function() {
    $('#bigbutton-map').addEventListener('click', function() {
      if (this.classList.contains('disabled')) return;
      
      navigateTo(g_MapScreen);
      g_MapScreen.onInit();
    });
    $('#bigbutton-network').addEventListener('click', function() {
      navigateTo(g_NetworkViewScreen);
    });
    $('#bigbutton-directions').addEventListener('click', function() {
      if (this.classList.contains('disabled')) return;
      navigateTo(g_DirectionsScreen);
    });
    /*$('#bigbutton-settings').addEventListener('click', function() {
      alert('not implemented');
    });*/
    $('#bigbutton-introduction').addEventListener('click', function() {
      navigateTo(g_IntroductionScreen);
    });
    
    $('.language .selection[data-localization="' + localStorage["l10n"] + '"]').classList.add('active');
    $$('.language .selection').forEach(function(e) {
      e.addEventListener('click', function() {
        localStorage["l10n"] = this.getAttribute("data-localization");
        util.c.reset();
      });
    });
  },
  onDestroy: function() {
    
  }
};

g_IntroductionScreen = {
  name: "introduction-screen",
  onInit: function() {
    $('#finish-introduction').addEventListener('click', function() {
      navigateTo(g_MainMenuScreen);
      $('#introduction-screen').setAttribute('data-position', 'right');
    });
    Hammer($('#introduction-screen'), {
      drag: false, hold: false, tap: false, release: false, touch: false, transform: false, swipe_velocity: 0.6
    }).on('swipeleft', function(ev) {
      if (this.getAttribute("data-position") == 'right') return;
      
      ev.preventDefault();
      ev.gesture.preventDefault();
      ev.gesture.stopDetect();
      
      navigateTo(g_MainMenuScreen);
      $('#introduction-screen').setAttribute('data-position', 'right');
    }).on('swiperight', function(ev) {
      if (this.getAttribute("data-position") == "current") return;
      
      ev.preventDefault();
      ev.gesture.preventDefault();
      ev.gesture.stopDetect();
      
      navigateBack();
    });
    $('#swap-language').addEventListener('click', function() {
      if (localStorage["l10n"] == "sr")
        localStorage["l10n"] = "en";
      else localStorage["l10n"] = "sr";
      window.location.reload();
    });
    $('#introduction-contents').innerHTML = _$$('interface-introductionContents');
  },
  onNavigateTo: function() {
    localStorage["currentScreen"] = g_MainMenuScreen.name;
  }
};

function loadData(callback)
{
  util.c.showElem($('#modal-loading'));
  util.data.load("data/areas/" + localStorage["area"] + ".json", function(a_json) {    
  util.data.load("data/areas/" + localStorage["area"] + "-index.json", function(ai_json) {
    g_AreaIndex = ai_json;
    g_Area = a_json;
    util.data.enrichStations(g_Area["stations"]);
    util.data.Area = g_Area;
    util.data.AreaIndex = g_AreaIndex;
    miroslav.gArea = g_Area;
    miroslav.gAreaIndex = g_AreaIndex;
    util.c.hideElem($('#modal-loading'));
    callback();
  });});

}

$$('.back-button').forEach(function(elem) {
  elem.addEventListener('click', function() { navigateBack(); });
});

$$('.swipable').forEach(function(elem) {
  Hammer(elem, {
    drag: false, hold: false, tap: false, release: false, touch: false, transform: false, swipe_velocity: 0.6
  }).on('swiperight', function(ev) {
    ev.preventDefault();
    ev.gesture.preventDefault();
    ev.gesture.stopDetect();
    
    navigateBack();
  });
});
function closeDirectionsPopup() {
  $('#directions-popup').classList.remove('visible');
  $('#directions-popup').addEventListener('transitionend', function handleTransitionEnd_DP() {
    $('#directions-calculating-wrapper').classList.add('ghostly');
    $('#directions-finished-wrapper').classList.add('ghostly');
    this.removeEventListener('transitionend', handleTransitionEnd_DP);
  }); 
}
$('#show-directions').addEventListener('click', function(e) {
  navigateTo(g_DirectionsScreen);
  window.setTimeout(function() {
    g_RoutingSelections.setA({ type: "not-selected" });
    g_RoutingSelections.setB({ type: "not-selected" });
  }, 500);
  closeDirectionsPopup();
});

$('#hide-directions').addEventListener('click', function(e) {
  closeDirectionsPopup();
});

g_MapScreen.delegate();

g_NetworkViewScreen.onInit();
g_StationInfoScreen.onInit();

g_LineInfoScreen.onInit();
g_DirectionsScreen.onInit();

g_MainMenuScreen.onInit();
g_IntroductionScreen.onInit();

g_ScreenIndex = {
  populate: function() {
    var g = g_ScreenIndex;
    g["station-info-screen"] = g_StationInfoScreen;
    g["line-info-screen"] = g_LineInfoScreen;
    g["map-screen"] = g_MapScreen;
    g["network-view-screen"] = g_NetworkViewScreen;
    g["directions-screen"] = g_DirectionsScreen;
    g['menu-screen'] = g_MainMenuScreen;
    g['introduction-screen'] = g_IntroductionScreen;
    return this;
  }
}
g_ScreenIndex.populate();
g_Routing.init();

localStorage["area"] = "belgrade";
    
if (localStorage["area"] != undefined) {  
  loadData(function() {
    
    g_NetworkViewScreen.recall();
    console.log("previous state says screen was " + localStorage["currentScreen"]);
    if (localStorage["runBefore"] == "yes" && typeof localStorage["currentScreen"] != "undefined" && localStorage["currentScreen"] != g_MainMenuScreen.name) {
      g_Screens.push(g_MainMenuScreen);
      navigateTo(g_ScreenIndex[localStorage["currentScreen"]], true, true);
    }
    else {
      if (localStorage["runBefore"] == "yes")
        navigateTo(g_MainMenuScreen, true);
      else {
        $('#menu-screen').setAttribute('data-position', 'right');
        $('#introduction-screen').setAttribute('data-position', 'current');
        navigateTo(g_IntroductionScreen, true);
        localStorage["runBefore"] = "yes";
      }
    }

    g_DirectionsScreen.recall();
    g_StationInfoScreen.recall();
    g_LineInfoScreen.recall();
  });
} else {
  /*g_Screens.push(g_ChooseAreaScreen);
  util.c.showElem($('#choose-area'));
  util.c.hideElem($('#modal-loading'));*/
}

});
});
