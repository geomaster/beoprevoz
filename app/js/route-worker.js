importScripts("miroslav/index.bin.js", "miroslav/data.bin.js", "miroslav/miroslav.js", "lib/base64load.js");

onmessage = function(msg) {
  var d = msg.data;
  
  if (d.type == "route" || d.type == "init") {
    miroslav.gRouting = {
      data: base64DecToArr(__miroslav_data).buffer,
      index: base64DecToArr(__miroslav_index).buffer
    };
    miroslav.init();
  } 
  
  if (d.type == "route") {
    var srcs = d.sources.length, results = [];
    for (var i = 0; i < srcs; ++i) {
      results[i] = miroslav.route(d.sources[i], d.dests);
      postMessage({ type: "routingProgress", amount: (i + 1) / srcs });
    }
    postMessage({ type: "routingComplete", results: results });
  } else if (d.type == "deinit") {
    miroslav.destroy();
  }
};
