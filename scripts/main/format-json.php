#!/usr/bin/php
<?php
$encoded = file_get_contents("php://stdin");
$encoded = preg_replace('/"!\$([^"]+)"/', "_$$('\\1')", $encoded);
print "__g_FileContents = ";
print $encoded;
?>
 
