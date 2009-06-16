<?php
/**
 * On scripts.mit.edu, the user's sole account can be used
 * both for regular operation of the wiki and for any
 * maintenance.  Therefore, we just use the username and
 * password already set in LocalSettings.php.
 *
 * @package MediaWiki
 */
          
$wgDBadminuser      = $wgDBuser;
$wgDBadminpassword  = $wgDBpassword;
          
/*
 * Whether to enable the profileinfo.php script.
 * (False is the default.)
 */
$wgEnableProfileInfo = false;
          
?>
