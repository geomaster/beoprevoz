#!/usr/bin/php
<?php
$lines_json = json_decode(file_get_contents($argv[1]), TRUE);
$stations_json = json_decode(file_get_contents($argv[2]), TRUE);

$output = [];

foreach($lines_json as $line) {
  if ($line == null || !array_key_exists("id", $line)) continue;
  
  foreach($line["stations"] as $direction) {
    $out_dir = [];
    foreach($direction as $path_elem) {
      if (!array_key_exists($path_elem, $stations_json)) {
        fprintf(STDERR, "[ERROR] No station $path_elem, skipping\n");
        continue;
      }
      $out_dir[] = [ (double)$stations_json[$path_elem]["location"][0], (double)$stations_json[$path_elem]["location"][1] ];
    }
    $output[$line["id"]][] = $out_dir;
  }
}

print json_encode($output, JSON_PRETTY_PRINT);

?>
