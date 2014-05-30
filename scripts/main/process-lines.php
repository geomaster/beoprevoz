#!/usr/bin/php
<?php
require_once('common.php');

$line_types = [
  2, 3, 1
];

$final_json = [];

$allowed_lines = [
  "2" => true,"3" => true,"5" => true,"6" => true,"7" => true,"7L"=>true,"9" => true,"10" => true,"11" => true,"12" => true,"13" => true,"14" => true,"19" => true,"21" => true,"22" => true,"28" => true,"29" => true,"40" => true,"41" => true,"15" => true,"16" => true,"17" => true,"18" => true,"20" => true,"23" => true,"24" => true,"25" => true,"25P" => true,"27" => true,"26" => true,"26L" => true,"27" => true,"27E" => true,"30" => true,"31" => true,"32" => true,"32E" => true,
  "33" => true,"34L" => true,"35" => true,"35L" => true,"37" => true,"38" => true,"39" => true,"42" => true,"43" => true,"44" => true,"45" => true,"46" => true,"47" => true,"48" => true,"49" => true,"50" => true,"51" => true,"52" => true,"53" => true,"54" => true,"55" => true,"56" => true,"56L" => true,"57" => true,"58" => true,"59" => true,"60" => true,"65" => true,"67" => true,"68" => true,"69" => true,"71" => true,"72" => true,"73" => true,
  "74" => true,"75" => true,"76" => true,"77" => true,"78" => true,"79" => true,"81" => true,"81L" => true,"82" => true,"83" => true,"84" => true,"85" => true,"87" => true,"88" => true,"89" => true,"91" => true,"92" => true,"94" => true,"95" => true,"96" => true,"101" => true,"102" => true,"104" => true,"105" => true,"106" => true,"107" => true,"108" => true,"109" => true,"110" => true,"202" => true,"302" => true,"302L" => true,
  "303" => true,"304" => true,"305" => true,"306" => true,"307" => true,"308" => true,"309" => true,"310" => true,"400" => true,"401" => true,"402" => true,"403" => true,"405" => true,"405L" => true,"406" => true,"407" => true,"408" => true,"503" => true,"504" => true,"511" => true,"512" => true,"521" => true,"522" => true,"531" => true,"532" => true,"533" => true,
  "534" => true,"551" => true,"552" => true,"601" => true,"602" => true,"603" => true,"604" => true,"605" => true,"606" => true,"610" => true,"611" => true,"612" => true,"700" => true,"702" => true,"703" => true,"704" => true,"705" => true,"706" => true,"706E" => true,"707" => true,"708" => true,"709" => true,"711" => true
];

$stations_alt_json = [];
$stations_final_json = [];
$stations_cp = [];

foreach($line_types as $line_type) {
  $combo = curl_get("https://busplus.rs/comboLinije.php?kodLinije=$line_type");
  $regex = 
    '/<OPTION value="([0-9a-zA-Z]+)">([^<]+)<\/OPTION>/';
    
  preg_match_all($regex, $combo, $matches, PREG_SET_ORDER);
  
  foreach($matches as $match) {
    
    $line_id = $match[1];
    $line_name = $match[2];
    
    if (!array_key_exists($line_name, $allowed_lines))
      continue;
      
    fprintf(STDERR, "Doing line $line_name\n");
    $url = "https://busplus.rs/stanice.php?linija=$line_type&prikazi=Prikaži&idLinije=$line_id&smer=";
    $dirs = [ "A", "B" ];
    $line_var = [ "id" => $line_name, "type" => "unknown", "stations" => [] ];
    
    $sts = 0;
    foreach($dirs as $dir) {
      $url_ = $url . $dir;
      $result = [];
      $data = curl_get($url_);
      
      $regex = 
        '/<div style="height:60px; width: 150px;">([^<]+)<br\/> [^<]+: ([0-9]+)(?:<br\/>)?<\/div>/';
      $regex2 = 
        '/position: new google\.maps\.LatLng\(([.0-9]+), ([.0-9]+)\)/';
        
      preg_match_all($regex, $data, $matches2, PREG_SET_ORDER);
      preg_match_all($regex2, $data, $sidematches, PREG_SET_ORDER);
      
      $i = 0;
      foreach($matches2 as $match2) {
        if ((int)$match2[2] > 90000)
          $match2[2] = (int)$match2[2] - 90000;
          
        $result[] = (int)$match2[2];
        $stations_alt_json[(int)$match2[2]] = [
          "name" => $match2[1],
          "location" => [
            (float)$sidematches[$i][1],
            (float)$sidematches[$i][2]
          ]
        ];
        ++$sts;
        ++$i;
      }
      $line_var["stations"][] = $result;
    }
    fprintf(STDERR, "  Total $sts stations\n");
    
    $final_json[] = $line_var;
  }
}

$f_stations_alt = fopen($argv[1], "w");
$f_stations_raw = fopen($argv[2], "w");
$f_stations_cp = fopen($argv[3], "w");

ksort($stations_alt_json, SORT_NATURAL);
fwrite($f_stations_raw, implode(array_keys($stations_alt_json), "\n")."\n");
fclose($f_stations_raw);
fwrite($f_stations_alt, json_encode($stations_alt_json, JSON_PRETTY_PRINT));
fclose($f_stations_alt);

$previous = -1;
$prevName = "";
foreach($stations_alt_json as $id => $data) {
  $triv = trivialize_station_name($data["name"]);
  
  if ((int)$id - $previous == 1 && $triv == $prevName) {
    $stations_cp[$id] = $previous;
    $stations_cp[$previous] = $id;
  }
  
  $previous = $id;
  $prevName = $triv;
}

fwrite($f_stations_cp, json_encode($stations_cp, JSON_PRETTY_PRINT));
fclose($f_stations_cp);

print json_encode($final_json, JSON_PRETTY_PRINT);

?>
