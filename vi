<?php
# Place this file in extension directory as Mtag.php
# Add the following line to LocalSettings.php:
# include './extensions/Mtag.php';
# Mediawiki will render as LaTeX the code within <m> </m> tags.

$wgExtensionFunctions[] = "wfMtag";

function wfMtag() {
        global $wgParser;
        $wgParser->setHook( "m", "returnMtagged" );
}

function returnMtagged( $code, $argv)
{

# if you have mathtex.cgi installed:
# $txt='<img src="/cgi-bin/mathtex.cgi?'.$code.'">';
# OR if you want to temporarily test a public mathtex.cgi:
 $txt='<img src="http://www.forkosh.com/mathtex.cgi?'.$code.'">';

 return $txt;
}

?>
