#!/usr/bin/php
<?php
$source_json = json_decode(file_get_contents("php://stdin"), TRUE);
$index = [
  "stations" => [],
  "lines" => [],
  "stationLines" => [],
  "types" => []
];

$source_stations = &$source_json["stations"];
$station_count = count($source_stations);

for ($i = 0; $i < $station_count; ++$i) {
  $stat = &$source_stations[$i];
  $index["stations"][$stat["id"]] = $i;
  
  $index["stationLines"][$stat["id"]] = [];
}

$source_lines = &$source_json["lines"];
$line_count = count($source_lines);

for ($i = 0; $i < $line_count; ++$i) {
  $line = &$source_lines[$i];
  $index["lines"][$line["id"]] = $i;
  if (!array_key_exists($line["type"], $index["types"]))
    $index["types"][$line["type"]] = [ $line["id"] ];
  else $index["types"][$line["type"]][] = $line["id"];
  
  $stat_lines = &$index["stationLines"];  
  foreach($line["stations"] as &$direction)
    foreach($direction as &$station)
      $stat_lines[$station][] = $line["id"];
}

foreach($index["stationLines"] as $key => &$val) {
  $val = array_unique($val);
  sort($val);
}

ksort($index["stations"], SORT_NATURAL);
ksort($index["lines"], SORT_NATURAL);

$index["sortedStations"] = array_keys($index["stations"]);
$index["sortedLines"] = array_keys($index["lines"]);

foreach($index["types"] as &$type)
  sort($type, SORT_NATURAL);
print json_encode($index, JSON_PRETTY_PRINT);

?>
