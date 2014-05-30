#!/usr/bin/php
<?php
$json = json_decode(file_get_contents($argv[1]), TRUE);
$stations_json = json_decode(file_get_contents($argv[2]), TRUE);
$lines_json = json_decode(file_get_contents($argv[3]), TRUE);
$linetypes_json = json_decode(file_get_contents($argv[4]), TRUE);
$paths = json_decode(file_get_contents($argv[5]), TRUE);
$alt_stations = json_decode(file_get_contents($argv[7]), TRUE);

$path_weight = (int)$argv[6];

$type_default = $linetypes_json["default"];
$types = [];

foreach ($linetypes_json["types"] as $typename => $type) {
  foreach ($type as $line)
    $types[$line] = $typename;
}

$json["stations"] = $stations_json;
$json["lines"] = [];

foreach ($lines_json as $line) {
  if ($line == null || !array_key_exists("id", $line)) continue;
  
  if (!array_key_exists($line["id"], $types)) $line["type"] = $type_default;
  else $line["type"] = $types[$line["id"]];
  
  foreach($line["stations"] as &$stationArray) {
    $newArr = [];
    foreach($stationArray as $station) {
      if (array_key_exists($station, $alt_stations))
        $newArr[] = $station;
      else {
        fprintf(STDERR, "[ERROR] No station $station, silently skipping it\n");
      }
    }
    $stationArray = $newArr;
  }
  if (array_key_exists($line["id"], $paths)) {
    $line["paths"] = $paths[$line["id"]];
    $line["pathWeight"] = $path_weight;
  }
    
  $json["lines"][] = $line;
}

ksort($json["lines"], SORT_NATURAL);
ksort($json["stations"], SORT_NATURAL);

$encoded = json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
print $encoded;
?>
