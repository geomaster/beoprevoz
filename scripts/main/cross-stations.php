#!/usr/bin/php
<?php
$stations_json = json_decode(file_get_contents($argv[1]), TRUE);
$stations_raw = explode("\n", file_get_contents($argv[2]));
$stations_cp = json_decode(file_get_contents($argv[3]), TRUE);

$populated = [];
$json = [];

$i = 0;
$complained = [];

foreach ($stations_raw as $station_entry) {
  if (array_key_exists($station_entry, $populated)) continue;
  if (!array_key_exists($station_entry, $stations_json) && !array_key_exists($station_entry, $complained)) {
    fprintf(STDERR, "[ERROR] No info on station $station_entry, ignoring\n");
    //$json[] = [ "id" => $station_entry, "displayName" => "/No station info/", "location" => [0,0], "anchor" => [0, 0] ];    
    $complained[$station_entry] = TRUE;
    
    continue;
  }
  $populated[$station_entry] = TRUE;

  $location = [ (double)$stations_json[$station_entry]["location"][0], (double)$stations_json[$station_entry]["location"][1] ];
  $locsum = $location;
  
  $linked = 1;
  $this_station = [ "id" => $station_entry, "displayName" => $stations_json[$station_entry]["name"], "location" => $location ];
  $json[$i] = $this_station;
  $idxs = [ $i++ ];
  
  if (
    (array_key_exists((string)((int)$station_entry + 1), $stations_json) && $stations_json[(int)$station_entry + 1]["name"] == $this_station["displayName"] && ($cp = (string)((int)$station_entry + 1))) ||
    (array_key_exists((string)((int)$station_entry - 1), $stations_json) && $stations_json[(int)$station_entry - 1]["name"] == $this_station["displayName"] && ($cp = (string)((int)$station_entry - 1))) ||
    (array_key_exists($station_entry, $stations_cp) && ($cp = $stations_cp[$station_entry]))
    ) {
    if (!array_key_exists($cp, $populated) && array_key_exists($cp, $stations_json)) {
      $loc2 = [ (double)$stations_json[$cp]["location"][0], (double)$stations_json[$cp]["location"][1] ];
      $new_station = 
        [ "id" => (string)$cp, "location" => $loc2 ];
        
      $populated[$cp] = TRUE;
      $locsum = [ (double)$locsum[0] + (double)$loc2[0], (double)$locsum[1] + (double)$loc2[1] ];
      $json[$i] = $new_station;
      $idxs[] = $i++;
      
      ++$linked;
    }
  }
  
  $anchor = [ (double)$locsum[0] / (double)$linked, (double)$locsum[1] / (double)$linked ];
  foreach ($idxs as $idx) {
    $json[$idx]["anchor"] = $anchor;
  }
  if (count($idxs) == 0) {fprintf(STDERR, "OH GOD NO I'VE NEVER SEEN SO MUCH BLOOD\n");die();}
}

print json_encode($json, JSON_PRETTY_PRINT);

?>
