#!/usr/bin/php
<?php
$json = json_decode(file_get_contents('php://stdin'), TRUE);
$reindex = [];

foreach($json as $station_unit) {
  $name = $station_unit["name"];
  foreach ($station_unit["stops"] as $station) {
    $no = $station["number"];
    $reindex[$no] = [ "name" => $name, "location" => $station["coords"] ];
  }
}

print json_encode($reindex, JSON_PRETTY_PRINT);

?>
