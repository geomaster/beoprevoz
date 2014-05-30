miroslav = {
  gRouting: {
    index: null,
    data: null
  },
  gArea: null,
  gAreaIndex: null,
  _dests: null,
  _i: null,
  _d: null,
  _h: null,
  _p: null,
  _nc: null,
  init: function() {
    miroslav.destroy();
    
    miroslav._i = new DataView(miroslav.gRouting.index);
    miroslav._d = new DataView(miroslav.gRouting.data);
    miroslav._nc = miroslav._i.getUint32(0, true);
    miroslav._h = new DataView(new ArrayBuffer((miroslav._nc + 10) * 4));
    miroslav._hch = new DataView(new ArrayBuffer((miroslav._nc + 10) * 4));
    miroslav._p = new DataView(new ArrayBuffer((miroslav._nc + 10) * 4));
    miroslav._c = new DataView(new ArrayBuffer((miroslav._nc + 10) * 4));
  },
  destroy: function() {
    miroslav._i = 
    miroslav._d =
    miroslav._nc =
    miroslav._hch = 
    miroslav._h = 
    miroslav._p =
    miroslav._c =
      null;
  },
  route: function(source, dsts) {
    /*
     * "If 10 years from now, when you are doing something quick and
     * dirty, you suddenly visualize that I am looking over your
     * shoulders and say to yourself: 'Dijkstra would not have liked
     * this', well that would be enough immortality for me."
     *                                         -- Edsger Wybe Dijkstra
     *                                           5.11.1930 - 6.08.2002
     * 
     * In your honor, Edsger, I am writing this code today in a way
     * I believe to be right. With no dirty hacks, no kludges. I am 
     * writing what I believe, from the bottom of my heart, is good
     * Javascript. Although we don't like it, Edsger, it's a job. But
     * I want to do my job the right way.
     * 
     * You will not be forgotten.
     */
    var index_shift = 2, data_shift = 1, internal_shift = 2, _hc = 0,
        _i = miroslav._i, _d = miroslav._d, _h = miroslav._h, _p = miroslav._p,
        _hch = miroslav._hch, _nc = miroslav._nc, _c = miroslav._c, maxInt = 0xffffffff;

    function getNodeTag(idx) {
      return _i.getUint32((1 + idx * 3) << index_shift, true);
    }
    function getAdjacencyListOffset(idx) {
      return _i.getUint32((2 + idx * 3) << index_shift, true);
    }
    function getAdjacencyListLength(idx) {
      return _i.getUint32((3 + idx * 3) << index_shift, true);
    }
    function getAdjacentVertex(offset, idx) {
      return _d.getUint16((offset + idx * 3) << data_shift, true);
    }
    function getEdgeWeight(offset, idx) {
      return _d.getUint16((offset + idx * 3 + 1) << data_shift, true);
    }
    function isWalkingEdge(offset, idx) {
      return _d.getUint16((offset + idx * 3 + 2) << data_shift, true);
    }
    function getParent(idx) {
      var p = _p.getInt32(idx << internal_shift, true);
      if (p == 0) return undefined;
      if (p < 0) p = -p;
      --p;
      return p;
    }
    function isParentWalking(idx) {
      return _p.getInt32(idx << internal_shift, true) < 0;
    }
    function setParent(idx, parent, isWalk) {
      if (typeof parent == 'undefined') 
        parent = 0;
      else ++parent;
      if (isWalk) parent = -parent;
      _p.setInt32(idx << internal_shift, parent, true);
    }
    function getCost(idx) {
      return _c.getUint32(idx << internal_shift, true);
    }
    function setCost(idx, cost) {
      _c.setUint32(idx << internal_shift, cost, true);
    }
    function findInHeap(idx) {
      return _hch.getUint32(idx << internal_shift, true);
    }
    function _cacheInHeap(h_idx) {
      _hch.setUint32(_getHeapElem(h_idx) << internal_shift, h_idx, true);
    }
    function _getHeapElem(h_idx) {
      return _h.getUint32(h_idx << internal_shift, true);
    }
    function _setHeapElem(h_idx, val) {
      _h.setUint32(h_idx << internal_shift, val, true);
      _cacheInHeap(h_idx);
    }
    function _swapHeapElems(h_idx1, h_idx2) {
      var temp = _getHeapElem(h_idx1);
      _setHeapElem(h_idx1, _getHeapElem(h_idx2));
      _setHeapElem(h_idx2, temp);
    }
    function heapDecreaseKey(h_idx) {
      /* while parent>child, i.e. unnatural condition */
      while (h_idx > 0 && getCost(_getHeapElem((h_idx - 1) >> 1)) > getCost(_getHeapElem(h_idx))) {
        var par = (h_idx - 1) >> 1;
        _swapHeapElems(par, h_idx);
        h_idx = par;
      }
    }
    function heapIncreaseKey(h_idx) {
      var it = h_idx;
      do {
        var larger = it, l = (it << 1) + 1, r = (it << 1) + 2;
        if (l < _hc && getCost(_getHeapElem(l)) < getCost(_getHeapElem(larger)))
          larger  = l;
        if (r < _hc && getCost(_getHeapElem(r)) < getCost(_getHeapElem(larger)))
          larger  = r;
          
        if (larger != it) {
          _swapHeapElems(larger, it);
          it = larger;
        } else break;
      } while (true);
    }
    function heapPush(idx) {
      var i = _hc++;
      _setHeapElem(i, idx);
      heapDecreaseKey(i);
    }
    function heapPop() {
      if (_hc == 0) return -1;
      var first = _getHeapElem(0);
      _setHeapElem(0, _getHeapElem(--_hc));
      heapIncreaseKey(0);
      
      return first;
    }
    function heapLength() {
      return _hc;
    }
    
    var destinations = [];
    for (var i = 0; i < dsts.length; ++i)
      if (dsts[i] != source)
        destinations.push(dsts[i]);
        
    /* routing start */
    
    /* find real indexes of the source-dest nodes */
    var dl = destinations.length, toFind = 1 + dl, iSource, iDestinations = [];
    for (var i = 0; toFind > 0 && i < _nc; ++i) {
      var tag = getNodeTag(i);
      if (tag == source) {
        iSource = i;
        --toFind;
      } else {
        for (var j = 0; j < dl; ++j)
          if (tag == destinations[j]) {
            iDestinations[j] = i;
            --toFind;
          }
      }
    }
    
    /* initialize the heap. it is contructed in a reverse way which
     * is not better performance-wise, but the difference is too small
     * to be taken into account */
    for (var i = 0; i < _nc; ++i) {
      setCost(i, maxInt);
      heapPush(i);
    }
    setCost(iSource, 0);
    heapDecreaseKey(findInHeap(iSource));
    
    /* start dijkstra's algorithm. the following was zero-brain copied
     * from wikipedian pseudocode to avoid any issues with my brain that
     * would require further lobotomy as I'm in a no financial position
     * to pay for it. */
    toFind = dl, found = [];
    for (var i = 0; i < dl; ++i) found[i] = false;
    while (toFind > 0 && heapLength() > 0) {
      var u = heapPop(), cost = getCost(u);
      
      /* test if we reached something */
      for (var i = 0; i < dl; ++i)
        if (!found[i] && u == iDestinations[i]) {
          --toFind;
          found[i] = true;
        }
        
      /* no reachable from here */
      if (cost == maxInt)
        break;
        
      /* try each neighboring node */
      var off = getAdjacencyListOffset(u), len = getAdjacencyListLength(u);
      for (var i = 0; i < len; ++i) {
        var v = getAdjacentVertex(off, i),
            d = cost + getEdgeWeight(off, i);
            
        /* this path is better? */
        if (d < getCost(v)) {
          /* make it so */
          setCost(v, d);
          setParent(v, u, isWalkingEdge(off, i));
          heapDecreaseKey(findInHeap(v));
        }
      }
    }
    
    /* trace the path through the parents */
    var paths = [];
    for (var i = 0; i < dl; ++i) {
      if (typeof getParent(iDestinations[i]) != "undefined") {
        paths[i] = [];
        var mnode = iDestinations[i], seen = [];
        while (mnode != iSource && !seen[mnode]) {
          paths[i].push({ walk: isParentWalking(mnode), node: getNodeTag(mnode), cost: getCost(mnode) });
          seen[mnode] = true;
          mnode = getParent(mnode);
        }
        paths[i].push({ type: "source", node: source, cost: 0 });
      } else 
        paths[i] = [ { type: "noPath" } ];
    }
    
    return paths;
  },  
  unveilPath: function(rawPath) {
    var l = rawPath.length, g_Area = miroslav.gArea;
    
    if (rawPath[0].type == "noPath")
      return [ { type: "noPath" } ];
    
    for (var i = 0; i < l; ++i) {
      rawPath[i].node = g_AreaIndex["stations"][rawPath[i].node];

    }

    var currentStation = g_Area["stations"][rawPath[l - 1].node], result = [ {type: "source", station: currentStation["id"] } ];
    for (var i = l - 2; i >= 0; --i) {
      var next = g_Area["stations"][rawPath[i].node];
      if (rawPath[i].walk) {
        result.push( {type: "walk", exitAt: next["id"], cost: rawPath[i].cost} );
      } else {
        var oplines = util.data.getOperatingLines([ rawPath[i].node ]), eligibleLines = [];
        for (var j = 0; j < oplines.length; ++j) {
          var line = util.data.lineByID(oplines[j]), stations = line["stations"];
          
          var currentPos = [ ], nextPos = [ ], cyclic = [];
          for (var k = 0; k < stations.length; ++k) {
            currentPos[k] = -1; nextPos[k] = -1;
            cyclic[k] = (stations[k][0] == stations[k][stations[k].length - 1]);
            for (var l = 0; l < stations[k].length; ++l)
              if (currentPos[k] == -1 && stations[k][l].toString() == currentStation["id"])
                currentPos[k] = l;
              else if (nextPos[k] == -1 && stations[k][l].toString() == next["id"])
                nextPos[k] = l;
          }
          
          var isEligible = false, dir = -1;
          for (var k = 0; k < stations.length; ++k)
            if (currentPos[k] != -1 && nextPos[k] != -1 && (cyclic[k] || nextPos[k] >= currentPos[k])) {
              isEligible = true;
              dir = k;
              break;
            }
            
          if (isEligible)
            eligibleLines.push({ line: oplines[j], stationCount: nextPos[k] - currentPos[k] });
        }
        
        rz = { type: "travel", exitAt: next["id"], lines: [], stationCount: [], cost: rawPath[i].cost };
        for (var j = 0; j < eligibleLines.length; ++j) {
          rz.lines[j] = eligibleLines[j].line;
          rz.stationCount[j] = eligibleLines[j].stationCount;
        }
        
        result.push(rz);
      }
      
      currentStation = next;
    }
    
    return result;
  }
};
