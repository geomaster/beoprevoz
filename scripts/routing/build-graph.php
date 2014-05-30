#!/usr/bin/php
<?php
$json = json_decode(file_get_contents($argv[1]), TRUE);
$index = json_decode(file_get_contents($argv[2]), TRUE);
$times_c = explode("\n", file_get_contents($argv[3]));
$vehicle_vel = explode("\n", file_get_contents($argv[4]));

$times = [];
$velocities = [];
foreach($times_c as $timeentry) {
  $entry = explode(';', $timeentry);
  if (count($entry) > 1)
    $times[$entry[0]] = (double)$entry[1];
}

foreach($vehicle_vel as $vel) {
  $vele = explode(';', $vel);
  if (count($vele) > 1)
    $velocities[$vele[0]] = (double)$vele[1];
}

function toRad($n) {
  return $n * (M_PI / 180.0);
}

function geoDistance($loc1, $loc2) {
  $lat1 = $loc1[0];
  $lon1 = $loc1[1];
  $lat2 = $loc2[0];
  $lon2 = $loc2[1];
  
  $R = 6371.009;
  $dLat = toRad($lat2 - $lat1);
  $dLon = toRad($lon2 - $lon1);
  $lat1 = toRad($lat1);
  $lat2 = toRad($lat2);
  
  $a = sin($dLat/ 2.0) * sin($dLat / 2.0) + sin($dLon / 2.0) * sin($dLon / 2.0) * cos($lat1) * cos($lat2);
  $c = 2 * atan2(sqrt($a), sqrt(1-$a));
  $d = $R * $c;
  return $d; 
}

function natGeoDistance($loc1, $loc2) {
  $v3 = [ "0" => $loc1[0], "1" => $loc2[1] ];
   return (geoDistance($loc1, $loc2) + (geoDistance($loc1, $v3) + geoDistance($loc2, $v3))) / 2.0;
}

$adjacency = [];
$adjacency_walk = [];

$station_count = count($json["stations"]);
for ($i = 0; $i < $station_count; ++$i) {
  $adjacency[$json["stations"][$i]["id"]] = [];
  $adjacency_walk[$json["stations"][$i]["id"]] = [];
}

foreach ($json["lines"] as $line) {
  fprintf(STDERR, "Doing line ".$line["id"]."\n");
  if (!array_key_exists($line["id"], $times)) {
    fprintf(STDERR, "\033[1;31mERROR: No times for line ".$line["id"]."\033[0m\n");
    continue;
  }
  foreach ($line["stations"] as $direction) {
    $sts = count($direction);
    for ($i = 0; $i < $sts; ++$i) {
      $length = 0.0;
      $wt = 0;
      for ($j = $i + 1; $j < $sts; ++$j) {
        
        $wt += $times["wait"];
        $length += geoDistance(
        
          $json["stations"][$index["stations"][$direction[$j - 1]]]["location"],
          $json["stations"][$index["stations"][$direction[$j]]]["location"]
        );
        
        $wait_time = $times[$line["id"]];
        $velocity = $velocities[$line["type"]];
        $weight = $wait_time / 2.0 + $wt + 60.0 * $length / $velocity;
        if (isset($adjacency[$direction[$i]]) && $weight < $adjacency[$direction[$i]])
          $adjacency[$direction[$i]][$direction[$j]] = $weight;
        else $adjacency[$direction[$i]][$direction[$j]] = $weight;
        
      }
    }
  }
}

define('NEAREST_STATION_DISTANCE_KM', 0.4);

$nodes = 0;
for ($i = 0; $i < $station_count; ++$i)
  if ($json["stations"][$i]["id"] != "")
    ++$nodes;
print "nodes $nodes";

for ($i = 0; $i < $station_count; ++$i) {
  fprintf(STDERR, "Doing station $i (".$json["stations"][$i]["id"].")\n");
  
  if ($json["stations"][$i]["id"] == "") 
    continue;
  print " " . $json["stations"][$i]["id"];
    
  for ($j = $i + 1; $j < $station_count; ++$j) {
    $sta = $json["stations"][$i];
    $stb = $json["stations"][$j];
    if (($dist = natGeoDistance($sta["location"], $stb["location"])) <= NEAREST_STATION_DISTANCE_KM) {
      $adjacency_walk[$sta["id"]][$stb["id"]] = $times["walk"] + 60.0 * $dist / $velocities["walk"];
      $adjacency_walk[$stb["id"]][$sta["id"]] = $times["walk"] + 60.0 * $dist / $velocities["walk"];
    }
  }
}
print "\n\n";

$nodes = 0;
$edges = 0;
foreach($json["stations"] as $idx => $station) {
  if ($station["id"] == "") continue;
  print "node ".$station["id"]."\n";
  if (array_key_exists($station["id"], $adjacency))
    foreach($adjacency[$station["id"]] as $adj => $weight) {
      print "adj ".$adj." w ".ceil($weight)."\n";
      $edges++;
    }
  else fprintf(STDERR, "\033[1;31mERROR: No data for station ".$station["id"]."\033[0m\n");
  foreach($adjacency_walk[$station["id"]] as $adj => $weight) {
    print "adjw ".$adj." w ".ceil($weight)."\n";
    $edges++;
  }
  print "\n";
  ++$nodes;
}

fprintf(STDERR, "$nodes nodes and $edges edges written successfully\n");
?>
