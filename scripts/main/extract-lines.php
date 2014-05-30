#!/usr/bin/php
<?php
$f = file_get_contents("php://stdin");
if (strpos($f, "СМЕР Б") === FALSE) {
  fprintf(STDERR, "no direction B! help me, oh jesus, I feel so lost... somebody...\n");
  die();
}

$direction = [ [], [] ];
$stations_counterpart = [];
$stations_cache = [ ];

$out_main = fopen($argv[1], "w");
$out_counterparts = fopen($argv[2], "w");
$out_stationdep = fopen($argv[3], "w");

$line_no = $argv[4];
$line_type = $argv[5];

$debris = explode("\n", $f);
$len = count($debris);

$total_id = array_search("Укупно стајалишта", $debris);
$total = [ (int)$debris[$total_id + 1], (int)$debris[$total_id + 3] ];

$quota = [ 0, 0 ];
$raw_stations = [];

function do_work($i, $j) {
  global $debris, $stations_counterpart, $stations_cache, $direction,
         $raw_stations;
  
  $station_no = (int)$debris[$i];
  $station_title = $debris[$i + 1];
  if (array_key_exists($station_title, $stations_cache))
    $stations_counterpart[$stations_cache[$station_title]] = $station_no;
  else $stations_cache[$station_title] = $station_no;
  
  $direction[$j][] = $station_no;  
  $raw_stations[] = $station_no;
}

$init_line = 0;
while (!ctype_digit(substr($debris[++$init_line], 0, 1)) || strlen($debris[$init_line]) > 5);

$quota = 0;
for ($i = $init_line; $i < $len && $quota < $total[0]; $i += 8) {
  do_work($i, 0);
  ++$quota;
} 

$quota = 0;
for ($i = $init_line + 4; $i < $len && $quota < $total[1]; $i += 8 ) {
  do_work($i, 1);
  ++$quota;
} 

$json = [ "type" => $line_type,
          "id" => $line_no,
          "stations" =>
            $direction,
        ];
        
fwrite($out_main, json_encode($json, JSON_PRETTY_PRINT));
fclose($out_main);
fwrite($out_counterparts, json_encode($stations_counterpart, JSON_PRETTY_PRINT));
fclose($out_counterparts);
fwrite($out_stationdep, implode("\n", $raw_stations)."\n");
fclose($out_stationdep);

?>
