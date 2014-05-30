#!/usr/bin/php
<?php
require_once('common.php');

$lines = [
  2,3,5,6,7,9,10,11,12,13,14,19,21,22,28,29,40,41,15,16,17,18,20,23,24,25,2566,27,26,2688,27,2799,30,31,32,3299,
  33,3488,35,3588,37,38,39,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,5688,57,58,59,60,65,67,68,69,71,72,73,
  74,75,76,77,78,79,81,8188,82,83,84,85,87,88,89,91,92,94,95,96,101,102,104,105,106,107,108,109,110,202,302,30288,
  303,304,305,306,307,308,309,310,400,401,402,403,405,40588,406,407,408,503,504,511,512,521,522,531,532,533,
  534,551,552,601,602,603,604,605,606,610,611,612,700,702,703,704,705,706,70699,707,708,709,711
];

function xform_line($line) {
  return str_replace(["Л", "Е", "П"], ["L", "E", "P"], $line);
}
foreach($lines as $line) {
  $fcon = file_get_contents("http://gsp.rs/linija.asp?id=".$line);
  $fcon = str_replace([ "\t", " ", "\n", "\r" ], "", $fcon);
  if (!preg_match("/ЛИНИЈА([^<>]+)/", $fcon, $matches)) {
    fprintf(STDERR, "ERROR: Could not retrieve data for line $line\n");
    continue;
  }
  
  $linestr = xform_line($matches[1]);
  
  $res = preg_match_all("/<fontface=tahomasize=1color=000000>([0-9\/]+)<\/div>/", $fcon, $matches, PREG_SET_ORDER);
  $str = "$linestr;";
  fprintf(STDERR, "Doing line $linestr\n");
  if ($res < 4) {
    fprintf(STDERR, "\033[1;31mERROR: Could not reliably get times for line $line, investigate\033[0m\n");
    $str .= "NO-TIMES";
  } else {
    $mc = count($matches);
    $intv = [];
    for ($i = 0; $i < $mc; ++$i) {
      $this_interval = $matches[$i][1];
      if (is_numeric($this_interval))
        $intv[] = $this_interval;
      else $intv[] = explode('/', $this_interval)[0];
    }
    
    $main_interval = (20.0 / 24.0) * $intv[0] + (4.0 / 24.0) * $intv[1];
    $intval = (5.0 / 7.0) * $main_interval + (1.0 / 7.0) * $intv[2] +
              (1.0 / 7.0) * $intv[3];
              
    $str .= round($intval);
  }
  print $str."\n";
}

?>
