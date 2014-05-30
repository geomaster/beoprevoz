<?php
function curl_get($url, array $options = array())
{   
    $defaults = array(
        CURLOPT_URL => $url,
        CURLOPT_HEADER => 0,
        CURLOPT_RETURNTRANSFER => TRUE,
        CURLOPT_TIMEOUT => 4
    );
   
    $ch = curl_init();
    curl_setopt_array($ch, ($options + $defaults));
    if( ! $result = curl_exec($ch))
    {
        trigger_error(curl_error($ch));
    }
    curl_close($ch);
    return $result;
}

function trivialize_station_name($name) {
  $oname=$name;
  $name = trim($name);
  $name = str_replace([ " ", "\t", "\n" ], "", $name);
  $name = mb_strtolower($name, "UTF-8");
  $name = str_replace([ "č", "ć", "š", "đ", "ž", "о" /* jebeno sranje jebeni busplus kurac sajt ima jebeno cirilicno slovo o usred latinice jebem vam sve do sestog kolena unazad da vam jebem ojadiste me dok sam provalio*/], [ "c", "c", "s", "dj", "z", "o" ], $name);
  $name = preg_replace('/[^a-zA-Z0-9]/', "", $name);
  
  return $name;
}

function fix_station_title_because_busplus_is_fucking_retarded($title) {
  return str_replace("о", "o", $title);
}

function report($msg) {
 fwrite(STDERR, $msg."\n");
}

?>
